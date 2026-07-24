"""
Updated main.py for legalone/backend/main.py
Adds the rag_status router to the existing routes.
Replace your existing main.py with this file.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Existing routers
from routers import extract, classify, draft, validate, compare, arguments, export, bare_acts
from routers import auth_router, history

# main.py  — add these two lines alongside your bare_acts router

from routers import judgements   # add this


 



# NEW — RAG status router
from routers.rag_status import router as rag_status_router

# NEW — Master Drafter router (3-step AI flow)
from routers.drafter import router as drafter_router


app = FastAPI(
    title="LegalOne AI Drafting System",
    description="AI-powered legal drafting — RAG + Ollama + Auth + Case History",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003",
        "http://localhost:5173",
        "http://localhost:4173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public routes
app.include_router(extract.router,       prefix="/api", tags=["Extraction"])
app.include_router(classify.router,      prefix="/api", tags=["Classification"])
app.include_router(draft.router,         prefix="/api", tags=["Draft Generation"])
app.include_router(validate.router,      prefix="/api", tags=["Validation"])
app.include_router(compare.router,       prefix="/api", tags=["Comparison"])
app.include_router(arguments.router,     prefix="/api", tags=["Argument Writer"])
app.include_router(export.router,        prefix="/api", tags=["Export"])
app.include_router(bare_acts.router,     prefix="/api", tags=["Bare Acts"])

# Auth routes
app.include_router(auth_router.router,   prefix="/api", tags=["Authentication"])

# History routes
app.include_router(history.router,       prefix="/api", tags=["Case History"])

# NEW — RAG status routes
app.include_router(rag_status_router, prefix="/api", tags=["RAG Status"])

# NEW — Master Drafter routes (3-step AI flow)
app.include_router(drafter_router,    prefix="/api", tags=["AI Drafter"])

# judgement pdf download from router
app.include_router(judgements.router)  # add this

 


@app.get("/")
def root():
    return {
        "message": "LegalOne AI Backend v3.0",
        "status":  "ok",
        "docs":    "/docs"
    }


@app.get("/health")
def health():
    # Also return RAG status in health check
    try:
        from core.rag_pipeline import get_index_info
        rag_info = get_index_info()
    except Exception:
        rag_info = {"active_index": "unknown"}

    return {
        "status":      "healthy",
        "version":     "3.0.0",
        "rag_index":   rag_info.get("active_index", "unknown"),
        "rag_size":    rag_info.get("active_size", 0),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
