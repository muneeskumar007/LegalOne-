# from fastapi import APIRouter, HTTPException
# from fastapi.responses import Response
# from pydantic import BaseModel
# from typing import Dict, Any, Optional
# from core.pdf_export import generate_pdf
# from core.pdf_export import generate_docx

# router = APIRouter()

# class ExportRequest(BaseModel):
#     draft_text: str
#     metadata: Optional[Dict[str, Any]] = {}

# @router.post("/export-pdf")
# def export_pdf_endpoint(req: ExportRequest):
#     if not req.draft_text.strip():
#         raise HTTPException(status_code=400, detail="Draft text cannot be empty")
#     try:
#         meta = req.metadata or {}
#         pdf_bytes, content_type = generate_pdf(req.draft_text, meta)

#         filename = "petition_legalone.pdf" if "pdf" in content_type else "petition_legalone.txt"
#         return Response(
#             content=pdf_bytes,
#             media_type=content_type,
#             headers={
#                 "Content-Disposition": f'attachment; filename="{filename}"',
#                 "Content-Length": str(len(pdf_bytes)),
#             }
#         )
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))




from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Dict, Any, Optional

from core.pdf_export import generate_pdf
from core.docx_export import generate_docx

router = APIRouter()

class ExportRequest(BaseModel):
    draft_text: str
    metadata: Optional[Dict[str, Any]] = {}

@router.post("/export/pdf")
def export_pdf(req: ExportRequest):
    if not req.draft_text.strip():
        raise HTTPException(status_code=400, detail="Draft text cannot be empty")

    try:
        meta = req.metadata or {}
        pdf_bytes, content_type = generate_pdf(req.draft_text, meta)

        return Response(
            content=pdf_bytes,
            media_type=content_type,
            headers={
                "Content-Disposition": 'attachment; filename="petition_legalone.pdf"',
                "Content-Length": str(len(pdf_bytes)),
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export/docx")
def export_docx(req: ExportRequest):
    if not req.draft_text.strip():
        raise HTTPException(status_code=400, detail="Draft text cannot be empty")

    try:
        meta = req.metadata or {}
        docx_bytes = generate_docx(req.draft_text, meta)

        return Response(
            content=docx_bytes,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": 'attachment; filename="petition_legalone.docx"',
                "Content-Length": str(len(docx_bytes)),
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))