"""
test_system.py — Run this to verify all LegalOne components work correctly.
Usage: python test_system.py
"""
import sys
import json

PASS = "✓"
FAIL = "✗"
WARN = "⚠"

def test_imports():
    print("\n── Import Tests ─────────────────────────────────────────")
    tests = [
        ("FastAPI",              "from fastapi import FastAPI"),
        ("Uvicorn",              "import uvicorn"),
        ("SentenceTransformers", "from sentence_transformers import SentenceTransformer"),
        ("FAISS",                "import faiss"),
        ("NumPy",                "import numpy"),
        ("Requests",             "import requests"),
        ("Pydantic",             "from pydantic import BaseModel"),
    ]
    all_ok = True
    for name, stmt in tests:
        try:
            exec(stmt)
            print(f"  {PASS}  {name}")
        except ImportError as e:
            print(f"  {FAIL}  {name} — {e}")
            all_ok = False
    return all_ok


def test_fact_extractor():
    print("\n── Fact Extractor ───────────────────────────────────────")
    try:
        from core.fact_extractor import extract_facts
        sample = "Karthick files a money recovery suit against Ganesh for ₹1,00,000 borrowed 1 year ago."
        facts = extract_facts(sample)
        assert facts["plaintiff_name"], "No plaintiff name extracted"
        assert facts["defendant_name"], "No defendant name extracted"
        assert facts["amount"],         "No amount extracted"
        print(f"  {PASS}  Plaintiff : {facts['plaintiff_name']}")
        print(f"  {PASS}  Defendant : {facts['defendant_name']}")
        print(f"  {PASS}  Amount    : {facts['amount']}")
        print(f"  {PASS}  Case type : {facts['case_type_hint']}")
        return True
    except Exception as e:
        print(f"  {FAIL}  {e}")
        return False


def test_rule_engine():
    print("\n── Rule Engine ──────────────────────────────────────────")
    try:
        from core.rule_engine import map_facts_to_rules
        facts = {"plaintiff_name": "Karthick", "defendant_name": "Ganesh", "amount": "₹1,00,000",
                 "case_type_hint": "money_recovery", "cause_of_action": "money recovery"}
        mapping = map_facts_to_rules(facts)
        assert mapping["detected_case_type"], "No case type"
        assert len(mapping["applicable_acts"]) > 0, "No acts mapped"
        print(f"  {PASS}  Case type : {mapping['case_label']}")
        print(f"  {PASS}  Court     : {mapping['court']}")
        print(f"  {PASS}  Acts      : {len(mapping['applicable_acts'])} mapped")
        print(f"  {PASS}  Confidence: {mapping['confidence']}")
        return True
    except Exception as e:
        print(f"  {FAIL}  {e}")
        return False


def test_rag_pipeline():
    print("\n── RAG Pipeline ─────────────────────────────────────────")
    try:
        from backend.core.rag_pipeline_original_backup import build_index, retrieve
        print(f"  … Building index (first run downloads ~80 MB model)…")
        build_index()
        results = retrieve("money recovery suit promissory note", top_k=3)
        assert len(results) > 0, "No results returned"
        for r in results:
            print(f"  {PASS}  [{r['score']:.2f}] {r['act']} — {r['section']}")
        return True
    except Exception as e:
        print(f"  {FAIL}  {e}")
        return False


def test_validation():
    print("\n── Validation Engine ────────────────────────────────────")
    try:
        from core.validation import check_draft, compare_documents
        sample_draft = """
IN THE CIVIL COURT, KRISHNAGIRI

BETWEEN:
KARTHICK ... PLAINTIFF
AND
GANESH ... DEFENDANT

FACTS:
The plaintiff submits that the defendant borrowed ₹1,00,000.
The cause of action arose on default of payment.
This court has jurisdiction.

LEGAL GROUNDS: Under Section 37 of the Indian Contract Act, 1872.

PRAYER: The plaintiff prays for a decree for ₹1,00,000 with interest.
Respectfully submitted, Advocate
"""
        result = check_draft(sample_draft)
        print(f"  {PASS}  Quality score  : {result['quality_score']}/100")
        print(f"  {PASS}  Sections found : {len(result['sections_present'])}")
        print(f"  {PASS}  Warnings       : {len(result['warnings'])}")
        print(f"  {PASS}  Is valid       : {result['is_valid']}")

        # Test compare
        doc2 = "The defendant denies all allegations. The defendant had repaid ₹1,00,000 in cash."
        cmp = compare_documents(sample_draft, doc2)
        print(f"  {PASS}  Compare works  : {cmp['total_conflicts']} conflicts found")
        return True
    except Exception as e:
        print(f"  {FAIL}  {e}")
        return False


def test_ollama_connection():
    print("\n── Ollama Connection ────────────────────────────────────")
    try:
        import requests
        resp = requests.get("http://localhost:11434/api/tags", timeout=5)
        if resp.status_code == 200:
            models = resp.json().get("models", [])
            names = [m.get("name","") for m in models]
            print(f"  {PASS}  Ollama running — models: {names if names else 'none pulled yet'}")
            if any("llama3" in n for n in names):
                print(f"  {PASS}  llama3 is available")
            else:
                print(f"  {WARN}  llama3 not pulled — run: ollama pull llama3")
            return True
    except Exception:
        pass
    print(f"  {WARN}  Ollama not running (template fallback will be used)")
    print(f"       Start with: ollama serve")
    return True  # Non-blocking — template fallback handles this


def test_draft_generator():
    print("\n── Draft Generator ──────────────────────────────────────")
    try:
        from core.draft_generator import generate_draft
        facts = {"plaintiff_name": "Karthick", "defendant_name": "Ganesh",
                 "amount": "₹1,00,000", "case_summary": "Money recovery suit for borrowed amount."}
        mapping = {"case_label": "Civil Suit for Recovery of Money",
                   "court": "Civil Court", "applicable_acts": [], "relief_available": ["Decree for ₹1,00,000"]}
        result = generate_draft(facts, mapping)
        assert result["draft"], "No draft returned"
        source = result.get("source", "unknown")
        words = len(result["draft"].split())
        print(f"  {PASS}  Source : {source}")
        print(f"  {PASS}  Words  : {words}")
        return True
    except Exception as e:
        print(f"  {FAIL}  {e}")
        return False


def run_all():
    print("=" * 54)
    print("  LegalOne System Test")
    print("=" * 54)

    results = {
        "Imports"         : test_imports(),
        "Fact Extractor"  : test_fact_extractor(),
        "Rule Engine"     : test_rule_engine(),
        "RAG Pipeline"    : test_rag_pipeline(),
        "Validation"      : test_validation(),
        "Ollama"          : test_ollama_connection(),
        "Draft Generator" : test_draft_generator(),
    }

    print("\n" + "=" * 54)
    print("  Summary")
    print("=" * 54)
    passed = sum(1 for v in results.values() if v)
    total  = len(results)
    for name, ok in results.items():
        icon = PASS if ok else FAIL
        print(f"  {icon}  {name}")
    print(f"\n  {passed}/{total} tests passed")

    if passed == total:
        print("\n  ✓ System ready! Start with:")
        print("    uvicorn main:app --reload --port 8000")
    elif passed >= total - 1:
        print("\n  ⚠ Almost ready — check warnings above")
    else:
        print("\n  ✗ Fix failures above before starting the server")
    print("=" * 54)

if __name__ == "__main__":
    run_all()
