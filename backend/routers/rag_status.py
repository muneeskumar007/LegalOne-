"""
routers/rag_status.py
─────────────────────────────────────────────────────────────────
Add this router to legalone/backend/routers/rag_status.py
Then register it in main.py

Provides:
  GET  /api/rag-status     → which index is active, how many principles
  POST /api/rag-test       → test retrieval with a query
  POST /api/rag-reload     → hot-reload index without restart
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class RagTestRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5


@router.get("/rag-status")
def rag_status():
    """Check which RAG index is active and how many principles it has."""
    try:
        from core.rag_pipeline import get_index_info
        info = get_index_info()
        return {
            "success":               True,
            "active_index":          info.get("active_index", "not_loaded"),
            "active_size":           info.get("active_size", 0),
            "real_dataset_available":info.get("real_dataset_available", False),
            "real_dataset_path":     info.get("real_dataset_path", ""),
            "builtin_corpus_size":   info.get("builtin_corpus_size", 20),
            "model":                 info.get("model", "all-MiniLM-L6-v2"),
            "message": (
                f"Using real dataset with {info.get('active_size', 0)} principles"
                if info.get("active_index") == "real_dataset"
                else "Using built-in corpus (20 provisions). Add dataset to upgrade."
            )
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/rag-test")
def rag_test(req: RagTestRequest):
    """Test the RAG retrieval with a query. Shows what context LLM will receive."""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    try:
        from core.rag_pipeline import retrieve, get_context_for_prompt
        results  = retrieve(req.query, top_k=req.top_k or 5)
        context  = get_context_for_prompt(req.query, top_k=req.top_k or 5)
        return {
            "success":    True,
            "query":      req.query,
            "results":    [
                {
                    "rank":      i + 1,
                    "score":     r.get("score", 0),
                    "source":    r.get("source", ""),
                    "act":       r.get("act", r.get("domain", "")),
                    "section":   r.get("section", r.get("principle_id", "")),
                    "principle": r.get("principle", r.get("title", ""))[:120],
                    "text":      r.get("text", r.get("held", ""))[:200],
                    "case_name": r.get("case_name", ""),
                    "court":     r.get("court", ""),
                }
                for i, r in enumerate(results)
            ],
            "context_for_llm": context
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag-reload")
def rag_reload():
    """Hot-reload the RAG index without restarting the server."""
    try:
        from core.rag_pipeline import load_index, get_index_info
        import importlib, core.rag_pipeline as rp
        # Reset loaded indexes
        rp._real_index     = None
        rp._real_documents = []
        rp._builtin_index  = None
        # Reload
        loaded = load_index()
        info   = get_index_info()
        return {
            "success":     True,
            "reloaded":    True,
            "active_index":info.get("active_index"),
            "active_size": info.get("active_size"),
            "message":     f"Index reloaded. Now using {info.get('active_index')} "
                           f"with {info.get('active_size')} entries."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
