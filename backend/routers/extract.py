from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.fact_extractor import extract_facts

router = APIRouter()

class ExtractRequest(BaseModel):
    text: str

@router.post("/extract")
def extract_endpoint(req: ExtractRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty")
    try:
        facts = extract_facts(req.text)
        return {"success": True, "facts": facts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
