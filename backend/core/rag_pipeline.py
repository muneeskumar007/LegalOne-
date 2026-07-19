"""
integration_rag_pipeline.py
─────────────────────────────────────────────────────────────────
REPLACEMENT for legalone/backend/core/rag_pipeline.py

DROP THIS FILE INTO: legalone/backend/core/rag_pipeline.py

What changed from original:
  OLD → 20 hardcoded legal provisions in LEGAL_CORPUS list
  NEW → Loads your real FAISS index built from 30+ judgment PDFs

Auto-fallback chain:
  1. Try real FAISS index  (your 30 PDF dataset)
  2. Try built-in corpus   (original 20 hardcoded provisions)
  3. Return empty          (system still runs, just weaker)

So even if the dataset is not ready, LegalOne still works.
"""

import os
import json
import pickle
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional

# ─── Lazy imports ────────────────────────────────────────────────────────────
_sentence_transformer = None
_faiss_module         = None
_real_index           = None        # FAISS index from your dataset
_real_documents       = []          # metadata from your dataset
_builtin_index        = None        # fallback: original 20 provisions
_builtin_documents    = []

MODEL_NAME = "all-MiniLM-L6-v2"

# ─── Path configuration ──────────────────────────────────────────────────────
# This file lives at: legalone/backend/core/rag_pipeline.py
# Dataset lives at:   legalone/dataset/faiss_index/
BASE_DIR     = Path(__file__).parent.parent          # → legalone/backend/
PROJECT_ROOT = BASE_DIR.parent                        # → legalone/

DATASET_INDEX_PATH    = PROJECT_ROOT / "dataset" / "faiss_index" / "legal_rag"
DATASET_METADATA_PATH = str(DATASET_INDEX_PATH) + "_metadata.pkl"
DATASET_FAISS_PATH    = str(DATASET_INDEX_PATH) + ".faiss"

# Legacy paths (built-in index from original system)
BUILTIN_INDEX_PATH    = BASE_DIR / "data" / "faiss_index.pkl"
BUILTIN_DOCS_PATH     = BASE_DIR / "data" / "documents.json"


# ─── Built-in fallback corpus (original 20 provisions) ───────────────────────
# Keep this so LegalOne works even without the dataset
LEGAL_CORPUS: List[Dict[str, str]] = [
    {
        "id": "ICA_10", "act": "Indian Contract Act, 1872", "section": "Section 10",
        "title": "What agreements are contracts",
        "text": "All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void."
    },
    {
        "id": "ICA_37", "act": "Indian Contract Act, 1872", "section": "Section 37",
        "title": "Obligation of parties to contracts",
        "text": "The parties to a contract must either perform, or offer to perform, their respective promises, unless such performance is dispensed with or excused under the provisions of this Act, or of any other law."
    },
    {
        "id": "ICA_73", "act": "Indian Contract Act, 1872", "section": "Section 73",
        "title": "Compensation for breach of contract",
        "text": "When a contract has been broken, the party who suffers by such breach is entitled to receive compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach."
    },
    {
        "id": "CPC_9", "act": "Code of Civil Procedure, 1908", "section": "Section 9",
        "title": "Courts to try all civil suits unless barred",
        "text": "The Courts shall have jurisdiction to try all suits of a civil nature excepting suits of which their cognizance is either expressly or impliedly barred."
    },
    {
        "id": "CPC_O7R1", "act": "Code of Civil Procedure, 1908", "section": "Order VII Rule 1",
        "title": "Particulars to be contained in plaint",
        "text": "Every plaint shall contain: the name of the Court; names and addresses of parties; facts constituting the cause of action; the relief claimed; valuation for court fees."
    },
    {
        "id": "IEA_101", "act": "Indian Evidence Act, 1872", "section": "Section 101",
        "title": "Burden of proof",
        "text": "Whoever desires any Court to give judgment as to any legal right or liability dependent on the existence of facts which he asserts, must prove that those facts exist."
    },
    {
        "id": "IEA_102", "act": "Indian Evidence Act, 1872", "section": "Section 102",
        "title": "On whom burden of proof lies",
        "text": "The burden of proof in a suit or proceeding lies on that person who would fail if no evidence at all were given on either side."
    },
    {
        "id": "NIA_138", "act": "Negotiable Instruments Act, 1881", "section": "Section 138",
        "title": "Dishonour of cheque for insufficiency of funds",
        "text": "Where any cheque drawn by a person is returned by the bank unpaid due to insufficient funds, such person shall be deemed to have committed an offence punishable with imprisonment or fine or both."
    },
    {
        "id": "NIA_139", "act": "Negotiable Instruments Act, 1881", "section": "Section 139",
        "title": "Presumption in favour of holder",
        "text": "It shall be presumed, unless the contrary is proved, that the holder of a cheque received the cheque for the discharge of any debt or liability."
    },
    {
        "id": "HMA_13", "act": "Hindu Marriage Act, 1955", "section": "Section 13",
        "title": "Divorce grounds",
        "text": "Any marriage solemnised may, on a petition presented by either the husband or the wife, be dissolved by a decree of divorce on grounds including adultery, cruelty, desertion for two years, conversion, unsoundness of mind, leprosy, venereal disease, renunciation, and presumption of death."
    },
    {
        "id": "HMA_13_1_IA", "act": "Hindu Marriage Act, 1955", "section": "Section 13(1)(ia)",
        "title": "Divorce on ground of cruelty",
        "text": "A divorce may be granted if the respondent has, after the solemnization of the marriage, treated the petitioner with cruelty. Cruelty includes both physical and mental cruelty. Mental cruelty is conduct which inflicts suffering upon the other party to such a degree that it becomes impossible to live together."
    },
    {
        "id": "HMA_13B", "act": "Hindu Marriage Act, 1955", "section": "Section 13B",
        "title": "Divorce by mutual consent",
        "text": "Subject to the provisions of this Act, a petition for dissolution of marriage by a decree of divorce may be presented to the district court by both the parties to a marriage together, whether such marriage was solemnised before or after the commencement of the Marriage Laws (Amendment) Act, 1976, on the ground that they have been living separately for a period of one year or more, that they have not been able to live together and that they have mutually agreed that the marriage should be dissolved."
    },
    {
        "id": "HSA_6", "act": "Hindu Succession Act, 1956", "section": "Section 6",
        "title": "Devolution of interest in coparcenary property",
        "text": "On and from the commencement of the Hindu Succession (Amendment) Act, 2005, in a Joint Hindu family governed by the Mitakshara law, the daughter of a coparcener shall by birth become a coparcener in her own right the same manner as the son."
    },
    {
        "id": "HSA_15", "act": "Hindu Succession Act, 1956", "section": "Section 15",
        "title": "General rules of succession in case of females",
        "text": "The property of a female Hindu dying intestate shall devolve firstly upon the sons and daughters and the husband; secondly upon the heirs of the husband; thirdly upon the mother and father; fourthly upon the heirs of the father; and lastly upon the heirs of the mother."
    },
    {
        "id": "LA_18", "act": "Limitation Act, 1963", "section": "Article 18",
        "title": "Suit on money lent",
        "text": "For a suit on money lent under an agreement that it shall be payable on demand: three years from the date when the loan is made."
    },
    {
        "id": "SRA_38", "act": "Specific Relief Act, 1963", "section": "Section 38",
        "title": "Perpetual injunction when granted",
        "text": "A perpetual injunction may be granted to prevent the breach of an obligation existing in the plaintiff's favour, whether expressly or by implication. When the defendant invades or threatens to invade the plaintiff's right to property, the court may grant a perpetual injunction."
    },
    {
        "id": "CrPC_125", "act": "Code of Criminal Procedure, 1973", "section": "Section 125",
        "title": "Maintenance of wives, children and parents",
        "text": "If any person having sufficient means neglects or refuses to maintain his wife, his legitimate or illegitimate minor child, or his legitimate or illegitimate child (not being a married daughter) who has attained majority, where such child is unable to maintain itself, a Magistrate may order such person to make a monthly allowance for the maintenance of such wife or child."
    },
    {
        "id": "IEA_65B", "act": "Indian Evidence Act, 1872", "section": "Section 65B",
        "title": "Admissibility of electronic records",
        "text": "Any information contained in an electronic record which is printed on paper, or stored, recorded or copied in optical or magnetic media produced by a computer shall be deemed to be also a document and shall be admissible in any proceedings without further proof of the original, if the conditions set out in this section are satisfied."
    },
    {
        "id": "SC_MENTAL_CRUELTY", "act": "Supreme Court Judgement", "section": "Samar Ghosh v. Jaya Ghosh (2007) 4 SCC 511",
        "title": "Mental cruelty — guiding principles",
        "text": "The Supreme Court laid down that no uniform standard can be laid down for mental cruelty. It depends on the social status, educational level of the parties, the society they move in, and their way of life. Sustained conduct which causes mental pain or suffering to the other spouse to such an extent that it makes it impossible to live with the other spouse constitutes mental cruelty."
    },
    {
        "id": "SC_BASALINGAPPA", "act": "Supreme Court Judgement", "section": "Basalingappa v. Mudibasappa (2019) 5 SCC 418",
        "title": "Rebuttal of presumption under NI Act",
        "text": "The presumption under Sections 118 and 139 of the NI Act is rebuttable. The accused can rebut the presumption on the standard of preponderance of probabilities. If the accused raises a plausible defence that creates doubt, the presumption stands rebutted."
    },
]


# ═══════════════════════════════════════════════════════════════
# ENCODER
# ═══════════════════════════════════════════════════════════════

def _get_encoder():
    global _sentence_transformer
    if _sentence_transformer is None:
        try:
            from sentence_transformers import SentenceTransformer
            _sentence_transformer = SentenceTransformer(MODEL_NAME)
            print(f"[RAG] Encoder loaded: {MODEL_NAME}")
        except ImportError:
            raise RuntimeError("Run: pip install sentence-transformers")
    return _sentence_transformer


def _get_faiss():
    global _faiss_module
    if _faiss_module is None:
        try:
            import faiss
            _faiss_module = faiss
        except ImportError:
            raise RuntimeError("Run: pip install faiss-cpu")
    return _faiss_module


# ═══════════════════════════════════════════════════════════════
# LOAD REAL DATASET INDEX (from your 30 PDF pipeline)
# ═══════════════════════════════════════════════════════════════

def _load_real_index() -> bool:
    """
    Try to load the FAISS index built from your judgment PDFs.
    Returns True if successful, False if not available.
    """
    global _real_index, _real_documents

    if not Path(DATASET_FAISS_PATH).exists():
        return False
    if not Path(DATASET_METADATA_PATH).exists():
        return False

    try:
        faiss = _get_faiss()
        _real_index = faiss.read_index(DATASET_FAISS_PATH)

        with open(DATASET_METADATA_PATH, "rb") as f:
            _real_documents = pickle.load(f)

        print(f"[RAG] ✓ Real dataset loaded: {_real_index.ntotal} principles "
              f"from {DATASET_FAISS_PATH}")
        return True

    except Exception as e:
        print(f"[RAG] Could not load real index: {e}")
        return False


def _load_builtin_index():
    """Build or load the fallback built-in 20-provision index."""
    global _builtin_index, _builtin_documents

    faiss   = _get_faiss()
    encoder = _get_encoder()

    # Check for cached built-in index
    if BUILTIN_INDEX_PATH.exists() and BUILTIN_DOCS_PATH.exists():
        try:
            with open(BUILTIN_INDEX_PATH, "rb") as f:
                data = pickle.load(f)
            _builtin_index = faiss.deserialize_index(data["index_bytes"])
            with open(BUILTIN_DOCS_PATH) as f:
                _builtin_documents = json.load(f)
            print(f"[RAG] Built-in index loaded: {len(_builtin_documents)} provisions")
            return
        except:
            pass

    # Build fresh from LEGAL_CORPUS
    _builtin_documents = LEGAL_CORPUS
    texts = [
        f"{doc['act']} {doc['section']} {doc['title']} {doc['text']}"
        for doc in _builtin_documents
    ]
    embeddings = encoder.encode(texts, show_progress_bar=False)
    embeddings = np.array(embeddings, dtype=np.float32)

    dim = embeddings.shape[1]
    _builtin_index = faiss.IndexFlatL2(dim)
    _builtin_index.add(embeddings)

    # Cache it
    os.makedirs(str(BUILTIN_INDEX_PATH.parent), exist_ok=True)
    with open(BUILTIN_INDEX_PATH, "wb") as f:
        pickle.dump({"index_bytes": faiss.serialize_index(_builtin_index), "dim": dim}, f)
    with open(BUILTIN_DOCS_PATH, "w") as f:
        json.dump(_builtin_documents, f, indent=2)

    print(f"[RAG] Built-in index built: {len(_builtin_documents)} provisions")


# ═══════════════════════════════════════════════════════════════
# PUBLIC API
# ═══════════════════════════════════════════════════════════════

def load_index():
    """
    Load the best available index.
    Priority: real dataset > built-in fallback.
    Called automatically on first retrieve().
    """
    real_loaded = _load_real_index()
    if not real_loaded:
        print("[RAG] Real dataset not found — using built-in corpus")
        _load_builtin_index()
    return real_loaded


def retrieve(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Main retrieval function.
    Returns top-k most relevant legal provisions/principles for a query.
    """
    # Auto-load on first call
    if _real_index is None and _builtin_index is None:
        load_index()

    encoder   = _get_encoder()
    query_vec = np.array(encoder.encode([query], show_progress_bar=False), dtype=np.float32)

    # Use real dataset if available, else built-in
    if _real_index is not None:
        index     = _real_index
        documents = _real_documents
        source    = "real_dataset"
    else:
        index     = _builtin_index
        documents = _builtin_documents
        source    = "builtin"

    distances, indices = index.search(query_vec, min(top_k, index.ntotal))

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < len(documents):
            doc = dict(documents[idx])
            doc["score"]  = float(round(1 / (1 + dist), 4))
            doc["source"] = source
            # Normalise field names between real dataset and built-in
            if "principle" in doc and "text" not in doc:
                doc["text"] = doc.get("held", doc.get("principle", ""))
            if "act" not in doc and "domain" in doc:
                doc["act"] = doc.get("domain", "")
            if "section" not in doc:
                doc["section"] = doc.get("principle_id", "")
            results.append(doc)

    return sorted(results, key=lambda x: x["score"], reverse=True)


def get_context_for_prompt(query: str, top_k: int = 5) -> str:
    """
    Returns formatted legal context string for LLM prompt injection.
    Used by draft_generator.py and argument_writer.py.
    """
    results = retrieve(query, top_k=top_k)
    if not results:
        return "[No relevant legal provisions found]"

    lines = ["[RELEVANT LEGAL PROVISIONS FROM DATASET]\n"]
    for r in results:
        act     = r.get("act", r.get("domain", ""))
        section = r.get("section", r.get("principle_id", ""))
        title   = r.get("title", r.get("principle", ""))[:80]
        text    = r.get("text", r.get("held", ""))[:300]

        lines.append(f"• {act} — {section}: {title}")
        lines.append(f"  {text}{'...' if len(text)==300 else ''}\n")

    return "\n".join(lines)


def get_index_info() -> dict:
    """Returns info about the currently loaded index."""
    info = {
        "real_dataset_available": Path(DATASET_FAISS_PATH).exists(),
        "real_dataset_path":      DATASET_FAISS_PATH,
        "builtin_corpus_size":    len(LEGAL_CORPUS),
        "model":                  MODEL_NAME,
    }
    if _real_index is not None:
        info["active_index"]    = "real_dataset"
        info["active_size"]     = _real_index.ntotal
    elif _builtin_index is not None:
        info["active_index"]    = "builtin"
        info["active_size"]     = len(_builtin_documents)
    else:
        info["active_index"]    = "not_loaded"
        info["active_size"]     = 0
    return info


def rebuild_index():
    """Force rebuild of the built-in index (clears cache)."""
    global _builtin_index, _builtin_documents
    _builtin_index     = None
    _builtin_documents = []
    if BUILTIN_INDEX_PATH.exists():
        BUILTIN_INDEX_PATH.unlink()
    _load_builtin_index()


# ═══════════════════════════════════════════════════════════════
# STARTUP — try to load real index immediately
# ═══════════════════════════════════════════════════════════════
try:
    load_index()
except Exception as e:
    print(f"[RAG] Startup load skipped: {e}")
