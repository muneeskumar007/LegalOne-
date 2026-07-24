"""
routers/bare_acts.py - Bare Acts upload/list endpoints.
Stores uploaded PDFs and lightweight metadata for the authenticated advocate.
"""

import json
import re
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from auth import Advocate, get_current_advocate

try:
    from PyPDF2 import PdfReader
except Exception:  # pragma: no cover - optional runtime dependency
    PdfReader = None


router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads" / "bare_acts"
INDEX_PATH = UPLOAD_DIR / "index.json"


def _ensure_store() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    if not INDEX_PATH.exists():
        INDEX_PATH.write_text("[]", encoding="utf-8")


def _load_items() -> list[dict]:
    _ensure_store()
    try:
        return json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def _save_items(items: list[dict]) -> None:
    _ensure_store()
    INDEX_PATH.write_text(json.dumps(items, indent=2), encoding="utf-8")


def _is_pdf(file: UploadFile) -> bool:
    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()
    return filename.endswith(".pdf") or content_type == "application/pdf"


def _extract_pdf_metadata(path: Path, fallback_title: str) -> dict:
    metadata = {
        "title": Path(fallback_title).stem,
        "year": None,
        "sections_count": 0,
    }

    if PdfReader is None:
        return metadata

    try:
        reader = PdfReader(str(path))
        info_title = ""
        if reader.metadata:
            info_title = str(reader.metadata.get("/Title") or "").strip()
        text = "\n".join((page.extract_text() or "") for page in reader.pages[:5])
        title = info_title or _guess_title(text) or metadata["title"]
        metadata["title"] = title
        metadata["year"] = _guess_year(title, text)
        metadata["sections_count"] = _count_sections(text)
    except Exception:
        pass

    return metadata


def _guess_title(text: str) -> Optional[str]:
    for line in text.splitlines():
        cleaned = " ".join(line.split()).strip()
        if len(cleaned) >= 8 and "act" in cleaned.lower():
            return cleaned[:200]
    return None


def _guess_year(*values: str) -> Optional[str]:
    text = " ".join(value or "" for value in values)
    match = re.search(r"\b(18|19|20)\d{2}\b", text)
    return match.group(0) if match else None


def _count_sections(text: str) -> int:
    matches = re.findall(r"\b(?:section|sec\.?)\s+\d+[A-Za-z-]*\b", text, flags=re.IGNORECASE)
    return len(set(match.lower() for match in matches))


def _act_dict(item: dict) -> dict:
    return {
        "id": item["id"],
        "title": item["title"],
        "name": item["title"],
        "category": item.get("category") or "Bare Act",
        "jurisdiction": item.get("jurisdiction") or "Central",
        "year": item.get("year") or "-",
        "sectionsCount": item.get("sections_count", 0),
        "sections_count": item.get("sections_count", 0),
        "status": item.get("status") or "Active",
        "lastUpdated": item.get("updated_at"),
        "updatedAt": item.get("updated_at"),
        "createdAt": item.get("created_at"),
        "filename": item.get("original_filename"),
    }


def _find_advocate_item(act_id: str, advocate: Advocate) -> dict:
    for item in _load_items():
        if item.get("id") == act_id and item.get("advocate_id") == advocate.id:
            return item
    raise HTTPException(status_code=404, detail="Bare Act not found")


def _stored_pdf_response(item: dict, disposition: str) -> FileResponse:
    stored_filename = item.get("stored_filename")
    if not stored_filename:
        raise HTTPException(status_code=404, detail="Bare Act file not found")

    stored_path = UPLOAD_DIR / stored_filename
    if not stored_path.exists():
        raise HTTPException(status_code=404, detail="Bare Act file not found")

    return FileResponse(
        stored_path,
        media_type="application/pdf",
        filename=item.get("original_filename") or "bare-act.pdf",
        content_disposition_type=disposition,
    )


@router.get("/bare-acts")
def list_bare_acts(advocate: Advocate = Depends(get_current_advocate)):
    items = [
        _act_dict(item)
        for item in _load_items()
        if item.get("advocate_id") == advocate.id
    ]
    return {"success": True, "acts": items, "total": len(items)}


@router.get("/bare-acts/stats")
def bare_acts_stats(advocate: Advocate = Depends(get_current_advocate)):
    items = [
        item for item in _load_items()
        if item.get("advocate_id") == advocate.id
    ]
    cutoff = datetime.utcnow() - timedelta(days=30)

    def is_recent(item: dict) -> bool:
        try:
            return datetime.fromisoformat(item.get("created_at", "")) >= cutoff
        except ValueError:
            return False

    return {
        "success": True,
        "total_acts": len(items),
        "active_acts": sum(1 for item in items if item.get("status") == "Active"),
        "recently_added": sum(1 for item in items if is_recent(item)),
        "total_sections_indexed": sum(int(item.get("sections_count") or 0) for item in items),
    }


@router.get("/bare-acts/{act_id}/view")
def view_bare_act(act_id: str, advocate: Advocate = Depends(get_current_advocate)):
    return _stored_pdf_response(_find_advocate_item(act_id, advocate), "inline")


@router.get("/bare-acts/{act_id}/download")
def download_bare_act(act_id: str, advocate: Advocate = Depends(get_current_advocate)):
    return _stored_pdf_response(_find_advocate_item(act_id, advocate), "attachment")


@router.delete("/bare-acts/{act_id}")
def delete_bare_act(act_id: str, advocate: Advocate = Depends(get_current_advocate)):
    items = _load_items()
    kept_items = []
    deleted_item = None

    for item in items:
        if item.get("id") == act_id and item.get("advocate_id") == advocate.id:
            deleted_item = item
        else:
            kept_items.append(item)

    if deleted_item is None:
        raise HTTPException(status_code=404, detail="Bare Act not found")

    stored_filename = deleted_item.get("stored_filename")
    if stored_filename:
        stored_path = UPLOAD_DIR / stored_filename
        if stored_path.exists():
            stored_path.unlink()

    _save_items(kept_items)
    return {"success": True, "message": "Bare Act deleted successfully"}


@router.post("/bare-acts/upload", status_code=status.HTTP_201_CREATED)
def upload_bare_act(
    file: UploadFile = File(...),
    advocate: Advocate = Depends(get_current_advocate),
):
    if not _is_pdf(file):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    _ensure_store()
    act_id = str(uuid4())
    original_filename = file.filename or "bare-act.pdf"
    stored_filename = f"{act_id}.pdf"
    stored_path = UPLOAD_DIR / stored_filename

    with stored_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    metadata = _extract_pdf_metadata(stored_path, original_filename)
    now = datetime.utcnow().isoformat()
    item = {
        "id": act_id,
        "advocate_id": advocate.id,
        "title": metadata["title"],
        "category": "Bare Act",
        "jurisdiction": "Central",
        "year": metadata["year"],
        "sections_count": metadata["sections_count"],
        "status": "Active",
        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "created_at": now,
        "updated_at": now,
    }

    items = _load_items()
    items.append(item)
    _save_items(items)

    return {
        "success": True,
        "message": "Bare Act uploaded successfully",
        "act": _act_dict(item),
    }
