"""
routers/history.py — Case history CRUD for authenticated advocates.
Each module (draft, pipeline, arguments, validate, compare) saves to this store.
"""

import json
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from database import get_db, CaseHistory, generate_id
from auth import get_current_advocate, Advocate

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class SaveHistoryRequest(BaseModel):
    module:           str                    # pipeline|draft|arguments|validate|compare
    raw_input:        str
    title:            Optional[str]  = None
    plaintiff_name:   Optional[str]  = None
    defendant_name:   Optional[str]  = None
    amount:           Optional[str]  = None
    case_type:        Optional[str]  = None
    court:            Optional[str]  = None
    draft_text:       Optional[str]  = None
    validation_score: Optional[float]= None
    argument_text:    Optional[str]  = None
    compare_result:   Optional[str]  = None   # JSON string
    draft_source:     Optional[str]  = None
    notes:            Optional[str]  = None


class UpdateNotesRequest(BaseModel):
    notes:      Optional[str]  = None
    is_starred: Optional[bool] = None
    title:      Optional[str]  = None


def _history_dict(h: CaseHistory) -> dict:
    return {
        "id":               h.id,
        "module":           h.module,
        "raw_input":        h.raw_input,
        "title":            h.title,
        "plaintiff_name":   h.plaintiff_name,
        "defendant_name":   h.defendant_name,
        "amount":           h.amount,
        "case_type":        h.case_type,
        "court":            h.court,
        "draft_text":       h.draft_text,
        "validation_score": h.validation_score,
        "argument_text":    h.argument_text,
        "compare_result":   json.loads(h.compare_result) if h.compare_result else None,
        "draft_source":     h.draft_source,
        "is_starred":       h.is_starred,
        "notes":            h.notes,
        "created_at":       h.created_at.isoformat() if h.created_at else None,
        "updated_at":       h.updated_at.isoformat() if h.updated_at else None,
    }


def _auto_title(req: SaveHistoryRequest) -> str:
    """Generate a concise auto-title from available metadata."""
    parts = []
    if req.plaintiff_name: parts.append(req.plaintiff_name)
    if req.defendant_name: parts.append(f"vs {req.defendant_name}")
    if req.amount:         parts.append(f"({req.amount})")
    if parts:
        return " ".join(parts)[:180]
    # Fallback: first 80 chars of raw_input
    return req.raw_input[:80].strip() + ("…" if len(req.raw_input) > 80 else "")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/history", status_code=201)
def save_history(
    req: SaveHistoryRequest,
    advocate: Advocate = Depends(get_current_advocate),
    db: Session = Depends(get_db)
):
    entry = CaseHistory(
        id              = generate_id(),
        advocate_id     = advocate.id,
        module          = req.module,
        raw_input       = req.raw_input,
        title           = req.title or _auto_title(req),
        plaintiff_name  = req.plaintiff_name,
        defendant_name  = req.defendant_name,
        amount          = req.amount,
        case_type       = req.case_type,
        court           = req.court,
        draft_text      = req.draft_text,
        validation_score= req.validation_score,
        argument_text   = req.argument_text,
        compare_result  = req.compare_result,
        draft_source    = req.draft_source,
        notes           = req.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"success": True, "history": _history_dict(entry)}


@router.get("/history")
def list_history(
    module:   Optional[str] = Query(None, description="Filter by module"),
    starred:  Optional[bool]= Query(None, description="Filter starred only"),
    search:   Optional[str] = Query(None, description="Search in title/input"),
    limit:    int           = Query(50,   le=200),
    offset:   int           = Query(0),
    advocate: Advocate      = Depends(get_current_advocate),
    db:       Session       = Depends(get_db)
):
    q = db.query(CaseHistory).filter(CaseHistory.advocate_id == advocate.id)

    if module:
        q = q.filter(CaseHistory.module == module)
    if starred is not None:
        q = q.filter(CaseHistory.is_starred == starred)
    if search:
        like = f"%{search}%"
        q = q.filter(
            CaseHistory.title.ilike(like) |
            CaseHistory.raw_input.ilike(like) |
            CaseHistory.plaintiff_name.ilike(like) |
            CaseHistory.defendant_name.ilike(like)
        )

    total   = q.count()
    entries = q.order_by(CaseHistory.created_at.desc()).offset(offset).limit(limit).all()
    return {
        "success": True,
        "total":   total,
        "items":   [_history_dict(h) for h in entries]
    }


@router.get("/history/stats")
def history_stats(
    advocate: Advocate = Depends(get_current_advocate),
    db: Session = Depends(get_db)
):
    """Dashboard stats: total cases, per-module breakdown, starred count."""
    all_cases = db.query(CaseHistory).filter(CaseHistory.advocate_id == advocate.id).all()
    modules   = {}
    for h in all_cases:
        modules[h.module] = modules.get(h.module, 0) + 1

    return {
        "success": True,
        "stats": {
            "total":   len(all_cases),
            "starred": sum(1 for h in all_cases if h.is_starred),
            "modules": modules,
        }
    }


@router.get("/history/{history_id}")
def get_history_item(
    history_id: str,
    advocate: Advocate = Depends(get_current_advocate),
    db: Session = Depends(get_db)
):
    entry = db.query(CaseHistory).filter(
        CaseHistory.id == history_id,
        CaseHistory.advocate_id == advocate.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="History item not found")
    return {"success": True, "history": _history_dict(entry)}


@router.put("/history/{history_id}")
def update_history(
    history_id: str,
    req: UpdateNotesRequest,
    advocate: Advocate = Depends(get_current_advocate),
    db: Session = Depends(get_db)
):
    entry = db.query(CaseHistory).filter(
        CaseHistory.id == history_id,
        CaseHistory.advocate_id == advocate.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="History item not found")

    if req.notes      is not None: entry.notes      = req.notes
    if req.is_starred is not None: entry.is_starred = req.is_starred
    if req.title      is not None: entry.title      = req.title
    entry.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return {"success": True, "history": _history_dict(entry)}


@router.delete("/history/{history_id}")
def delete_history(
    history_id: str,
    advocate: Advocate = Depends(get_current_advocate),
    db: Session = Depends(get_db)
):
    entry = db.query(CaseHistory).filter(
        CaseHistory.id == history_id,
        CaseHistory.advocate_id == advocate.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="History item not found")
    db.delete(entry)
    db.commit()
    return {"success": True, "message": "Deleted"}


@router.delete("/history")
def clear_module_history(
    module: Optional[str] = Query(None),
    advocate: Advocate = Depends(get_current_advocate),
    db: Session = Depends(get_db)
):
    """Clear all history (optionally filtered by module)."""
    q = db.query(CaseHistory).filter(CaseHistory.advocate_id == advocate.id)
    if module:
        q = q.filter(CaseHistory.module == module)
    count = q.count()
    q.delete()
    db.commit()
    return {"success": True, "deleted": count}
