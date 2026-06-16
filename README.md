# LEGALONE — AI Legal Drafting System
## Complete Installation & Run Guide
### 100% Free & Open Source — No paid APIs required

---

## PROJECT STRUCTURE

legalone/
├── backend/
│   ├── main.py                  ← FastAPI app entry point
│   ├── requirements.txt
│   ├── core/
│   │   ├── fact_extractor.py    ← NLP fact extraction
│   │   ├── rule_engine.py       ← Statutory rule mapping
│   │   ├── rag_pipeline.py      ← FAISS + SentenceTransformers
│   │   ├── draft_generator.py   ← Ollama LLM drafting
│   │   └── validation.py        ← Draft quality validation
│   └── routers/
│       ├── extract.py           ← POST /api/extract
│       ├── classify.py          ← POST /api/classify
│       ├── draft.py             ← POST /api/generate-draft
│       ├── validate.py          ← POST /api/validate
│       └── compare.py           ← POST /api/compare
└── frontend/
    ├── src/
    │   ├── pages/               ← Dashboard, Pipeline, Draft, Validate, Compare
    │   ├── components/Layout.jsx
    │   └── utils/api.js
    └── package.json

---

## STEP 1 — INSTALL OLLAMA (Local LLM)

macOS:
  brew install ollama
  OR: https://ollama.com/download

Linux:
  curl -fsSL https://ollama.com/install.sh | sh

Windows:
  https://ollama.com/download/windows

Start Ollama + pull model:
  ollama serve
  ollama pull llama3       (4.7 GB - one time download)

Test:
  ollama run llama3 "What is Section 138 NI Act?"

Alternative smaller models (if low RAM):
  ollama pull phi3         (2.3 GB)
  ollama pull llama3:8b    (4.7 GB)

---

## STEP 2 — BACKEND SETUP

  cd legalone/backend
  python3 -m venv venv
  source venv/bin/activate       (Windows: venv\Scripts\activate)
  pip install -r requirements.txt

Verify:
  python -c "from sentence_transformers import SentenceTransformer; print('OK')"
  python -c "import faiss; print('FAISS OK')"

---

## STEP 3 — START BACKEND

  cd legalone/backend
  source venv/bin/activate
  uvicorn main:app --reload --host 0.0.0.0 --port 8000

Should see:
  INFO: Uvicorn running on http://0.0.0.0:8000
  INFO: [RAG] Index built with 20 documents.

Test:
  curl http://localhost:8000/health
  Open: http://localhost:8000/docs

---

## STEP 4 — FRONTEND SETUP

  cd legalone/frontend
  npm install
  npm run dev

Open: http://localhost:3000

---

## RUNNING EVERYTHING (3 terminals needed)

Terminal 1: ollama serve
Terminal 2: cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000
Terminal 3: cd frontend && npm run dev

Then open: http://localhost:3000

---

## API ENDPOINTS

POST /api/extract          - Extract facts from case text
POST /api/classify         - Classify case + statutory mapping
POST /api/generate-draft   - Generate full petition draft
POST /api/validate         - Validate draft for completeness
POST /api/compare          - Compare two documents for contradictions

---

## SUPPORTED CASE TYPES

Money Recovery       - ICA 1872, CPC 1908, IEA 1872, Limitation Act 1963
Cheque Dishonour     - NI Act S.138, CrPC/BNSS
Property Dispute     - TPA 1882, SRA 1963, CPC O.XXXIX
Criminal Assault     - BNS 2023 / IPC, CrPC/BNSS
Domestic Violence    - PWDVA 2005, BNS S.85
Consumer Complaint   - CPA 2019

---

## PIPELINE FLOW

User Input → Fact Extraction → Case Classification → Rule Engine 
→ RAG Retrieval → LLM Draft → Validation → Advocate Review → Output

---

## TROUBLESHOOTING

Backend won't start:
  pip install --upgrade pip
  pip install -r requirements.txt --force-reinstall

FAISS error:
  pip install faiss-cpu --force-reinstall

Ollama not responding:
  curl http://localhost:11434/api/tags
  ollama list
  ollama serve

Slow generation:
  Use smaller model: ollama pull phi3
  Edit backend/core/draft_generator.py: OLLAMA_MODEL = "phi3"
  Template fallback is instant if Ollama times out

---

## CUSTOMIZATION

Change model: Edit backend/core/draft_generator.py → OLLAMA_MODEL
Add legal texts: Edit backend/core/rag_pipeline.py → LEGAL_CORPUS list
Add case types: Edit backend/core/rule_engine.py → STATUTORY_RULES + CASE_KEYWORDS

---

LegalOne by TLC | www.legalone.cc | customersupport@legalone.cc
43B, Dr. Ambedkar Nagar, Krishnagiri - 635001 | 9952120941
