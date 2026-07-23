# """
# Fact Extractor: Extracts structured legal facts from free-text user input.
# Uses regex patterns + heuristics. Can be upgraded with spaCy NER.
# """

# import re
# from typing import Dict, Any, List, Optional
# from datetime import datetime


# # ─── Entity Extraction Patterns ──────────────────────────────────────────────

# AMOUNT_PATTERNS = [
#     r"₹\s*([\d,]+(?:\.\d{2})?)",
#     r"rs\.?\s*([\d,]+(?:\.\d{2})?)",
#     r"rupees?\s+([\d,]+)",
#     r"([\d,]+)\s+rupees?",
#     r"(\d+(?:\.\d+)?)\s+lakh",
#     r"(\d+(?:\.\d+)?)\s+crore",
#     r"inr\s*([\d,]+)",
# ]

# DATE_PATTERNS = [
#     r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
#     r"(\d{4}[/-]\d{1,2}[/-]\d{1,2})",
#     r"(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}",
#     r"(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4})",
#     r"(\d+)\s+year[s]?\s+ago",
#     r"(\d+)\s+month[s]?\s+ago",
# ]

# NAME_CONTEXT_PATTERNS = [
#     (r"(?:plaintiff|petitioner|complainant|applicant)[,\s]+(?:namely\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)", "plaintiff_name"),
#     (r"(?:defendant|respondent|accused|opposite party)[,\s]+(?:namely\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)", "defendant_name"),
#     (r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:files?|filed|instituted|brought)", "plaintiff_name"),
#     (r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:vs\.?|versus|against)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)", "party_names"),
#     (r"([A-Z][a-z]+)\s+borrowed|([A-Z][a-z]+)\s+failed to repay", "defendant_name"),
# ]

# CASE_INDICATORS = {
#     "money_recovery": ["borrow", "loan", "lend", "repay", "debt", "recover", "money", "amount", "due"],
#     "cheque_dishonour": ["cheque", "dishonour", "bounce", "138"],
#     "property_dispute": ["property", "land", "house", "encroach", "possession", "title"],
#     "criminal_assault": ["assault", "beat", "attack", "hurt", "injury", "fight"],
#     "domestic_violence": ["domestic violence", "498a", "cruelty", "dowry", "matrimonial"],
#     "consumer_complaint": ["consumer", "defect", "product", "service", "refund"],
# }


# def extract_facts(text: str) -> Dict[str, Any]:
#     """
#     Main extraction function. Returns structured facts dict from free text.
#     """
#     facts: Dict[str, Any] = {
#         "raw_input": text,
#         "case_summary": _summarize(text),
#         "plaintiff_name": None,
#         "defendant_name": None,
#         "amount": None,
#         "dates": [],
#         "cause_of_action": None,
#         "evidence_mentioned": [],
#         "location": None,
#         "case_type_hint": None,
#         "additional_facts": []
#     }

#     # Extract names
#     names = _extract_names(text)
#     if names.get("plaintiff"):
#         facts["plaintiff_name"] = names["plaintiff"]
#     if names.get("defendant"):
#         facts["defendant_name"] = names["defendant"]

#     # Extract amount
#     amount = _extract_amount(text)
#     if amount:
#         facts["amount"] = amount

#     # Extract dates
#     facts["dates"] = _extract_dates(text)

#     # Extract evidence mentions
#     facts["evidence_mentioned"] = _extract_evidence(text)

#     # Extract location
#     facts["location"] = _extract_location(text)

#     # Detect case type
#     facts["case_type_hint"] = _detect_case_type_hint(text)

#     # Extract cause of action
#     facts["cause_of_action"] = _extract_cause_of_action(text, facts["case_type_hint"])

#     # Extract additional facts
#     facts["additional_facts"] = _extract_additional_facts(text)

#     return facts


# def _extract_names(text: str) -> Dict[str, Optional[str]]:
#     result = {"plaintiff": None, "defendant": None}

#     # Pattern: "X files/filed against Y"
#     m = re.search(
#         r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:files?|filed|has filed|is filing)\s+.{0,50}against\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
#         text
#     )
#     if m:
#         result["plaintiff"] = m.group(1).strip()
#         result["defendant"] = m.group(2).strip()
#         return result

#     # Pattern: "X vs Y"
#     m = re.search(
#         r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:vs?\.?|versus)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
#         text, re.IGNORECASE
#     )
#     if m:
#         result["plaintiff"] = m.group(1).strip()
#         result["defendant"] = m.group(2).strip()
#         return result

#     # Pattern: plaintiff mentioned first
#     capitalized = re.findall(r'\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})*)\b', text)
#     # Filter out common legal terms
#     stopwords = {"The", "This", "Court", "Section", "Act", "Code", "Civil",
#                  "Criminal", "District", "High", "Supreme", "India", "State"}
#     names = [n for n in capitalized if n not in stopwords and len(n) > 2]
#     if len(names) >= 2:
#         result["plaintiff"] = names[0]
#         result["defendant"] = names[1]
#     elif len(names) == 1:
#         result["plaintiff"] = names[0]

#     return result


# def _extract_amount(text: str) -> Optional[str]:
#     for pattern in AMOUNT_PATTERNS:
#         m = re.search(pattern, text, re.IGNORECASE)
#         if m:
#             raw = m.group(1).replace(",", "")
#             if "lakh" in pattern:
#                 val = float(raw) * 100000
#                 return f"₹{int(val):,}"
#             elif "crore" in pattern:
#                 val = float(raw) * 10000000
#                 return f"₹{int(val):,}"
#             else:
#                 return f"₹{int(float(raw)):,}"
#     return None


# def _extract_dates(text: str) -> List[str]:
#     dates = []
#     for pattern in DATE_PATTERNS:
#         matches = re.findall(pattern, text, re.IGNORECASE)
#         for m in matches:
#             d = m if isinstance(m, str) else " ".join(m).strip()
#             if d and d not in dates:
#                 dates.append(d)
#     return dates[:5]  # cap at 5


# def _extract_evidence(text: str) -> List[str]:
#     evidence_keywords = [
#         "bank statement", "bank transfer", "receipt", "promissory note",
#         "agreement", "contract", "photograph", "video", "witness",
#         "medical certificate", "medical report", "call history", "message",
#         "whatsapp", "email", "cheque", "invoice", "bill", "voucher",
#         "sale deed", "registration", "FIR", "police report"
#     ]
#     found = []
#     text_lower = text.lower()
#     for kw in evidence_keywords:
#         if kw in text_lower:
#             found.append(kw.title())
#     return found


# def _extract_location(text: str) -> Optional[str]:
#     # Look for common Indian city/district names or address patterns
#     location_patterns = [
#         r"at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
#         r"in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:district|city|town|village)",
#         r"([A-Z][a-z]+)\s+(?:district|city|court)",
#     ]
#     for p in location_patterns:
#         m = re.search(p, text)
#         if m:
#             return m.group(1)
#     return None


# def _detect_case_type_hint(text: str) -> str:
#     text_lower = text.lower()
#     scores = {k: sum(1 for kw in v if kw in text_lower) for k, v in CASE_INDICATORS.items()}
#     best = max(scores, key=lambda k: scores[k])
#     return best if scores[best] > 0 else "money_recovery"


# def _extract_cause_of_action(text: str, case_type: str) -> str:
#     coa_map = {
#         "money_recovery": "Failure to repay borrowed money / breach of contractual obligation",
#         "cheque_dishonour": "Dishonour of cheque under Section 138 of Negotiable Instruments Act",
#         "property_dispute": "Unlawful encroachment / denial of title / illegal possession",
#         "criminal_assault": "Physical assault causing hurt / grievous hurt",
#         "domestic_violence": "Acts of domestic violence, cruelty, and harassment",
#         "consumer_complaint": "Deficiency in service / defect in goods causing loss to consumer",
#     }
#     return coa_map.get(case_type, "Breach of legal obligation")


# def _extract_additional_facts(text: str) -> List[str]:
#     """Extract any additional notable facts from the text."""
#     facts = []
#     text_lower = text.lower()

#     if "demand" in text_lower or "demanded" in text_lower:
#         facts.append("Demand for repayment was made")
#     if "refuse" in text_lower or "refused" in text_lower or "failed" in text_lower:
#         facts.append("Defendant failed/refused to comply with demand")
#     if "witness" in text_lower:
#         facts.append("Witnesses were present at relevant events")
#     if "interest" in text_lower:
#         facts.append("Interest on the amount is also claimed")
#     if any(w in text_lower for w in ["oral", "verbal", "spoke"]):
#         facts.append("Oral agreement / verbal communications involved")
#     if any(w in text_lower for w in ["written", "signed", "document"]):
#         facts.append("Written documentation exists")

#     return facts


# def _summarize(text: str) -> str:
#     """Create a brief summary of the case from input text."""
#     # Simple extractive summary: take first 2 sentences or 150 chars
#     sentences = re.split(r'[.!?]\s+', text.strip())
#     summary = ". ".join(sentences[:2]) if len(sentences) >= 2 else text[:200]
#     return summary[:300] + ("..." if len(summary) > 300 else "")





# new




"""
final_extractor.py  —  drop into legalone/backend/core/fact_extractor.py
Fixed all regex patterns. Correctly identifies petitioner name, respondent name,
addresses, and all matrimonial case details.
"""
import re
from typing import Dict, Any, List, Optional

TITLES = r"(?:Mr\.|Mrs\.|Ms\.|Dr\.|Master\s+)"
NAME   = r"(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}"
PLAIN_NAME = r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}"

STOPWORDS = {
    "Hindu","Muslim","Christian","India","Court","Family","High","Supreme",
    "District","Sessions","Principal","Judge","Delhi","Mumbai","Chennai",
    "Bangalore","Kolkata","New","Greater","Lajpat","Rajouri","Grand",
    "Section","Marriage","Special","Act","Code","Petitioner","Respondent",
}

def _clean(name: str) -> Optional[str]:
    if not name: return None
    n = re.sub(r"\s*\(née\s+\w+\)", "", name).strip().rstrip(",.:;")
    if len(n) < 3 or n in STOPWORDS: return None
    return n


# ─── NAMES ────────────────────────────────────────────────────────────────────

def _names(text: str) -> Dict:
    pet, res = None, None

    # Pattern A: "instructed by the Petitioner, Mr. X"
    m = re.search(rf"(?:instructed by|on behalf of)\s+the\s+[Pp]etitioner,?\s+({NAME})", text, re.IGNORECASE)
    if m: pet = _clean(m.group(1))

    # Pattern B: "Petitioner, Mr. X" anywhere
    if not pet:
        m = re.search(rf"[Pp]etitioner,?\s+({NAME})", text, re.IGNORECASE)
        if m: pet = _clean(m.group(1))

    # Pattern C: "I, Rohan Malhotra ... do hereby verify"
    if not pet:
        m = re.search(rf"I,\s+({NAME}),", text, re.IGNORECASE)
        if m: pet = _clean(m.group(1))

    # Pattern D: Party block "Name ...\n...Petitioner"
    if not pet:
        m = re.search(rf"({NAME})[,\s\n]+[^.]*?\.\.\.\s*[Pp]etitioner", text)
        if m: pet = _clean(m.group(1))

    # RESPONDENT
    m = re.search(rf"[Rr]espondent,?\s+({NAME})", text)
    if m: res = _clean(m.group(1))

    if not res:
        m = re.search(rf"against\s+(?:the\s+)?[Rr]espondent,?\s+({NAME})", text, re.IGNORECASE)
        if m: res = _clean(m.group(1))

    if not res:
        m = re.search(rf"(?:his\s+wife|her\s+husband|his\s+spouse|her\s+spouse),?\s+({NAME})", text, re.IGNORECASE)
        if m: res = _clean(m.group(1))

    if not res:
        m = re.search(rf"({NAME})[,\s\n]+[^.]*?\.\.\.\s*[Rr]espondent", text)
        if m: res = _clean(m.group(1))

    # Fallback X vs Y
    if not pet or not res:
        m = re.search(rf"({NAME})\s+(?:vs?\.?|versus)\s+({NAME})", text, re.IGNORECASE)
        if m:
            if not pet: pet = _clean(m.group(1))
            if not res: res = _clean(m.group(2))

    return {"petitioner": pet, "respondent": res}


# ─── AGES ─────────────────────────────────────────────────────────────────────

def _ages(text: str, pet: str, res: str) -> Dict:
    def get_age_near(name):
        if not name: return None
        idx = text.find(name)
        if idx == -1: return None
        window = text[idx: idx+200]
        m = re.search(r"aged?\s+(?:about\s+)?(\d{1,3})\s*years?", window, re.IGNORECASE)
        return m.group(1) if m else None

    p_age = get_age_near(pet)
    r_age = get_age_near(res)

    # Fallback: first two ages in doc
    if not p_age or not r_age:
        all_ages = re.findall(r"aged?\s+(?:about\s+)?(\d{1,3})\s*years?", text, re.IGNORECASE)
        if all_ages and not p_age: p_age = all_ages[0]
        if len(all_ages) > 1 and not r_age: r_age = all_ages[1]

    return {"petitioner_age": p_age, "respondent_age": r_age}


# ─── ADDRESSES ────────────────────────────────────────────────────────────────

def _addresses(text: str, pet: str, res: str) -> Dict:
    addrs = {"petitioner_address": None, "respondent_address": None, "matrimonial_home": None}

    def get_addr_near(name):
        if not name: return None
        idx = text.find(name)
        if idx == -1: return None
        window = text[idx: idx+400]
        # R/o or residing at
        m = re.search(
            r"(?:R/o|residing\s+at|resident\s+of|address\s*:)\s*([A-Z0-9][^.\n]{10,120})",
            window, re.IGNORECASE
        )
        if m:
            addr = m.group(1).strip().rstrip(",")
            # Clean up trailing noise
            addr = re.sub(r"\s*\.\.\.\s*(?:Petitioner|Respondent|Appellant).*$", "", addr, flags=re.IGNORECASE)
            return addr.strip()
        return None

    addrs["petitioner_address"] = get_addr_near(pet)
    addrs["respondent_address"] = get_addr_near(res)

    # Matrimonial home
    m = re.search(r"matrimonial home\s+(?:situated\s+)?at\s+([^.\n]{10,100})", text, re.IGNORECASE)
    if m: addrs["matrimonial_home"] = m.group(1).strip().rstrip(",")

    return addrs


# ─── MARRIAGE ─────────────────────────────────────────────────────────────────

def _marriage(text: str) -> Dict:
    d = {"marriage_date": None, "marriage_place": None,
         "marriage_type": None, "separation_date": None}

    # Marriage date
    for pat in [
        r"solemnized\s+on\s+([\d]{1,2}[\.\-/][\d]{1,2}[\.\-/][\d]{4})",
        r"married\s+on\s+([\d]{1,2}[\.\-/][\d]{1,2}[\.\-/][\d]{4})",
        r"marriage\s+(?:was\s+)?(?:solemnized|performed|registered)\s+on\s+([\d]{1,2}[\.\-/][\d]{1,2}[\.\-/][\d]{4})",
        r"wedding\s+(?:held\s+)?on\s+([\d]{1,2}[\.\-/][\d]{1,2}[\.\-/][\d]{4})",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m: d["marriage_date"] = m.group(1); break

    # Separation date
    for pat in [
        r"(?:living|residing)\s+separately\s+since\s+([\d]{1,2}[\.\-/][\d]{1,2}[\.\-/][\d]{4})",
        r"separated\s+(?:on|since)\s+([\d]{1,2}[\.\-/][\d]{1,2}[\.\-/][\d]{4})",
        r"separated\s+since\s+(\w+\s+\d{4})",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m: d["separation_date"] = m.group(1); break

    # Marriage place
    for pat in [
        r"solemnized\s+on\s+[\d\.\-/]+\s+at\s+([^,\n]{5,80}?)(?:,\s*according|,\s*New|\s+according)",
        r"solemnized\s+at\s+([^,\n]{5,80}?)(?:,\s*according|,\s*New|\s+according)",
        r"marriage\s+(?:was\s+)?held\s+at\s+([^,\n]{5,60})",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m: d["marriage_place"] = m.group(1).strip().rstrip(","); break

    # Marriage type
    for t in ["Hindu", "Muslim", "Christian", "Special Marriage Act", "Arya Samaj", "Court Marriage"]:
        if t.lower() in text.lower():
            d["marriage_type"] = t; break

    return d


# ─── OCCUPATION ───────────────────────────────────────────────────────────────

def _occupation(text: str) -> Dict:
    occ = {"petitioner_occupation": None, "respondent_occupation": None}
    patterns = [
        r"employed\s+as\s+(?:a\s+)?([^,\n.]{5,60}?)(?:\s+with\s+|\s+at\s+M/s|\s+in\s+)",
        r"working\s+as\s+(?:a\s+)?([^,\n.]{5,60}?)(?:\s+with|\s+at|\s+in|[,\.])",
        r"(?:is|are)\s+(?:a\s+)?((?:Senior\s+|Junior\s+)?(?:Manager|Engineer|Doctor|Teacher|Lawyer|"
        r"Advocate|Officer|Director|Professor|Accountant|Software Developer|Homemaker)[^,\n.]{0,40})",
    ]
    found = []
    for pat in patterns:
        found.extend(re.findall(pat, text, re.IGNORECASE))
    clean = [f.strip().strip(",.:") for f in found if len(f.strip()) > 3]
    if clean: occ["petitioner_occupation"] = clean[0]
    if len(clean) > 1: occ["respondent_occupation"] = clean[1]
    return occ


# ─── CHILDREN ─────────────────────────────────────────────────────────────────

def _children(text: str) -> List:
    kids = []
    m = re.findall(
        r"(?:one\s+|a\s+)?(?:male|female|son|daughter)\s+child,?\s+namely\s+([^,]+?)(?:,\s*aged?\s+(?:about\s+)?(\d+)\s*years?)?(?:,\s*(?:born|b\.)\s+(?:on\s+)?([\d\.\-/]+))?",
        text, re.IGNORECASE
    )
    for name, age, dob in m:
        kids.append({"name": name.strip(), "age": age or None, "dob": dob or None})
    if not kids and re.search(r"no\s+(?:child|issue|children)", text, re.IGNORECASE):
        return []
    return kids


# ─── JURISDICTION ─────────────────────────────────────────────────────────────

def _jurisdiction(text: str) -> Dict:
    j = {"court": None, "city": None}
    m = re.search(
        r"IN\s+THE\s+COURT\s+OF\s+(?:THE\s+)?([^,\n]{10,80}?)\s+(?:AT|,)\s+([A-Z][a-zA-Z\s]+?)(?:\n|,|\Z)",
        text, re.IGNORECASE
    )
    if m:
        j["court"] = m.group(1).strip()
        j["city"]  = m.group(2).strip()
        return j

    m = re.search(
        r"(Family Court|District Court|Sessions Court|High Court|Principal Judge[^,\n]{0,30})"
        r"[^,\n]{0,20}(?:at|,)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
        text, re.IGNORECASE
    )
    if m:
        j["court"] = m.group(1).strip()
        j["city"]  = m.group(2).strip()
    return j


# ─── GROUND & RELIEF ──────────────────────────────────────────────────────────

def _ground_relief(text: str) -> Dict:
    tl = text.lower()
    ground_map = {
        "cruelty":          ["cruelty","cruel","13(1)(ia)","section 13(1)(ia)"],
        "desertion":        ["desertion","deserted","13(1)(ib)"],
        "adultery":         ["adultery","adulterous","extra-marital"],
        "mutual consent":   ["mutual consent","13b","section 13b"],
        "maintenance":      ["section 125","s.125","maintenance"],
        "custody":          ["custody","guardianship"],
        "cheque bounce":    ["section 138","cheque dishonour","dishonour"],
        "money recovery":   ["money recovery","suit for recovery","loan"],
    }
    ground = next((g for g, kws in ground_map.items() if any(k in tl for k in kws)), None)

    reliefs = []
    for r, kws in {
        "divorce":["divorce","dissolution of marriage"],
        "maintenance":["maintenance","alimony","interim maintenance"],
        "custody":["custody","guardian"],
        "injunction":["injunction","restrain"],
    }.items():
        if any(k in tl for k in kws): reliefs.append(r)

    case_type = (
        "divorce_petition" if "divorce" in tl or "matrimonial" in tl else
        "maintenance"      if "maintenance" in tl else
        "custody"          if "custody" in tl else
        "cheque_bounce"    if "cheque" in tl or "138" in tl else
        "money_recovery"   if "money" in tl else "civil_petition"
    )
    return {"ground": ground, "relief": ", ".join(reliefs) or None, "case_type": case_type}


# ─── ADVOCATE ─────────────────────────────────────────────────────────────────

def _advocate(text: str) -> Optional[str]:
    for pat in [
        rf"(?:filed\s+through|through\s+(?:learned\s+counsel\s+)?|by)\s+({NAME}),?\s+Advocate",
        r"\(([A-Z][A-Z\s]+)\)\s*\n\s*ADVOCATE",
        r"Advocate,?\s+Enrolment\s+No[^,]+,\s+({NAME})",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m: name = _clean(m.group(1)); return name if name else None
    return None


# ─── PREVIOUS LITIGATION ──────────────────────────────────────────────────────

def _prev_lit(text: str) -> Optional[str]:
    if re.search(r"no\s+previous\s+petition", text, re.IGNORECASE): return "None"
    m = re.search(r"previous\s+(?:petition|case|suit)[^.]{0,200}\.", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


# ─── CRUELTY INCIDENTS ────────────────────────────────────────────────────────

def _cruelty(text: str) -> List[str]:
    found = []
    for pat in [
        r"(?:on|around)\s+[\d\.\-/]{6,12}[^.]{0,200}(?:abused?|assaulted?|harassed?|threatened?|slapped?)[^.]{0,100}\.",
        r"incident[s]?\s+(?:of|involving)[^.]{0,200}\.",
    ]:
        found.extend(re.findall(pat, text, re.IGNORECASE))
    return [f.strip() for f in found if len(f.strip()) > 20][:5]


# ─── MAIN ─────────────────────────────────────────────────────────────────────

def extract_facts(text: str) -> Dict[str, Any]:
    names_d   = _names(text)
    pet       = names_d.get("petitioner")
    res       = names_d.get("respondent")
    ages_d    = _ages(text, pet, res)
    addrs_d   = _addresses(text, pet, res)
    marr_d    = _marriage(text)
    occ_d     = _occupation(text)
    kids      = _children(text)
    jur_d     = _jurisdiction(text)
    gr_d      = _ground_relief(text)
    adv       = _advocate(text)
    prev      = _prev_lit(text)
    incidents = _cruelty(text)

    summary = f"{pet or '?'} vs {res or '?'} — {gr_d.get('ground','?')}"
    if marr_d.get("marriage_date"):
        summary += f" — married {marr_d['marriage_date']}"

    return {
        "raw_input":             text,
        "case_summary":          summary,
        "case_type":             gr_d.get("case_type"),
        "case_type_hint":        gr_d.get("case_type"),

        # Parties
        "petitioner_name":       pet,
        "plaintiff_name":        pet,
        "respondent_name":       res,
        "defendant_name":        res,
        "petitioner_age":        ages_d.get("petitioner_age"),
        "respondent_age":        ages_d.get("respondent_age"),
        "petitioner_address":    addrs_d.get("petitioner_address"),
        "respondent_address":    addrs_d.get("respondent_address"),
        "petitioner_occupation": occ_d.get("petitioner_occupation"),
        "respondent_occupation": occ_d.get("respondent_occupation"),
        "matrimonial_home":      addrs_d.get("matrimonial_home"),

        # Marriage
        "marriage_date":         marr_d.get("marriage_date"),
        "marriage_place":        marr_d.get("marriage_place"),
        "marriage_type":         marr_d.get("marriage_type"),
        "separation_date":       marr_d.get("separation_date"),
        "children":              kids,

        # Case
        "ground":                gr_d.get("ground"),
        "relief":                gr_d.get("relief"),
        "cause_of_action":       gr_d.get("ground"),
        "cruelty_incidents":     incidents,

        # Court
        "court":                 jur_d.get("court"),
        "jurisdiction_city":     jur_d.get("city"),
        "location":              jur_d.get("city"),

        # Other
        "previous_litigation":   prev,
        "advocate_name":         adv,
        "amount":                None,
        "dates":                 re.findall(r"\b\d{1,2}[\.\-/]\d{1,2}[\.\-/]\d{4}\b", text),
        "evidence_mentioned":    [],
        "additional_facts":      [],
    }


if __name__ == "__main__":
    import json
    TEST = """I have been instructed by the Petitioner, Mr. Rohan Malhotra, aged about 38 years,
presently residing at B-124, Greater Kailash-I, New Delhi – 110048, to initiate
matrimonial proceedings. The Petitioner's marriage with the Respondent, Mrs. Priya Malhotra
(née Khanna), was solemnized on 18.02.2016 at Rajouri Garden, New Delhi, according to
Hindu rites and ceremonies. One male child, namely Master Aarav Malhotra, aged about 7 years,
was born on 12.09.2018. The parties have been residing separately since 15.03.2025.
The Petitioner is employed as a Senior Sales Manager with M/s Zenith Automobiles Pvt. Ltd.
The Petitioner seeks divorce on the ground of cruelty under Section 13(1)(ia) HMA."""
    r = extract_facts(TEST)
    for k, v in r.items():
        if v and v != [] and v != "":
            print(f"  {k}: {v}")
