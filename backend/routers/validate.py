from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.validation import check_draft

router = APIRouter()

class ValidateRequest(BaseModel):
    draft_text: str

@router.post("/validate")
def validate_endpoint(req: ValidateRequest):
    if not req.draft_text.strip():
        raise HTTPException(status_code=400, detail="Draft text cannot be empty")
    try:
        result = check_draft(req.draft_text)
        return {"success": True, "validation": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
