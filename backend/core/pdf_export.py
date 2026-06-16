"""
pdf_export.py
Generates a clean legal-court-style PDF — only the petition/draft content,
no system branding, no metadata table, no copyright footer.
"""

import io
import re
from typing import Optional

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.colors import HexColor
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def _build_pdf_reportlab(draft_text: str, metadata: dict) -> bytes:
    """
    Generate a clean, court-ready PDF.
    Contains ONLY the petition content — no branding, no table, no footer.
    """
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=30 * mm,
        rightMargin=25 * mm,
        topMargin=25 * mm,
        bottomMargin=25 * mm,
        title=metadata.get("title", "Legal Petition"),
        author=metadata.get("advocate_name", ""),
        subject=metadata.get("case_type", ""),
    )

    # ── Colour palette (neutral, court-appropriate) ───────────────────────────
    black   = HexColor("#1a1a1a")
    dark    = HexColor("#2d2d2d")
    mid     = HexColor("#3c3c3c")
    subtle  = HexColor("#888888")
    rule_clr= HexColor("#bbbbbb")

    # ── Paragraph styles ──────────────────────────────────────────────────────
    court_heading = ParagraphStyle(
        "CourtHeading",
        fontName="Times-Bold",
        fontSize=13,
        textColor=black,
        alignment=TA_CENTER,
        spaceBefore=0,
        spaceAfter=6,
        leading=18,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        fontName="Times-Bold",
        fontSize=11,
        textColor=dark,
        alignment=TA_CENTER,
        spaceBefore=10,
        spaceAfter=6,
        leading=15,
    )
    party_style = ParagraphStyle(
        "PartyStyle",
        fontName="Times-Bold",
        fontSize=10,
        textColor=dark,
        alignment=TA_CENTER,
        spaceAfter=3,
        leading=14,
    )
    body_style = ParagraphStyle(
        "Body",
        fontName="Times-Roman",
        fontSize=10.5,
        textColor=mid,
        alignment=TA_JUSTIFY,
        leading=17,
        spaceAfter=5,
        firstLineIndent=0,
    )
    numbered_style = ParagraphStyle(
        "Numbered",
        fontName="Times-Roman",
        fontSize=10.5,
        textColor=mid,
        alignment=TA_JUSTIFY,
        leading=17,
        spaceAfter=5,
        leftIndent=18,
        firstLineIndent=-18,
    )
    indent_style = ParagraphStyle(
        "Indented",
        fontName="Times-Roman",
        fontSize=10.5,
        textColor=mid,
        alignment=TA_JUSTIFY,
        leading=17,
        spaceAfter=4,
        leftIndent=24,
    )
    prayer_item_style = ParagraphStyle(
        "PrayerItem",
        fontName="Times-Roman",
        fontSize=10.5,
        textColor=mid,
        leading=17,
        spaceAfter=3,
        leftIndent=30,
        firstLineIndent=-12,
    )
    signature_style = ParagraphStyle(
        "Signature",
        fontName="Times-Roman",
        fontSize=10.5,
        textColor=mid,
        alignment=TA_LEFT,
        leading=17,
        spaceAfter=3,
    )

    story = []

    # ── Parse draft text line by line ─────────────────────────────────────────
    lines = draft_text.split("\n")
    i = 0
    while i < len(lines):
        raw  = lines[i]
        line = raw.strip()

        # blank line → small spacer
        if not line:
            story.append(Spacer(1, 3 * mm))
            i += 1
            continue

        # separator lines (━─═-=)
        if len(line) > 3 and set(line) <= set("─━═-= "):
            story.append(HRFlowable(
                width="100%", thickness=0.6,
                color=rule_clr, spaceBefore=4, spaceAfter=4
            ))
            i += 1
            continue

        # court heading lines (start with "IN THE")
        if re.match(r'^IN THE\b', line, re.IGNORECASE):
            story.append(Paragraph(line, court_heading))
            i += 1
            continue

        # BETWEEN / AND / case number blocks
        if re.match(r'^(BETWEEN|AND|O\.S\.|C\.S\.|W\.P\.|CRL\.)', line):
            story.append(Paragraph(line, section_heading))
            i += 1
            continue

        # "... PLAINTIFF" / "... DEFENDANT" lines
        if re.search(r'\.\.\.\s*(PLAINTIFF|DEFENDANT|PETITIONER|RESPONDENT|APPELLANT|ACCUSED)$', line):
            story.append(Paragraph(line, party_style))
            i += 1
            continue

        # ALL-CAPS section labels (FACTS, JURISDICTION, PRAYER, etc.)
        if re.match(r'^[A-Z][A-Z\s\/\-\:\.]{4,}$', line) and len(line) <= 80:
            story.append(Spacer(1, 2 * mm))
            story.append(Paragraph(line, section_heading))
            i += 1
            continue

        # Numbered paragraphs  "1.  text..."
        if re.match(r'^\d+\.\s+\S', line):
            story.append(Paragraph(line, numbered_style))
            i += 1
            continue

        # Prayer sub-items "(a) ..." / "(i) ..."
        if re.match(r'^\([a-z]\)\s', line) or re.match(r'^\([ivx]+\)\s', line):
            story.append(Paragraph(line, prayer_item_style))
            i += 1
            continue

        # Indented lines (4+ spaces or tab)
        if raw.startswith("    ") or raw.startswith("\t"):
            story.append(Paragraph(line, indent_style))
            i += 1
            continue

        # Signature / date lines
        if re.match(r'^(Date|Place|Dated|Advocate|Counsel|Petitioner|Plaintiff|Defendant)', line):
            story.append(Paragraph(line, signature_style))
            i += 1
            continue

        # Default body paragraph
        story.append(Paragraph(line, body_style))
        i += 1

    doc.build(story)
    buf.seek(0)
    return buf.read()


def _build_plain_text(draft_text: str) -> bytes:
    """Plain-text fallback — just the draft, no headers/footers."""
    return draft_text.encode("utf-8")


def generate_pdf(draft_text: str, metadata: dict) -> tuple:
    """
    Returns (bytes, content_type).
    Only the draft content is included — no branding, table, or copyright.
    """
    if REPORTLAB_AVAILABLE:
        try:
            return _build_pdf_reportlab(draft_text, metadata), "application/pdf"
        except Exception as e:
            print(f"[PDF] ReportLab error: {e}")

    return _build_plain_text(draft_text), "text/plain; charset=utf-8"
