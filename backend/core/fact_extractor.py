"""
Fact Extractor: Extracts structured legal facts from free-text user input.
Uses regex patterns + heuristics. Can be upgraded with spaCy NER.
"""

import re
from typing import Dict, Any, List, Optional
from datetime import datetime


# ─── Entity Extraction Patterns ──────────────────────────────────────────────

AMOUNT_PATTERNS = [
    r"₹\s*([\d,]+(?:\.\d{2})?)",
    r"rs\.?\s*([\d,]+(?:\.\d{2})?)",
    r"rupees?\s+([\d,]+)",
    r"([\d,]+)\s+rupees?",
    r"(\d+(?:\.\d+)?)\s+lakh",
    r"(\d+(?:\.\d+)?)\s+crore",
    r"inr\s*([\d,]+)",
]

DATE_PATTERNS = [
    r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
    r"(\d{4}[/-]\d{1,2}[/-]\d{1,2})",
    r"(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}",
    r"(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4})",
    r"(\d+)\s+year[s]?\s+ago",
    r"(\d+)\s+month[s]?\s+ago",
]

NAME_CONTEXT_PATTERNS = [
    (r"(?:plaintiff|petitioner|complainant|applicant)[,\s]+(?:namely\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)", "plaintiff_name"),
    (r"(?:defendant|respondent|accused|opposite party)[,\s]+(?:namely\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)", "defendant_name"),
    (r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:files?|filed|instituted|brought)", "plaintiff_name"),
    (r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:vs\.?|versus|against)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)", "party_names"),
    (r"([A-Z][a-z]+)\s+borrowed|([A-Z][a-z]+)\s+failed to repay", "defendant_name"),
]

CASE_INDICATORS = {
    "money_recovery": ["borrow", "loan", "lend", "repay", "debt", "recover", "money", "amount", "due"],
    "cheque_dishonour": ["cheque", "dishonour", "bounce", "138"],
    "property_dispute": ["property", "land", "house", "encroach", "possession", "title"],
    "criminal_assault": ["assault", "beat", "attack", "hurt", "injury", "fight"],
    "domestic_violence": ["domestic violence", "498a", "cruelty", "dowry", "matrimonial"],
    "consumer_complaint": ["consumer", "defect", "product", "service", "refund"],
}


def extract_facts(text: str) -> Dict[str, Any]:
    """
    Main extraction function. Returns structured facts dict from free text.
    """
    facts: Dict[str, Any] = {
        "raw_input": text,
        "case_summary": _summarize(text),
        "plaintiff_name": None,
        "defendant_name": None,
        "amount": None,
        "dates": [],
        "cause_of_action": None,
        "evidence_mentioned": [],
        "location": None,
        "case_type_hint": None,
        "additional_facts": []
    }

    # Extract names
    names = _extract_names(text)
    if names.get("plaintiff"):
        facts["plaintiff_name"] = names["plaintiff"]
    if names.get("defendant"):
        facts["defendant_name"] = names["defendant"]

    # Extract amount
    amount = _extract_amount(text)
    if amount:
        facts["amount"] = amount

    # Extract dates
    facts["dates"] = _extract_dates(text)

    # Extract evidence mentions
    facts["evidence_mentioned"] = _extract_evidence(text)

    # Extract location
    facts["location"] = _extract_location(text)

    # Detect case type
    facts["case_type_hint"] = _detect_case_type_hint(text)

    # Extract cause of action
    facts["cause_of_action"] = _extract_cause_of_action(text, facts["case_type_hint"])

    # Extract additional facts
    facts["additional_facts"] = _extract_additional_facts(text)

    return facts


def _extract_names(text: str) -> Dict[str, Optional[str]]:
    result = {"plaintiff": None, "defendant": None}

    # Pattern: "X files/filed against Y"
    m = re.search(
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:files?|filed|has filed|is filing)\s+.{0,50}against\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        text
    )
    if m:
        result["plaintiff"] = m.group(1).strip()
        result["defendant"] = m.group(2).strip()
        return result

    # Pattern: "X vs Y"
    m = re.search(
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:vs?\.?|versus)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
        text, re.IGNORECASE
    )
    if m:
        result["plaintiff"] = m.group(1).strip()
        result["defendant"] = m.group(2).strip()
        return result

    # Pattern: plaintiff mentioned first
    capitalized = re.findall(r'\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})*)\b', text)
    # Filter out common legal terms
    stopwords = {"The", "This", "Court", "Section", "Act", "Code", "Civil",
                 "Criminal", "District", "High", "Supreme", "India", "State"}
    names = [n for n in capitalized if n not in stopwords and len(n) > 2]
    if len(names) >= 2:
        result["plaintiff"] = names[0]
        result["defendant"] = names[1]
    elif len(names) == 1:
        result["plaintiff"] = names[0]

    return result


def _extract_amount(text: str) -> Optional[str]:
    for pattern in AMOUNT_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            raw = m.group(1).replace(",", "")
            if "lakh" in pattern:
                val = float(raw) * 100000
                return f"₹{int(val):,}"
            elif "crore" in pattern:
                val = float(raw) * 10000000
                return f"₹{int(val):,}"
            else:
                return f"₹{int(float(raw)):,}"
    return None


def _extract_dates(text: str) -> List[str]:
    dates = []
    for pattern in DATE_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for m in matches:
            d = m if isinstance(m, str) else " ".join(m).strip()
            if d and d not in dates:
                dates.append(d)
    return dates[:5]  # cap at 5


def _extract_evidence(text: str) -> List[str]:
    evidence_keywords = [
        "bank statement", "bank transfer", "receipt", "promissory note",
        "agreement", "contract", "photograph", "video", "witness",
        "medical certificate", "medical report", "call history", "message",
        "whatsapp", "email", "cheque", "invoice", "bill", "voucher",
        "sale deed", "registration", "FIR", "police report"
    ]
    found = []
    text_lower = text.lower()
    for kw in evidence_keywords:
        if kw in text_lower:
            found.append(kw.title())
    return found


def _extract_location(text: str) -> Optional[str]:
    # Look for common Indian city/district names or address patterns
    location_patterns = [
        r"at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
        r"in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:district|city|town|village)",
        r"([A-Z][a-z]+)\s+(?:district|city|court)",
    ]
    for p in location_patterns:
        m = re.search(p, text)
        if m:
            return m.group(1)
    return None


def _detect_case_type_hint(text: str) -> str:
    text_lower = text.lower()
    scores = {k: sum(1 for kw in v if kw in text_lower) for k, v in CASE_INDICATORS.items()}
    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "money_recovery"


def _extract_cause_of_action(text: str, case_type: str) -> str:
    coa_map = {
        "money_recovery": "Failure to repay borrowed money / breach of contractual obligation",
        "cheque_dishonour": "Dishonour of cheque under Section 138 of Negotiable Instruments Act",
        "property_dispute": "Unlawful encroachment / denial of title / illegal possession",
        "criminal_assault": "Physical assault causing hurt / grievous hurt",
        "domestic_violence": "Acts of domestic violence, cruelty, and harassment",
        "consumer_complaint": "Deficiency in service / defect in goods causing loss to consumer",
    }
    return coa_map.get(case_type, "Breach of legal obligation")


def _extract_additional_facts(text: str) -> List[str]:
    """Extract any additional notable facts from the text."""
    facts = []
    text_lower = text.lower()

    if "demand" in text_lower or "demanded" in text_lower:
        facts.append("Demand for repayment was made")
    if "refuse" in text_lower or "refused" in text_lower or "failed" in text_lower:
        facts.append("Defendant failed/refused to comply with demand")
    if "witness" in text_lower:
        facts.append("Witnesses were present at relevant events")
    if "interest" in text_lower:
        facts.append("Interest on the amount is also claimed")
    if any(w in text_lower for w in ["oral", "verbal", "spoke"]):
        facts.append("Oral agreement / verbal communications involved")
    if any(w in text_lower for w in ["written", "signed", "document"]):
        facts.append("Written documentation exists")

    return facts


def _summarize(text: str) -> str:
    """Create a brief summary of the case from input text."""
    # Simple extractive summary: take first 2 sentences or 150 chars
    sentences = re.split(r'[.!?]\s+', text.strip())
    summary = ". ".join(sentences[:2]) if len(sentences) >= 2 else text[:200]
    return summary[:300] + ("..." if len(summary) > 300 else "")
