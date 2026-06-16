from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from core.rule_engine import map_facts_to_rules

router = APIRouter()

class ClassifyRequest(BaseModel):
    facts: Dict[str, Any]

@router.post("/classify")
def classify_endpoint(req: ClassifyRequest):
    if not req.facts:
        raise HTTPException(status_code=400, detail="Facts cannot be empty")
    try:
        mapping = map_facts_to_rules(req.facts)
        return {"success": True, "classification": mapping}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
