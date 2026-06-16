from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import extract, classify, draft, validate, compare, arguments, export
from routers import auth_router, history
import uvicorn

app = FastAPI(
    title="LegalOne AI Drafting System",
    description="AI-powered legal drafting — RAG + Ollama + Auth + Case History",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public routes (no auth needed)
app.include_router(extract.router,       prefix="/api", tags=["Extraction"])
app.include_router(classify.router,      prefix="/api", tags=["Classification"])
app.include_router(draft.router,         prefix="/api", tags=["Draft Generation"])
app.include_router(validate.router,      prefix="/api", tags=["Validation"])
app.include_router(compare.router,       prefix="/api", tags=["Comparison"])
app.include_router(arguments.router,     prefix="/api", tags=["Argument Writer"])
app.include_router(export.router,        prefix="/api", tags=["Export"])

# Auth routes
app.include_router(auth_router.router,   prefix="/api", tags=["Authentication"])

# History routes (requires JWT)
app.include_router(history.router,       prefix="/api", tags=["Case History"])

@app.get("/")
def root():
    return {"message": "LegalOne AI Backend v3.0", "status": "ok", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy", "version": "3.0.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
