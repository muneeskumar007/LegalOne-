from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from core.fact_extractor import extract_facts
from core.rule_engine import map_facts_to_rules
from core.draft_generator import generate_draft, generate_counter

router = APIRouter()

class DraftRequest(BaseModel):
    text: str
    additional_context: Optional[str] = ""
    draft_type: Optional[str] = "petition"  # petition | counter

class DraftFromFactsRequest(BaseModel):
    facts: Dict[str, Any]
    rule_mapping: Dict[str, Any]
    additional_context: Optional[str] = ""

@router.post("/generate-draft")
def generate_draft_endpoint(req: DraftRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty")
    try:
        facts = extract_facts(req.text)
        rule_mapping = map_facts_to_rules(facts)
        if req.draft_type == "counter":
            result = generate_counter(facts, rule_mapping)
        else:
            result = generate_draft(facts, rule_mapping, req.additional_context or "")
        return {
            "success": True,
            "facts": facts,
            "classification": rule_mapping,
            "draft": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-draft-from-facts")
def generate_from_facts_endpoint(req: DraftFromFactsRequest):
    try:
        result = generate_draft(req.facts, req.rule_mapping, req.additional_context or "")
        return {"success": True, "draft": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
