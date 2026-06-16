from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.validation import compare_documents

router = APIRouter()

class CompareRequest(BaseModel):
    document1: str
    document2: str
    label1: str = "Petition"
    label2: str = "Counter"

@router.post("/compare")
def compare_endpoint(req: CompareRequest):
    if not req.document1.strip() or not req.document2.strip():
        raise HTTPException(status_code=400, detail="Both documents must be provided")
    try:
        result = compare_documents(req.document1, req.document2)
        result["labels"] = {"document1": req.label1, "document2": req.label2}
        return {"success": True, "comparison": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
