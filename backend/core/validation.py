"""
Validation Engine: Checks legal drafts for completeness, missing sections,
procedural compliance, and contradiction detection.
"""

import re
from typing import Dict, List, Any, Tuple


# ─── Required Section Patterns ───────────────────────────────────────────────

REQUIRED_SECTIONS = {
    "court_heading": {
        "patterns": [r"in the\s+\w+", r"honourable", r"court", r"tribunal"],
        "label": "Court Heading",
        "severity": "critical"
    },
    "parties": {
        "patterns": [r"plaintiff", r"petitioner", r"appellant"],
        "label": "Plaintiff / Petitioner identified",
        "severity": "critical"
    },
    "defendant_party": {
        "patterns": [r"defendant", r"respondent"],
        "label": "Defendant / Respondent identified",
        "severity": "critical"
    },
    "facts": {
        "patterns": [r"facts", r"background", r"circumstances", r"para\s*\d+", r"submits"],
        "label": "Statement of Facts",
        "severity": "critical"
    },
    "jurisdiction": {
        "patterns": [r"jurisdiction", r"territorial", r"pecuniary", r"cognizance"],
        "label": "Jurisdiction paragraph",
        "severity": "high"
    },
    "cause_of_action": {
        "patterns": [r"cause of action", r"arose", r"limitation"],
        "label": "Cause of Action",
        "severity": "high"
    },
    "legal_grounds": {
        "patterns": [r"section\s+\d+", r"act,\s+\d{4}", r"code", r"statute", r"legal ground"],
        "label": "Statutory / Legal Grounds",
        "severity": "high"
    },
    "valuation": {
        "patterns": [r"court fee", r"valued at", r"valuation", r"stamp duty", r"₹\s*[\d,]+"],
        "label": "Valuation and Court Fees",
        "severity": "medium"
    },
    "prayer": {
        "patterns": [r"prayer", r"prays", r"relief", r"decree", r"order", r"direction"],
        "label": "Prayer / Relief Clause",
        "severity": "critical"
    },
    "signature": {
        "patterns": [r"respectfully submitted", r"advocate", r"counsel", r"petitioner$", r"plaintiff$"],
        "label": "Signature / Advocate details",
        "severity": "low"
    }
}

CONTRADICTION_PAIRS = [
    ("plaintiff", "defendant"),
    ("repaid", "not repaid"),
    ("paid", "unpaid"),
    ("settled", "outstanding"),
    ("received", "not received"),
    ("present", "absent"),
    ("admitted", "denied"),
]

LEGAL_TERM_GLOSSARY = {
    "plaint": "A written complaint filed in civil court initiating a civil suit",
    "plaintiff": "The party who files the suit / complaint",
    "defendant": "The party against whom the suit is filed",
    "cause of action": "The legal basis / facts giving rise to the right to sue",
    "decree": "A formal order of the court deciding the rights of parties",
    "injunction": "A court order restraining a party from doing or continuing an act",
    "affidavit": "A written sworn statement of fact",
    "vakalatnama": "Authorization given by a party to their advocate",
    "ex parte": "Proceedings conducted in the absence of one party",
    "ad interim": "Temporary / interim relief granted pending final hearing",
}


def check_draft(draft_text: str) -> Dict[str, Any]:
    """
    Main validation function.
    Returns warnings, missing sections, quality score, and suggestions.
    """
    text_lower = draft_text.lower()
    present = []
    missing = []
    warnings = []

    # ── Section completeness check ──
    for key, config in REQUIRED_SECTIONS.items():
        found = any(re.search(p, text_lower) for p in config["patterns"])
        if found:
            present.append({"key": key, "label": config["label"], "severity": config["severity"]})
        else:
            missing.append({"key": key, "label": config["label"], "severity": config["severity"]})
            if config["severity"] in ("critical", "high"):
                warnings.append({
                    "type": "missing_section",
                    "severity": config["severity"],
                    "message": f"Missing required section: {config['label']}",
                    "suggestion": f"Add a dedicated paragraph for {config['label']}"
                })

    # ── Contradiction detection ──
    contradictions = _detect_contradictions(draft_text)
    for c in contradictions:
        warnings.append({
            "type": "contradiction",
            "severity": "high",
            "message": c["message"],
            "suggestion": "Review and reconcile the contradictory statements"
        })

    # ── Specific legal checks ──
    specific_warnings = _run_specific_checks(draft_text, text_lower)
    warnings.extend(specific_warnings)

    # ── Quality Score ──
    critical_present = sum(1 for s in present if s["severity"] == "critical")
    critical_total = sum(1 for s in REQUIRED_SECTIONS.values() if s["severity"] == "critical")
    high_present = sum(1 for s in present if s["severity"] == "high")
    high_total = sum(1 for s in REQUIRED_SECTIONS.values() if s["severity"] == "high")
    quality_score = round(
        (critical_present / max(critical_total, 1)) * 0.6 +
        (high_present / max(high_total, 1)) * 0.3 +
        (len(present) / max(len(REQUIRED_SECTIONS), 1)) * 0.1,
        2
    ) * 100

    # ── Readability stats ──
    word_count = len(draft_text.split())
    para_count = len([p for p in draft_text.split("\n\n") if p.strip()])

    return {
        "quality_score": round(quality_score),
        "sections_present": present,
        "sections_missing": missing,
        "warnings": warnings,
        "contradictions_found": len(contradictions),
        "statistics": {
            "word_count": word_count,
            "paragraph_count": para_count,
            "sections_complete": len(present),
            "sections_total": len(REQUIRED_SECTIONS)
        },
        "is_valid": quality_score >= 60 and not any(
            w["severity"] == "critical" for w in warnings
        ),
        "advocate_notes": _generate_advocate_notes(missing, warnings)
    }


def _detect_contradictions(text: str) -> List[Dict]:
    """Detect contradictory statements within a document."""
    found = []
    text_lower = text.lower()
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]

    for term_a, term_b in CONTRADICTION_PAIRS:
        paras_with_a = [p for p in paragraphs if term_a in p.lower()]
        paras_with_b = [p for p in paragraphs if term_b in p.lower()]
        if paras_with_a and paras_with_b:
            found.append({
                "terms": (term_a, term_b),
                "message": f"Potential contradiction: document contains both '{term_a}' and '{term_b}' — verify consistency"
            })

    return found


def _run_specific_checks(draft: str, text_lower: str) -> List[Dict]:
    """Run domain-specific legal validation checks."""
    issues = []

    # Check limitation reference
    if "limitation" not in text_lower:
        issues.append({
            "type": "missing_legal_element",
            "severity": "medium",
            "message": "Limitation period not addressed",
            "suggestion": "Add a paragraph confirming the suit is within the limitation period under the Limitation Act, 1963"
        })

    # Check if amount/value is mentioned
    if not re.search(r"₹\s*[\d,]+|rs\.?\s*[\d,]+|rupees?\s+[\d,]+|lakh|crore", text_lower):
        issues.append({
            "type": "missing_value",
            "severity": "medium",
            "message": "Suit amount / monetary value not clearly stated",
            "suggestion": "Specify the exact amount claimed with currency symbol ₹"
        })

    # Check for vague date references
    if re.search(r"//\d{4}|___/___", draft):
        issues.append({
            "type": "incomplete_dates",
            "severity": "low",
            "message": "Incomplete dates found in draft (placeholders present)",
            "suggestion": "Fill in all date placeholders before filing"
        })

    # Check prayer clause structure
    if "prayer" in text_lower:
        prayer_idx = text_lower.find("prayer")
        prayer_section = draft[prayer_idx:prayer_idx+500]
        if not re.search(r"\(a\)|\(i\)|1\.", prayer_section.lower()):
            issues.append({
                "type": "prayer_structure",
                "severity": "low",
                "message": "Prayer clause may not be properly enumerated",
                "suggestion": "List each relief separately as (a), (b), (c)..."
            })

    return issues


def _generate_advocate_notes(missing: List, warnings: List) -> List[str]:
    """Generate actionable notes for the advocate's review."""
    notes = []
    critical_missing = [s for s in missing if s["severity"] == "critical"]
    if critical_missing:
        labels = ", ".join(s["label"] for s in critical_missing)
        notes.append(f"CRITICAL: Please add missing sections before filing: {labels}")

    high_warnings = [w for w in warnings if w["severity"] == "high"]
    if high_warnings:
        notes.append(f"Review {len(high_warnings)} high-priority issues before submission")

    notes.append("Verify all party names and addresses are correct")
    notes.append("Confirm court fee calculation with current stamp duty schedule")
    notes.append("Attach all documentary evidence listed in the petition")
    notes.append("Obtain client signature on vakalatnama before filing")

    return notes


def compare_documents(doc1: str, doc2: str) -> Dict[str, Any]:
    """
    Compare two legal documents (e.g., petition vs counter) to detect
    key factual contradictions and divergences.
    """
    doc1_lower = doc1.lower()
    doc2_lower = doc2.lower()
    conflicts = []

    # Extract key factual claims from each document
    claim_patterns = [
        (r"paid.*?₹[\d,]+|repaid.*?amount", "repayment claim"),
        (r"borrowed.*?₹[\d,]+|loan.*?₹[\d,]+", "loan amount"),
        (r"on.*?\d{1,2}/\d{1,2}/\d{4}|dated.*?\d{4}", "date reference"),
        (r"witness.*?present|in presence of", "witness claim"),
        (r"cash payment|bank transfer|cheque", "payment mode"),
    ]

    for pattern, label in claim_patterns:
        match1 = re.search(pattern, doc1_lower)
        match2 = re.search(pattern, doc2_lower)
        if match1 and match2:
            ctx1 = doc1[max(0, match1.start()-30):match1.end()+50]
            ctx2 = doc2[max(0, match2.start()-30):match2.end()+50]
            if ctx1.strip().lower() != ctx2.strip().lower():
                conflicts.append({
                    "category": label,
                    "document1_claim": ctx1.strip(),
                    "document2_claim": ctx2.strip(),
                    "analysis": f"Both documents make claims about {label} — verify which is supported by evidence"
                })

    # Sentiment divergence
    doc1_admits = ["admit", "agree", "correct", "true"]
    doc2_denies = ["deny", "false", "incorrect", "baseless"]
    admitted = [w for w in doc1_admits if w in doc1_lower]
    denied = [w for w in doc2_denies if w in doc2_lower]

    return {
        "total_conflicts": len(conflicts),
        "conflicts": conflicts,
        "document1_stance": "assertive" if any(w in doc1_lower for w in ["plaintiff", "petitioner"]) else "neutral",
        "document2_stance": "defensive" if denied else "neutral",
        "key_issues": [c["category"] for c in conflicts],
        "recommendation": (
            "Significant factual disputes exist — key evidence like receipts, bank statements, "
            "and witness testimonies will be decisive."
            if conflicts else
            "No major contradictions detected between the two documents."
        )
    }
