# # routers/judgements.py

# import os, shutil, uuid
# from pathlib import Path
# from datetime import datetime, timezone

# from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
# from fastapi.responses import FileResponse
# from sqlalchemy.orm import Session
# from pydantic import BaseModel
# from typing import Optional

# from database import get_db
# # from ..models import Judgement        # your SQLAlchemy model (see below)
# from auth import get_current_advocate as get_current_user

# router = APIRouter(prefix="/judgements", tags=["Judgements"])

# # ── same upload folder pattern as your bare-acts ──────────────────────────
# UPLOAD_DIR = Path("uploads/judgements")
# UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# # ══════════════════════════════════════════════════════
# # SCHEMAS
# # ══════════════════════════════════════════════════════

# class JudgementCreate(BaseModel):
#     case_name:        str
#     citation:         str
#     court:            str
#     year:             str
#     category:         str
#     is_key_judgement: bool = False
#     pdf_file_id:      Optional[str] = None
#     pdf_file_name:    Optional[str] = None

# class JudgementOut(BaseModel):
#     id:               str
#     case_name:        str
#     citation:         str
#     court:            str
#     year:             str
#     category:         str
#     is_key_judgement: bool
#     pdf_file_id:      Optional[str]
#     pdf_file_name:    Optional[str]
#     created_at:       datetime

#     class Config:
#         from_attributes = True


# # ══════════════════════════════════════════════════════
# # 1. UPLOAD PDF  →  POST /judgements/upload-pdf
# #    (identical flow to /bare-acts/upload)
# # ══════════════════════════════════════════════════════

# @router.post("/upload-pdf")
# async def upload_judgement_pdf(
#     file: UploadFile = File(...),
#     current_user=Depends(get_current_user),
# ):
#     # Validate PDF
#     if not file.filename.lower().endswith(".pdf"):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Only PDF files are allowed."
#         )

#     # Generate unique filename — same pattern as bare acts
#     file_id   = str(uuid.uuid4())
#     safe_name = f"{file_id}.pdf"
#     file_path = UPLOAD_DIR / safe_name

#     # Save to disk  (uploads/judgements/<uuid>.pdf)
#     with file_path.open("wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)

#     return {
#         "file_id":   file_id,
#         "file_path": str(file_path),
#         "file_name": file.filename,
#     }


# # ══════════════════════════════════════════════════════
# # 2. CREATE JUDGEMENT RECORD  →  POST /judgements
# # ══════════════════════════════════════════════════════

# @router.post("", response_model=JudgementOut)
# async def create_judgement(
#     payload: JudgementCreate,
#     db: Session = Depends(get_db),
#     current_user=Depends(get_current_user),
# ):
#     judgement = Judgement(
#         id               = str(uuid.uuid4()),
#         case_name        = payload.case_name,
#         citation         = payload.citation,
#         court            = payload.court,
#         year             = payload.year,
#         category         = payload.category,
#         is_key_judgement = payload.is_key_judgement,
#         pdf_file_id      = payload.pdf_file_id,
#         pdf_file_name    = payload.pdf_file_name,
#         advocate_id      = current_user.id,
#         created_at       = datetime.now(timezone.utc),
#     )
#     db.add(judgement)
#     db.commit()
#     db.refresh(judgement)
#     return judgement


# # ══════════════════════════════════════════════════════
# # 3. LIST  →  GET /judgements
# # ══════════════════════════════════════════════════════

# @router.get("", response_model=list[JudgementOut])
# async def list_judgements(
#     db: Session = Depends(get_db),
#     current_user=Depends(get_current_user),
# ):
#     return db.query(Judgement).filter(
#         Judgement.advocate_id == current_user.id
#     ).order_by(Judgement.created_at.desc()).all()


# # ══════════════════════════════════════════════════════
# # 4. VIEW PDF  →  GET /judgements/{file_id}/view
# #    (mirrors /bare-acts/{id}/view)
# # ══════════════════════════════════════════════════════

# @router.get("/{file_id}/view")
# async def view_judgement_pdf(
#     file_id: str,
#     current_user=Depends(get_current_user),
# ):
#     file_path = UPLOAD_DIR / f"{file_id}.pdf"
#     if not file_path.exists():
#         raise HTTPException(status_code=404, detail="PDF not found.")
#     return FileResponse(
#         path=str(file_path),
#         media_type="application/pdf",
#         headers={"Content-Disposition": "inline"},
#     )


# # ══════════════════════════════════════════════════════
# # 5. DOWNLOAD PDF  →  GET /judgements/{file_id}/download
# #    (mirrors /bare-acts/{id}/download)
# # ══════════════════════════════════════════════════════

# @router.get("/{file_id}/download")
# async def download_judgement_pdf(
#     file_id: str,
#     db: Session = Depends(get_db),
#     current_user=Depends(get_current_user),
# ):
#     judgement = db.query(Judgement).filter(
#         Judgement.pdf_file_id == file_id,
#         Judgement.advocate_id == current_user.id,
#     ).first()

#     file_path = UPLOAD_DIR / f"{file_id}.pdf"
#     if not file_path.exists():
#         raise HTTPException(status_code=404, detail="PDF not found.")

#     filename = judgement.pdf_file_name if judgement else f"{file_id}.pdf"
#     return FileResponse(
#         path=str(file_path),
#         media_type="application/pdf",
#         filename=filename,
#         headers={"Content-Disposition": f'attachment; filename="{filename}"'},
#     )


# # ══════════════════════════════════════════════════════
# # 6. DELETE  →  DELETE /judgements/{id}
# # ══════════════════════════════════════════════════════

# @router.delete("/{judgement_id}", status_code=204)
# async def delete_judgement(
#     judgement_id: str,
#     db: Session = Depends(get_db),
#     current_user=Depends(get_current_user),
# ):
#     judgement = db.query(Judgement).filter(
#         Judgement.id == judgement_id,
#         Judgement.advocate_id == current_user.id,
#     ).first()

#     if not judgement:
#         raise HTTPException(status_code=404, detail="Judgement not found.")

#     # Delete PDF file from disk too
#     if judgement.pdf_file_id:
#         file_path = UPLOAD_DIR / f"{judgement.pdf_file_id}.pdf"
#         if file_path.exists():
#             file_path.unlink()

#     db.delete(judgement)
#     db.commit()






# routers/judgements.py

import os, shutil, uuid
from pathlib import Path
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional

from database import get_db
from auth import get_current_advocate as get_current_user

router = APIRouter(prefix="/judgements", tags=["Judgements"])

UPLOAD_DIR = Path("uploads/judgements")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ── Ensure table exists (runs once per row insert attempt — cheap, idempotent) ──
def _ensure_table(db: Session):
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS judgements (
            id               TEXT PRIMARY KEY,
            case_name        TEXT NOT NULL,
            citation         TEXT NOT NULL,
            court            TEXT NOT NULL,
            year             TEXT NOT NULL,
            category         TEXT NOT NULL,
            is_key_judgement BOOLEAN DEFAULT 0,
            pdf_file_id      TEXT,
            pdf_file_name    TEXT,
            advocate_id      TEXT NOT NULL,
            created_at       TEXT NOT NULL
        )
    """))
    db.commit()


# ══════════════════════════════════════════════════════
# SCHEMAS
# ══════════════════════════════════════════════════════

class JudgementCreate(BaseModel):
    case_name:        str
    citation:         str
    court:            str
    year:             str
    category:         str
    is_key_judgement: bool = False
    pdf_file_id:      Optional[str] = None
    pdf_file_name:    Optional[str] = None

class JudgementOut(BaseModel):
    id:               str
    case_name:        str
    citation:         str
    court:            str
    year:             str
    category:         str
    is_key_judgement: bool
    pdf_file_id:      Optional[str]
    pdf_file_name:    Optional[str]
    created_at:       str


# ══════════════════════════════════════════════════════
# 1. UPLOAD PDF  →  POST /judgements/upload-pdf
# ══════════════════════════════════════════════════════

@router.post("/upload-pdf")
async def upload_judgement_pdf(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed.")

    file_id   = str(uuid.uuid4())
    safe_name = f"{file_id}.pdf"
    file_path = UPLOAD_DIR / safe_name

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "file_id":   file_id,
        "file_path": str(file_path),
        "file_name": file.filename,
    }


# ══════════════════════════════════════════════════════
# 2. CREATE JUDGEMENT RECORD  →  POST /judgements
# ══════════════════════════════════════════════════════

@router.post("", response_model=JudgementOut)
async def create_judgement(
    payload: JudgementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_table(db)
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    db.execute(text("""
        INSERT INTO judgements
            (id, case_name, citation, court, year, category, is_key_judgement,
             pdf_file_id, pdf_file_name, advocate_id, created_at)
        VALUES
            (:id, :case_name, :citation, :court, :year, :category, :is_key_judgement,
             :pdf_file_id, :pdf_file_name, :advocate_id, :created_at)
    """), {
        "id": new_id,
        "case_name": payload.case_name,
        "citation": payload.citation,
        "court": payload.court,
        "year": payload.year,
        "category": payload.category,
        "is_key_judgement": payload.is_key_judgement,
        "pdf_file_id": payload.pdf_file_id,
        "pdf_file_name": payload.pdf_file_name,
        "advocate_id": current_user.id,
        "created_at": now,
    })
    db.commit()

    row = db.execute(text("SELECT * FROM judgements WHERE id = :id"), {"id": new_id}).mappings().first()
    return dict(row)


# ══════════════════════════════════════════════════════
# 3. LIST  →  GET /judgements
# ══════════════════════════════════════════════════════

@router.get("", response_model=list[JudgementOut])
async def list_judgements(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_table(db)
    rows = db.execute(text("""
        SELECT * FROM judgements
        WHERE advocate_id = :advocate_id
        ORDER BY created_at DESC
    """), {"advocate_id": current_user.id}).mappings().all()
    return [dict(r) for r in rows]


# ══════════════════════════════════════════════════════
# 4. VIEW PDF  →  GET /judgements/{file_id}/view
# ══════════════════════════════════════════════════════

@router.get("/{file_id}/view")
async def view_judgement_pdf(
    file_id: str,
    current_user=Depends(get_current_user),
):
    file_path = UPLOAD_DIR / f"{file_id}.pdf"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found.")
    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        headers={"Content-Disposition": "inline"},
    )


# ══════════════════════════════════════════════════════
# 5. DOWNLOAD PDF  →  GET /judgements/{file_id}/download
# ══════════════════════════════════════════════════════

@router.get("/{file_id}/download")
async def download_judgement_pdf(
    file_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_table(db)
    row = db.execute(text("""
        SELECT * FROM judgements
        WHERE pdf_file_id = :file_id AND advocate_id = :advocate_id
    """), {"file_id": file_id, "advocate_id": current_user.id}).mappings().first()

    file_path = UPLOAD_DIR / f"{file_id}.pdf"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found.")

    filename = row["pdf_file_name"] if row else f"{file_id}.pdf"
    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ══════════════════════════════════════════════════════
# 6. DELETE  →  DELETE /judgements/{id}
# ══════════════════════════════════════════════════════

@router.delete("/{judgement_id}", status_code=204)
async def delete_judgement(
    judgement_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_table(db)
    row = db.execute(text("""
        SELECT * FROM judgements WHERE id = :id AND advocate_id = :advocate_id
    """), {"id": judgement_id, "advocate_id": current_user.id}).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Judgement not found.")

    if row["pdf_file_id"]:
        file_path = UPLOAD_DIR / f"{row['pdf_file_id']}.pdf"
        if file_path.exists():
            file_path.unlink()

    db.execute(text("DELETE FROM judgements WHERE id = :id"), {"id": judgement_id})
    db.commit()