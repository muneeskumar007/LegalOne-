from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from core.fact_extractor import extract_facts
from core.rule_engine import map_facts_to_rules
from core.argument_writer import generate_arguments

router = APIRouter()

class ArgumentRequest(BaseModel):
    text: str
    side: Optional[str] = "both"   # "petitioner" | "respondent" | "both"

class ArgumentFromFactsRequest(BaseModel):
    facts: Dict[str, Any]
    rule_mapping: Dict[str, Any]
    side: Optional[str] = "both"

@router.post("/arguments")
def arguments_endpoint(req: ArgumentRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Input text cannot be empty")
    try:
        facts   = extract_facts(req.text)
        mapping = map_facts_to_rules(facts)
        result  = generate_arguments(facts, mapping, req.side or "both")
        return {"success": True, "facts": facts, "classification": mapping, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/arguments-from-facts")
def arguments_from_facts_endpoint(req: ArgumentFromFactsRequest):
    try:
        result = generate_arguments(req.facts, req.rule_mapping, req.side or "both")
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
