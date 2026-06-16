"""
RAG Pipeline: Loads legal texts, creates embeddings with SentenceTransformers,
stores in FAISS, and retrieves top-k relevant sections for LLM context.
"""

import os
import json
import pickle
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional

# Lazy imports to avoid startup crashes if libraries are missing
_sentence_transformer = None
_faiss = None
_index = None
_documents: List[Dict] = []

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "bare_acts"
INDEX_PATH = BASE_DIR / "data" / "faiss_index.pkl"
DOCS_PATH = BASE_DIR / "data" / "documents.json"

MODEL_NAME = "all-MiniLM-L6-v2"  # Lightweight, free, 80MB


# ─── Built-in Legal Text Corpus ─────────────────────────────────────────────

LEGAL_CORPUS: List[Dict[str, str]] = [
    # Indian Contract Act
    {
        "id": "ICA_10",
        "act": "Indian Contract Act, 1872",
        "section": "Section 10",
        "title": "What agreements are contracts",
        "text": "All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void."
    },
    {
        "id": "ICA_37",
        "act": "Indian Contract Act, 1872",
        "section": "Section 37",
        "title": "Obligation of parties to contracts",
        "text": "The parties to a contract must either perform, or offer to perform, their respective promises, unless such performance is dispensed with or excused under the provisions of this Act, or of any other law."
    },
    {
        "id": "ICA_73",
        "act": "Indian Contract Act, 1872",
        "section": "Section 73",
        "title": "Compensation for loss or damage caused by breach of contract",
        "text": "When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken it, compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach, or which the parties knew, when they made the contract, to be likely to result from the breach of it."
    },
    # CPC
    {
        "id": "CPC_9",
        "act": "Code of Civil Procedure, 1908",
        "section": "Section 9",
        "title": "Courts to try all civil suits unless barred",
        "text": "The Courts shall (subject to the provisions herein contained) have jurisdiction to try all suits of a civil nature excepting suits of which their cognizance is either expressly or impliedly barred. A suit is of a civil nature where the principal question therein relates to the determination of a civil right."
    },
    {
        "id": "CPC_O7R1",
        "act": "Code of Civil Procedure, 1908",
        "section": "Order VII Rule 1",
        "title": "Particulars to be contained in plaint",
        "text": "Every plaint shall contain: the name of the Court in which the suit is brought; the name, description and place of residence of the plaintiff; the name, description and place of residence of the defendant; where the plaintiff or the defendant is a minor or a person of unsound mind, a statement to that effect; the facts constituting the cause of action and when it arose; the facts showing that the Court has jurisdiction; the relief which the plaintiff claims; where the plaintiff has allowed a set-off or relinquished a portion of his claim, the amount so allowed or relinquished; and a statement of the value of the subject-matter of the suit for the purposes of jurisdiction and of court fees."
    },
    {
        "id": "CPC_O37",
        "act": "Code of Civil Procedure, 1908",
        "section": "Order XXXVII",
        "title": "Summary Suits",
        "text": "Summary suits can be filed in cases relating to bills of exchange, hundies, promissory notes, or where the plaintiff seeks recovery of a debt or liquidated demand in money payable by defendant, with or without interest. The court may give leave to the defendant to defend the suit upon such terms as it thinks fit."
    },
    # Indian Evidence Act / BSA
    {
        "id": "IEA_101",
        "act": "Indian Evidence Act, 1872",
        "section": "Section 101",
        "title": "Burden of proof",
        "text": "Whoever desires any Court to give judgment as to any legal right or liability dependent on the existence of facts which he asserts, must prove that those facts exist. When a person is bound to prove the existence of any fact, it is said that the burden of proof lies on that person."
    },
    {
        "id": "IEA_102",
        "act": "Indian Evidence Act, 1872",
        "section": "Section 102",
        "title": "On whom burden of proof lies",
        "text": "The burden of proof in a suit or proceeding lies on that person who would fail if no evidence at all were given on either side. In a money recovery suit, the plaintiff must first establish existence of debt; thereafter if defendant pleads repayment, burden shifts to defendant."
    },
    {
        "id": "BSA_118",
        "act": "Bharatiya Sakshya Adhiniyam, 2023",
        "section": "Section 118",
        "title": "Burden of proof - BSA equivalent",
        "text": "The burden of proof as to any particular fact lies on that person who wishes the Court to believe in its existence, unless it is provided by any law that the proof of that fact shall lie on any particular person."
    },
    # NI Act
    {
        "id": "NIA_118",
        "act": "Negotiable Instruments Act, 1881",
        "section": "Section 118",
        "title": "Presumptions as to negotiable instruments",
        "text": "Until the contrary is proved, the following presumptions shall be made: (a) of consideration - that every negotiable instrument was made or drawn for consideration; (b) as to date - that every negotiable instrument bearing a date was made or drawn on such date; (c) as to time of acceptance - that every bill of exchange was accepted within a reasonable time after its date."
    },
    {
        "id": "NIA_138",
        "act": "Negotiable Instruments Act, 1881",
        "section": "Section 138",
        "title": "Dishonour of cheque for insufficiency of funds",
        "text": "Where any cheque drawn by a person on an account maintained by him with a banker for payment of any amount of money to another person from out of that account for the discharge, in whole or in part, of any debt or other liability, is returned by the bank unpaid, either because of the amount of money standing to the credit of that account is insufficient to honour the cheque or that it exceeds the arrangement made with that bank, such person shall be deemed to have committed an offence."
    },
    # Limitation Act
    {
        "id": "LA_18",
        "act": "Limitation Act, 1963",
        "section": "Article 18",
        "title": "Suit on money lent",
        "text": "For a suit on money lent under an agreement that it shall be payable on demand: three years from the date when the loan is made."
    },
    {
        "id": "LA_55",
        "act": "Limitation Act, 1963",
        "section": "Article 55",
        "title": "Suit for compensation for breach of contract",
        "text": "For a suit for compensation for breach of any contract, express or implied, not in writing, registered: three years when the contract is broken, or where there are successive breaches, when the breach in respect of which the suit is instituted occurs, or where the breach is continuing, when it ceases."
    },
    # Specific Relief Act
    {
        "id": "SRA_34",
        "act": "Specific Relief Act, 1963",
        "section": "Section 34",
        "title": "Discretion of court as to declaration of status or right",
        "text": "Any person entitled to any legal character, or to any right as to any property, may institute a suit against any person denying, or interested to deny, his title to such character or right, and the court may in its discretion make therein a declaration that he is so entitled, and the plaintiff need not in such suit ask for any further relief."
    },
    {
        "id": "SRA_38",
        "act": "Specific Relief Act, 1963",
        "section": "Section 38",
        "title": "Perpetual injunction when granted",
        "text": "Subject to the other provisions contained in or referred to by this Chapter, a perpetual injunction may be granted to the plaintiff to prevent the breach of an obligation existing in his favour, whether expressly or by implication. When the defendant invades or threatens to invade the plaintiff's right to, or enjoyment of, property, the court may grant a perpetual injunction in the following cases, namely: where the defendant is trustee of the property for the plaintiff; where there exists no standard for ascertaining the actual damage caused or likely to be caused by the invasion; where the invasion is such that compensation in money would not afford adequate relief; where the injunction is necessary to prevent a multiplicity of judicial proceedings."
    },
    # BNS
    {
        "id": "BNS_85",
        "act": "Bharatiya Nyaya Sanhita, 2023",
        "section": "Section 85",
        "title": "Husband or relative of husband of a woman subjecting her to cruelty",
        "text": "Whoever, being the husband or the relative of the husband of a woman, subjects such woman to cruelty shall be punished with imprisonment of either description for a term which may extend to three years and shall also be liable to fine. For the purposes of this section, cruelty means any wilful conduct which is of such a nature as is likely to drive the woman to commit suicide or to cause grave injury or danger to life, limb or health whether mental or physical of the woman; or harassment of the woman where such harassment is with a view to coercing her or any person related to her to meet any unlawful demand for any property or valuable security or is on account of failure by her or any person related to her to meet such demand."
    },
    # Consumer Protection
    {
        "id": "CPA_35",
        "act": "Consumer Protection Act, 2019",
        "section": "Section 35",
        "title": "Manner in which complaint shall be made",
        "text": "A complaint, in relation to any goods sold or delivered or agreed to be sold or delivered or any service provided or agreed to be provided, may be filed with a District Commission by the consumer to whom such goods are sold or delivered or agreed to be sold or delivered or such service provided or agreed to be provided; any recognised consumer association whether the consumer to whom the goods sold or delivered or agreed to be sold or delivered or service provided or agreed to be provided is a member of such association or not."
    },
    # Supreme Court Judgement references
    {
        "id": "SC_BASALINGAPPA",
        "act": "Supreme Court Judgement",
        "section": "Basalingappa v. Mudibasappa (2019) 5 SCC 418",
        "title": "Rebuttal of presumption under NI Act",
        "text": "The Supreme Court held that the presumption under Section 118 and 139 of the Negotiable Instruments Act is a rebuttable presumption. The accused can rebut the presumption by raising a probable defence, not proof beyond reasonable doubt. The standard is preponderance of probabilities. If the accused raises a plausible defence that creates doubt, the presumption stands rebutted."
    },
    {
        "id": "SC_MONEY_RECOVERY",
        "act": "Legal Principle",
        "section": "Money Recovery - Burden of Proof",
        "title": "Burden of proof in money recovery suits",
        "text": "In a suit for recovery of money, the plaintiff must establish the existence of debt and the defendant's liability. Once the plaintiff establishes a prima facie case through documentary evidence like bank statements, promissory notes, or receipts, the burden shifts to the defendant to prove payment or discharge. A mere statement of repayment without corroborative documentary evidence is insufficient. Bank withdrawal statement alone does not prove payment to plaintiff."
    }
]


def _get_encoder():
    global _sentence_transformer
    if _sentence_transformer is None:
        try:
            from sentence_transformers import SentenceTransformer
            _sentence_transformer = SentenceTransformer(MODEL_NAME)
        except ImportError:
            raise RuntimeError("sentence-transformers not installed. Run: pip install sentence-transformers")
    return _sentence_transformer


def _get_faiss():
    global _faiss
    if _faiss is None:
        try:
            import faiss
            _faiss = faiss
        except ImportError:
            raise RuntimeError("faiss-cpu not installed. Run: pip install faiss-cpu")
    return _faiss


def build_index() -> None:
    """Build FAISS index from the legal corpus and persist to disk."""
    global _index, _documents
    faiss = _get_faiss()
    encoder = _get_encoder()

    _documents = LEGAL_CORPUS
    texts = [f"{doc['act']} {doc['section']} {doc['title']} {doc['text']}" for doc in _documents]
    embeddings = encoder.encode(texts, show_progress_bar=False)
    embeddings = np.array(embeddings, dtype=np.float32)

    dim = embeddings.shape[1]
    _index = faiss.IndexFlatL2(dim)
    _index.add(embeddings)

    # Persist
    os.makedirs(str(DATA_DIR.parent), exist_ok=True)
    with open(INDEX_PATH, "wb") as f:
        pickle.dump({"index_bytes": faiss.serialize_index(_index), "dim": dim}, f)
    with open(DOCS_PATH, "w") as f:
        json.dump(_documents, f, indent=2)

    print(f"[RAG] Index built with {len(_documents)} documents.")


def load_index() -> None:
    """Load persisted FAISS index or build fresh."""
    global _index, _documents
    faiss = _get_faiss()

    if INDEX_PATH.exists() and DOCS_PATH.exists():
        with open(INDEX_PATH, "rb") as f:
            data = pickle.load(f)
        _index = faiss.deserialize_index(data["index_bytes"])
        with open(DOCS_PATH) as f:
            _documents = json.load(f)
        print(f"[RAG] Loaded index with {len(_documents)} documents.")
    else:
        build_index()


def retrieve(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Retrieve top-k relevant legal sections for a query."""
    global _index, _documents

    if _index is None:
        load_index()

    encoder = _get_encoder()
    query_vec = encoder.encode([query], show_progress_bar=False)
    query_vec = np.array(query_vec, dtype=np.float32)

    distances, indices = _index.search(query_vec, top_k)
    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if idx < len(_documents):
            doc = dict(_documents[idx])
            doc["score"] = float(1 / (1 + dist))  # normalize to 0-1
            results.append(doc)

    return sorted(results, key=lambda x: x["score"], reverse=True)


def get_context_for_prompt(query: str, top_k: int = 4) -> str:
    """Return formatted legal context string for LLM prompt injection."""
    results = retrieve(query, top_k=top_k)
    lines = ["[RELEVANT LEGAL PROVISIONS]\n"]
    for r in results:
        lines.append(f"• {r['act']} – {r['section']}: {r['title']}")
        lines.append(f"  {r['text'][:300]}...\n" if len(r['text']) > 300 else f"  {r['text']}\n")
    return "\n".join(lines)
