"""
routers/drafter.py  — LegalOne Master Drafter Router
─────────────────────────────────────────────────────
3-step AI drafting flow:
  POST /api/drafter/step1-extract   → extract facts + detect missing fields
  POST /api/drafter/step2-validate  → validate after user fills gaps
  POST /api/drafter/step3-generate  → generate final court-format petition
  GET  /api/drafter/required-fields/{draft_type}  → field schema for frontend popup
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import re
import requests

router = APIRouter()

# ─── Ollama config ────────────────────────────────────────────────────────────
OLLAMA_URL   = "http://localhost:11434"
OLLAMA_MODEL = "llama3"

# ─── Field schemas ────────────────────────────────────────────────────────────
REQUIRED_FIELDS: Dict[str, Dict[str, Any]] = {
    "divorce_petition": {
        "petitioner_name":       {"label": "Petitioner Name",           "required": True,  "ask": "Full name of the petitioner (wife/husband filing)"},
        "petitioner_age":        {"label": "Petitioner Age",            "required": True,  "ask": "Age of petitioner (in years)"},
        "petitioner_address":    {"label": "Petitioner Address",        "required": True,  "ask": "Current residential address of petitioner"},
        "petitioner_occupation": {"label": "Petitioner Occupation",     "required": False, "ask": "Occupation / profession of petitioner"},
        "respondent_name":       {"label": "Respondent Name",           "required": True,  "ask": "Full name of the respondent (other spouse)"},
        "respondent_age":        {"label": "Respondent Age",            "required": True,  "ask": "Age of respondent (in years)"},
        "respondent_address":    {"label": "Respondent Address",        "required": True,  "ask": "Current residential address of respondent"},
        "marriage_date":         {"label": "Date of Marriage",          "required": True,  "ask": "Date of marriage (DD/MM/YYYY or written out)"},
        "marriage_place":        {"label": "Place of Marriage",         "required": True,  "ask": "City / place where marriage was solemnized"},
        "marriage_type":         {"label": "Marriage Type",             "required": True,  "ask": "Type: Hindu / Muslim / Christian / Special Marriage Act"},
        "marriage_registered":   {"label": "Marriage Registration",     "required": False, "ask": "Was marriage registered? If yes, where?"},
        "cohabitation_address":  {"label": "Last Cohabitation Address", "required": True,  "ask": "Address where parties last lived together as husband & wife"},
        "separation_date":       {"label": "Date of Separation",        "required": True,  "ask": "When did parties separate? (date or approximate year/month)"},
        "children":              {"label": "Children Details",          "required": False, "ask": "Any children? If yes, name, age and sex of each child"},
        "ground":                {"label": "Ground for Divorce",        "required": True,  "ask": "Ground: cruelty / desertion / adultery / mutual consent / others"},
        "cruelty_incidents":     {"label": "Cruelty Incidents",         "required": True,  "ask": "Specific cruelty incidents with dates, nature of acts and effect on petitioner"},
        "jurisdiction_court":    {"label": "Court & City",              "required": True,  "ask": "Which Family Court and city/district to file this petition in"},
        "relief_sought":         {"label": "Relief Sought",             "required": True,  "ask": "Reliefs sought: divorce / + maintenance / + custody / + alimony"},
        "maintenance_amount":    {"label": "Maintenance Amount",        "required": False, "ask": "If maintenance is claimed, how much per month?"},
        "previous_litigation":   {"label": "Previous Court Cases",      "required": False, "ask": "Any previous court cases between the parties? If yes, details"},
        "advocate_name":         {"label": "Advocate Name",             "required": False, "ask": "Name of the advocate filing the petition"},
        "filing_date":           {"label": "Filing Date",               "required": False, "ask": "Date of filing (if known)"},
    },
    "legal_notice": {
        "sender_name":      {"label": "Sender Name",     "required": True,  "ask": "Full name of the person sending the notice"},
        "receiver_name":    {"label": "Receiver Name",   "required": True,  "ask": "Full name of the person receiving the notice"},
        "receiver_address": {"label": "Receiver Address","required": True,  "ask": "Full postal address of the receiver"},
        "subject":          {"label": "Subject / Demand","required": True,  "ask": "What is the notice about? What is being demanded?"},
        "amount":           {"label": "Amount (if any)", "required": False, "ask": "Amount of money involved, if any (with currency)"},
        "deadline_days":    {"label": "Reply Deadline",  "required": True,  "ask": "Days given to respond (usually 15 or 30 days)"},
        "facts":            {"label": "Facts",           "required": True,  "ask": "Detailed facts — what happened, when, and why this notice is sent"},
    },
    "counter_reply": {
        "petitioner_name": {"label": "Original Petitioner",  "required": True, "ask": "Name of original petitioner / plaintiff"},
        "respondent_name": {"label": "Respondent / Counter Party", "required": True, "ask": "Name of respondent filing this counter reply"},
        "case_number":     {"label": "Case Number",          "required": True, "ask": "Original case number and court name"},
        "reply_points":    {"label": "Reply Points",         "required": True, "ask": "Point-wise reply to each allegation in the petition"},
        "defence":         {"label": "Affirmative Defence",  "required": True, "ask": "Respondent's defence and any counter-claims"},
    },
}


# ─── Pydantic models ──────────────────────────────────────────────────────────

class Step1Request(BaseModel):
    draft_type:  str
    user_input:  str
    rag_context: Optional[str] = ""

class Step2Request(BaseModel):
    draft_type:       str
    original_input:   str
    user_responses:   Dict[str, Any]
    extracted_so_far: Dict[str, Any]

class Step3Request(BaseModel):
    draft_type:  str
    final_data:  Dict[str, Any]
    rag_context: Optional[str] = ""


# ─── Ollama caller ────────────────────────────────────────────────────────────

def _call_ollama(system: str, user: str, timeout: int = 180) -> Optional[str]:
    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user},
                ],
                "stream": False,
                "options": {"temperature": 0.05, "num_predict": 4000},
            },
            timeout=timeout,
        )
        if resp.status_code == 200:
            return resp.json().get("message", {}).get("content", "")
    except Exception as e:
        print(f"[Drafter] Ollama error: {e}")
    return None


def _parse_json(raw: str) -> dict:
    """Strip markdown fences and parse first JSON object found."""
    raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
    start = raw.find("{")
    end   = raw.rfind("}")
    if start != -1 and end != -1:
        try:
            return json.loads(raw[start : end + 1])
        except Exception:
            pass
    return {}


def _get_rag_context(query: str, top_k: int = 4) -> str:
    try:
        from core.rag_pipeline import get_context_for_prompt
        return get_context_for_prompt(query, top_k=top_k)
    except Exception:
        return ""


# ─── STEP 1 — Extraction + Missing Field Detection ───────────────────────────

def _ollama_extract(draft_type: str, user_input: str, rag_context: str) -> dict:
    schema = REQUIRED_FIELDS.get(draft_type, REQUIRED_FIELDS["divorce_petition"])
    required_list = "\n".join(
        f"  - {k}: {v['ask']} [{'REQUIRED' if v['required'] else 'optional'}]"
        for k, v in schema.items()
    )

    system = """You are a senior Indian legal assistant. Extract structured information from case descriptions and identify what is missing.

OUTPUT: Respond ONLY with valid JSON. No markdown. No explanation.

{
  "extracted": { "field_name": "value", ... },
  "missing_required": [
    { "field": "field_name", "label": "Label", "question": "Question to ask", "why_needed": "Legal reason" }
  ],
  "missing_optional": [
    { "field": "field_name", "label": "Label", "question": "Question to ask" }
  ],
  "is_complete": false,
  "completeness_score": 45,
  "ready_to_draft": false
}"""

    user = f"""DRAFT TYPE: {draft_type.replace("_", " ").upper()}

USER INPUT:
{user_input}

REQUIRED FIELDS:
{required_list}

{f"LEGAL CONTEXT:{chr(10)}{rag_context}" if rag_context else ""}

Extract all information from the input. Identify missing REQUIRED fields.
For cruelty_incidents: if vaguely described (e.g. "was cruel"), mark as missing and ask for specific dates.
Return ONLY the JSON."""

    raw    = _call_ollama(system, user, timeout=120)
    result = _parse_json(raw) if raw else {}
    return result


def _fallback_extract(draft_type: str, user_input: str) -> dict:
    """
    Rule-based extraction when Ollama is unavailable.
    Comprehensive regex engine for Indian legal case descriptions.
    """
    schema   = REQUIRED_FIELDS.get(draft_type, REQUIRED_FIELDS["divorce_petition"])
    text     = user_input
    text_low = user_input.lower()
    extracted: Dict[str, str] = {}

    MONTHS = (r"(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?"
              r"|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)")

    # ── Petitioner name ──────────────────────────────────────────────────────
    m = re.search(
        r"(?:my name is|i am)\s+(?:(?:Mrs?|Ms|Dr|Adv|Shri|Smt)\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
        text, re.I
    )
    if m:
        extracted["petitioner_name"] = m.group(1).strip()

    # ── Respondent name ──────────────────────────────────────────────────────
    m = re.search(
        r"(?:husband|wife|respondent|spouse)\s*(?:\(respondent\))?\s+is\s+(?:(?:Mrs?|Ms|Dr|Shri|Smt)\.?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
        text, re.I
    )
    if m:
        extracted["respondent_name"] = m.group(1).strip()

    # ── Ages (must follow "aged X years") ────────────────────────────────────
    all_ages = re.findall(r"\baged?\s+(\d{2,3})\s+years?\b", text, re.I)
    if all_ages:
        extracted["petitioner_age"] = all_ages[0]
    if len(all_ages) > 1:
        extracted["respondent_age"] = all_ages[1]

    # ── Marriage date ────────────────────────────────────────────────────────
    m = re.search(
        rf"(?:married|solemnized|wedding|wed)\s+on\s+(\d{{1,2}}(?:st|nd|rd|th)?(?:\s+of)?\s+{MONTHS}\s+\d{{4}}|\d{{1,2}}/\d{{1,2}}/\d{{2,4}})",
        text, re.I
    )
    if not m:
        m = re.search(rf"\b(\d{{1,2}}(?:st|nd|rd|th)?\s+{MONTHS}\s+\d{{4}})\b", text, re.I)
    if not m:
        m = re.search(rf"\b({MONTHS}\s+\d{{4}})\b", text, re.I)
    if m:
        extracted["marriage_date"] = m.group(1).strip()

    # ── Marriage place ───────────────────────────────────────────────────────
    m = re.search(
        r"(?:married|solemnized|wedding|wed)\s+(?:on[^,]+,?\s+)?at\s+([^,\n]+(?:,\s*[^,\n]+)?)",
        text, re.I
    )
    if m:
        place = m.group(1).strip().rstrip(".,")
        place = re.split(r"\s+(?:according|as\s+per|under|by)\b", place, flags=re.I)[0].strip()
        extracted["marriage_place"] = place[:120]
    else:
        for city in ["New Delhi", "Delhi", "Mumbai", "Chennai", "Bangalore",
                     "Hyderabad", "Kolkata", "Pune", "Ahmedabad", "Jaipur",
                     "Lucknow", "Nagpur", "Indore", "Bhopal", "Surat"]:
            if city.lower() in text_low:
                extracted.setdefault("marriage_place", city)
                break

    # ── Marriage type ────────────────────────────────────────────────────────
    if "arya samaj" in text_low:
        extracted["marriage_type"] = "Hindu (Arya Samaj)"
    elif "hindu" in text_low:
        extracted["marriage_type"] = "Hindu"
    elif re.search(r"\bmuslim\b|\bislam\b|\bnikah\b", text_low):
        extracted["marriage_type"] = "Muslim"
    elif re.search(r"\bchristian\b|\bchurch\b", text_low):
        extracted["marriage_type"] = "Christian"
    elif "special marriage" in text_low:
        extracted["marriage_type"] = "Special Marriage Act"

    # ── Marriage registration ────────────────────────────────────────────────
    m = re.search(r"marriage\s+was\s+registered\s+at\s+([^\.]+)", text, re.I)
    if m:
        extracted["marriage_registered"] = m.group(1).strip()[:120]
    elif re.search(r"\bregistered\b", text_low):
        extracted["marriage_registered"] = "Yes"

    # ── Petitioner address ───────────────────────────────────────────────────
    m = re.search(
        r"(?:I|petitioner)[^\.]{0,80}?,\s+aged?\s+\d+\s+years?,\s+residing\s+at\s+([^\.]{15,200})",
        text, re.I
    )
    if not m:
        m = re.search(
            r"(?:Flat\s+No|H\.No|Plot\s+No|Door\s+No)\.\s*[\d\w/-]+[^\.]{10,180}",
            text, re.I
        )
        if m:
            extracted["petitioner_address"] = m.group(0).strip().rstrip(",")[:180]
    if m and "petitioner_address" not in extracted:
        extracted["petitioner_address"] = m.group(1).strip().rstrip(",.")[:180]

    # ── Respondent address ───────────────────────────────────────────────────
    m = re.search(
        r"(?:respondent|husband|wife|he|she)\b[^\.]*?currently\s+residing\s+at\s+([^\.]{15,180})",
        text, re.I
    )
    if m:
        extracted["respondent_address"] = m.group(1).strip().rstrip(",.")[:180]

    # ── Cohabitation address ─────────────────────────────────────────────────
    m = re.search(
        r"(?:lived together|resided together|matrimonial home|after\s+marriage\s+we\s+(?:lived|resided))\s+at\s+([^\.]{10,180})",
        text, re.I
    )
    if m:
        extracted["cohabitation_address"] = m.group(1).strip().rstrip(",.")[:180]

    # ── Separation date ──────────────────────────────────────────────────────
    m = re.search(
        rf"(?:separated|living\s+separately|left|thrown\s+out)\s+(?:in|since|from|on)\s+({MONTHS}\s+\d{{4}}|\w+\s+\d{{4}}|\d{{4}})",
        text, re.I
    )
    if m:
        extracted["separation_date"] = m.group(1).strip()

    # ── Ground ───────────────────────────────────────────────────────────────
    if "mutual consent" in text_low:
        extracted["ground"] = "mutual consent"
    elif "cruelty" in text_low:
        extracted["ground"] = "cruelty"
    elif "desertion" in text_low:
        extracted["ground"] = "desertion"
    elif "adultery" in text_low:
        extracted["ground"] = "adultery"

    # ── Cruelty incidents ────────────────────────────────────────────────────
    m = re.search(
        r"(?:following cruelty incidents?|cruelty incidents?|following incidents?)[:\s]+(.*?)(?:\n\n[A-Z]|\Z)",
        text, re.I | re.S
    )
    if m:
        extracted["cruelty_incidents"] = m.group(1).strip()[:2000]
    else:
        bullets = re.findall(r"\d+\.\s+(?:On\s+\d|That\s+the\s+respondent)[^\n]{20,}", text)
        if bullets:
            extracted["cruelty_incidents"] = "\n".join(bullets[:8])

    # ── Court / Jurisdiction ─────────────────────────────────────────────────
    m = re.search(r"(?:at|before)\s+the\s+(Family\s+Court[^,\.\n]+|District\s+Court[^,\.\n]+)", text, re.I)
    if m:
        extracted["jurisdiction_court"] = m.group(1).strip()
    else:
        m = re.search(r"(Family\s+Court)[,\s]+([A-Z][a-zA-Z\s,]+?)(?:\.|$|\n)", text, re.I)
        if m:
            extracted["jurisdiction_court"] = m.group(0).strip(".").strip()[:80]

    # ── Relief sought ─────────────────────────────────────────────────────────
    if "maintenance" in text_low and "divorce" in text_low:
        extracted["relief_sought"] = "Divorce decree and monthly maintenance"
    elif "custody" in text_low and "divorce" in text_low:
        extracted["relief_sought"] = "Divorce decree and custody of children"
    elif "divorce" in text_low:
        extracted["relief_sought"] = "Divorce decree"

    # ── Maintenance amount ───────────────────────────────────────────────────
    m = re.search(r"maintenance\s+of\s+Rs\.?\s*([\d,]+)\s*(?:per\s+month|p\.m\.?)?", text, re.I)
    if m:
        extracted["maintenance_amount"] = m.group(1).replace(",", "")

    # ── Children ─────────────────────────────────────────────────────────────
    if re.search(r"\bno\s+child(?:ren)?\b|\bno\s+issue\b", text_low):
        extracted["children"] = "None"
    else:
        m = re.search(r"\b(?:son|daughter|child(?:ren)?)\b[^\n\.]{5,200}", text, re.I)
        if m and any(w in m.group(0).lower() for w in ["son", "daughter", "born", "aged"]):
            extracted["children"] = m.group(0).strip()[:300]

    # ── Advocate ────────────────────────────────────────────────────────────
    m = re.search(r"\bAdv\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)", text)
    if not m:
        m = re.search(r"(?:advocate|counsel)\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)", text, re.I)
    if m:
        extracted["advocate_name"] = m.group(1).strip()

    # ── Occupation ───────────────────────────────────────────────────────────
    m = re.search(r"I\s+am\s+a(?:n)?\s+([a-z][a-z\s]+?)\s+by\s+profession\b", text, re.I)
    if m:
        extracted["petitioner_occupation"] = m.group(1).strip()

    # ── Clean up ─────────────────────────────────────────────────────────────
    extracted = {k: v for k, v in extracted.items() if v and str(v).strip()}

    # ── Build missing lists ──────────────────────────────────────────────────
    missing_required: List[dict] = []
    missing_optional: List[dict] = []
    for k, v in schema.items():
        if k in extracted:
            continue
        entry = {"field": k, "label": v["label"], "question": v["ask"]}
        if v["required"]:
            entry["why_needed"] = "Required to draft the petition correctly"
            missing_required.append(entry)
        else:
            missing_optional.append(entry)

    filled   = len(extracted)
    total    = len(schema)
    score    = min(100, int(filled / total * 100)) if total else 0
    complete = len(missing_required) == 0

    return {
        "extracted":          extracted,
        "missing_required":   missing_required,
        "missing_optional":   missing_optional,
        "is_complete":        complete,
        "completeness_score": score,
        "ready_to_draft":     complete,
    }


# ─── STEP 2 — Validator ───────────────────────────────────────────────────────

def _ollama_validate(draft_type: str, original_input: str,
                     user_responses: dict, extracted: dict) -> dict:
    system = """You are a senior Indian legal assistant validating case information before drafting.

Check all provided information and decide:
1. Is every REQUIRED field now filled with SPECIFIC information?
2. Are cruelty incidents described with enough detail for court?
3. Is jurisdiction established? Are parties fully identified?

Respond ONLY with valid JSON:
{
  "still_missing": [
    { "field": "field_name", "label": "Label", "question": "What is still needed?", "severity": "critical" }
  ],
  "all_complete": true,
  "completeness_score": 95,
  "issues_found": [],
  "ready_to_draft": true,
  "final_data": { "petitioner_name": "...", ... all merged fields ... }
}"""

    merged = {**extracted, **user_responses}
    merged_text = "\n".join(f"  {k}: {v}" for k, v in merged.items())
    orig_text   = "\n".join(f"  {k}: {v}" for k, v in extracted.items())
    resp_text   = "\n".join(f"  {k}: {v}" for k, v in user_responses.items())

    user_msg = f"""DRAFT TYPE: {draft_type}

ORIGINAL INPUT:
{original_input}

PREVIOUSLY EXTRACTED:
{orig_text}

USER'S ADDITIONAL RESPONSES:
{resp_text}

ALL DATA MERGED:
{merged_text}

Validate completeness and return JSON with final_data containing ALL fields merged."""

    raw    = _call_ollama(system, user_msg, timeout=120)
    result = _parse_json(raw) if raw else {}
    return result


def _fallback_validate(draft_type: str, user_responses: dict, extracted: dict) -> dict:
    """Rule-based validator when Ollama is unavailable."""
    schema = REQUIRED_FIELDS.get(draft_type, REQUIRED_FIELDS["divorce_petition"])
    merged = {**extracted, **{k: v for k, v in user_responses.items() if v and str(v).strip()}}

    still_missing = []
    for k, v in schema.items():
        if v["required"] and not merged.get(k, "").strip():
            still_missing.append({
                "field": k, "label": v["label"],
                "question": v["ask"], "severity": "critical",
            })

    filled   = sum(1 for k in schema if merged.get(k, "").strip())
    total    = len(schema)
    score    = int(filled / total * 100) if total else 0
    complete = len(still_missing) == 0

    return {
        "still_missing":     still_missing,
        "all_complete":      complete,
        "completeness_score":score,
        "issues_found":      [],
        "ready_to_draft":    complete,
        "final_data":        merged,
    }


# ─── STEP 3 — Draft Generator ─────────────────────────────────────────────────

DIVORCE_FORMAT_HINT = """
IN THE COURT OF THE FAMILY JUDGE AT {jurisdiction_court}

MATRIMONIAL CASE NO. __________ OF {year}

IN THE MATTER OF:

{petitioner_name}, aged {petitioner_age} years
{petitioner_address}                                   ... PETITIONER

VERSUS

{respondent_name}, aged {respondent_age} years
{respondent_address}                                   ... RESPONDENT

PETITION FOR DECREE OF DIVORCE UNDER SECTION 13(1)(ia)
OF THE HINDU MARRIAGE ACT, 1955

MOST RESPECTFULLY SHOWETH:

1. That the marriage of the Petitioner and the Respondent was
   solemnized on {marriage_date} at {marriage_place} according
   to Hindu rites and ceremonies.

2. ... [facts in numbered paragraphs] ...

PRAYER:
The Petitioner prays that this Hon'ble Court may be pleased to:
(a) ...
(b) ...

VERIFICATION: ...

Place:
Date:                                      PETITIONER
"""


def _ollama_generate(draft_type: str, final_data: dict, rag_context: str) -> str:
    data_block = "\n".join(f"  {k}: {v}" for k, v in final_data.items() if v)
    year = __import__("datetime").datetime.now().year

    system = f"""You are a senior Indian legal drafter with 25+ years of Family Court experience.
Draft petitions in EXACT Indian court format — formal, precise, legally compliant.

RULES:
1. Use ONLY the facts provided — never invent dates, names, or incidents
2. Use formal legal language. Number every paragraph.
3. Cruelty incidents: plead specifically — date, nature, effect on petitioner
4. Jurisdiction paragraph: cite correct ground (marriage place / last cohabitation)
5. Prayer clause: list each relief as (a), (b), (c)...
6. Include Verification paragraph at the end
7. Output ONLY the petition text — no preamble, no commentary

FORMAT TEMPLATE:
{DIVORCE_FORMAT_HINT}"""

    user = f"""DRAFT TYPE: {draft_type.upper()}

COMPLETE CASE DATA:
{data_block}

{f"RELEVANT LEGAL CONTEXT (RAG):{chr(10)}{rag_context}" if rag_context else ""}

FILING YEAR: {year}
GROUND: {final_data.get("ground", "cruelty")}

Generate the complete petition now. Start directly with "IN THE COURT OF..."."""

    return _call_ollama(system, user, timeout=180) or ""


def _template_generate(draft_type: str, final_data: dict) -> str:
    """
    Template-based fallback draft when Ollama is offline.
    Produces a complete, properly structured petition.
    """
    import datetime
    year = datetime.datetime.now().year

    d = final_data
    pname  = d.get("petitioner_name",    "The Petitioner")
    page   = d.get("petitioner_age",     "___")
    paddr  = d.get("petitioner_address", "______________________________________")
    rname  = d.get("respondent_name",    "The Respondent")
    rage   = d.get("respondent_age",     "___")
    raddr  = d.get("respondent_address", "______________________________________")
    mdate  = d.get("marriage_date",      "__________")
    mplace = d.get("marriage_place",     "__________")
    mtype  = d.get("marriage_type",      "Hindu")
    cohab  = d.get("cohabitation_address", raddr)
    sep    = d.get("separation_date",    "__________")
    ground = d.get("ground",             "cruelty").lower()
    court  = d.get("jurisdiction_court", "____________")
    relief = d.get("relief_sought",      "Divorce decree")
    cruelty = d.get("cruelty_incidents", "")
    children = d.get("children", "")
    advocate = d.get("advocate_name",   "Advocate")
    prev_lit = d.get("previous_litigation", "")
    maintenance = d.get("maintenance_amount", "")

    # Build children paragraph
    if children and children.strip().lower() not in ("none", "no", "nil", ""):
        children_para = f"That out of the wedlock, the following child/children were born: {children}."
    else:
        children_para = "That no child was born out of the said wedlock."

    # Build cruelty paragraphs
    cruelty_paras = ""
    if cruelty:
        incidents = [x.strip() for x in cruelty.replace("\n", ". ").split(". ") if x.strip()]
        for i, inc in enumerate(incidents[:6], 5):
            cruelty_paras += f"\n{i}.  That {inc}.\n"
    else:
        cruelty_paras = f"\n5.  That the Respondent treated the Petitioner with cruelty during the subsistence of the marriage.\n"

    next_para = 5 + max(1, len([x for x in cruelty.split(". ") if x.strip()]) if cruelty else 1)

    # Build prayer
    prayer_lines = ["(a) Pass a decree of divorce dissolving the marriage between the Petitioner and the Respondent;"]
    if maintenance and maintenance.strip():
        prayer_lines.append(f"(b) Direct the Respondent to pay maintenance of Rs. {maintenance} per month to the Petitioner;")
    if "custody" in relief.lower():
        prayer_lines.append(f"({'bc'[len(prayer_lines)-1]}) Grant custody of the child/children to the Petitioner;")
    prayer_lines.append(f"({'abcde'[len(prayer_lines)]}) Award costs of this petition to the Petitioner;")
    prayer_lines.append(f"({'abcde'[len(prayer_lines)]}) Grant any other relief as this Hon'ble Court may deem fit and proper.")
    prayer_text = "\n".join(prayer_lines)

    # Previous litigation
    prev_para = ""
    if prev_lit and prev_lit.strip().lower() not in ("none", "no", "nil", ""):
        prev_para = f"\n{next_para}.  That the following earlier proceedings have been initiated between the parties: {prev_lit}.\n"
        next_para += 1

    jx_ground = f"the marriage was solemnized at {mplace}" if mplace != "__________" else "the parties last resided together"

    draft = f"""IN THE COURT OF THE FAMILY JUDGE AT {court.upper()}

MATRIMONIAL CASE NO. __________ OF {year}


IN THE MATTER OF:

{pname},
Aged {page} years,
{paddr}                                             ... PETITIONER

                           VERSUS

{rname},
Aged {rage} years,
{raddr}                                             ... RESPONDENT


PETITION FOR DECREE OF DIVORCE UNDER SECTION 13(1)(ia)
OF THE HINDU MARRIAGE ACT, 1955


MOST RESPECTFULLY SHOWETH:

The Petitioner above named states as under:

1.  That the marriage of the Petitioner and the Respondent was
    solemnized on {mdate} at {mplace} according to {mtype} rites and
    ceremonies. {f"The marriage was duly registered." if d.get("marriage_registered") else ""}

2.  That the status and place of residence of the parties at the
    time of filing this petition is as under:

    (i)  Petitioner: {paddr}
    (ii) Respondent: {raddr}

3.  {children_para}

4.  That after the solemnization of the marriage, the parties
    resided together at {cohab}. The Respondent, however, started
    treating the Petitioner with cruelty soon after the marriage.
{cruelty_paras}
{next_para}.  That the Petitioner has not condoned any of the acts of
    cruelty by the Respondent. It has become impossible for the
    Petitioner to live with the Respondent. The parties have been
    living separately since {sep}.

{next_para + 1}.  That there is no collusion between the Petitioner and the
    Respondent in filing this petition.

{next_para + 2}.  That the petition is not presented in collusion with the
    Respondent and is filed within the period of limitation.
{prev_para}
{next_para + 3}.  That this Hon'ble Court has jurisdiction to entertain this
    petition as {jx_ground} and falls within the jurisdiction of
    this Court.

{next_para + 4}.  That the cause of action for this petition arose at {court}
    and is within the jurisdiction of this Hon'ble Court.


                            P R A Y E R

The Petitioner, therefore, most humbly prays that this Hon'ble
Court may be pleased to:

{prayer_text}


                                        Respectfully submitted,

                                        {pname}
                                        PETITIONER

THROUGH

{advocate}
Advocate

Place : {mplace}
Date  : __________


─────────────────────────────────────────────────────────────────
                         VERIFICATION
─────────────────────────────────────────────────────────────────

I, {pname}, aged {page} years, residing at {paddr}, do hereby
verify and declare that the contents of paragraphs 1 to {next_para + 2} of
this petition are true and correct to the best of my knowledge and
belief and that paragraphs {next_para + 3} to {next_para + 4} are based on
legal advice received and believed to be true.

Verified at {court} on this _______ day of _______ {year}.

                                        {pname}
                                        PETITIONER

[NOTE: This draft was generated using the rule-based template engine
as the Ollama AI model is currently offline. For a more precise
AI-generated draft, ensure Ollama is running with: ollama run llama3]
"""
    return draft


# ─── API Routes ───────────────────────────────────────────────────────────────

@router.post("/drafter/step1-extract")
def step1_extract(req: Step1Request):
    """
    Step 1: Extract facts from user input and detect missing fields.
    Called when user clicks "Generate Draft".
    """
    if not req.user_input.strip():
        raise HTTPException(400, "Please describe your case first")

    # Try Ollama first
    rag_ctx = req.rag_context or _get_rag_context(req.user_input, top_k=4)
    result  = _ollama_extract(req.draft_type, req.user_input, rag_ctx)

    if not result or "extracted" not in result:
        # Fallback: rule-based extraction
        result = _fallback_extract(req.draft_type, req.user_input)
        result["source"] = "rule_based"
    else:
        result["source"] = "ollama"

    return {
        "success":            True,
        "extracted":          result.get("extracted", {}),
        "missing_required":   result.get("missing_required", []),
        "missing_optional":   result.get("missing_optional", []),
        "completeness_score": result.get("completeness_score", 0),
        "ready_to_draft":     result.get("ready_to_draft", False),
        "show_popup":         len(result.get("missing_required", [])) > 0,
        "source":             result.get("source", "unknown"),
    }


@router.post("/drafter/step2-validate")
def step2_validate(req: Step2Request):
    """
    Step 2: Validate after user fills the missing fields popup.
    Returns either more missing fields OR ready_to_draft=true + final_data.
    """
    # Try Ollama
    result = _ollama_validate(
        req.draft_type, req.original_input,
        req.user_responses, req.extracted_so_far,
    )

    if not result or "all_complete" not in result:
        # Fallback: rule-based validation
        result = _fallback_validate(
            req.draft_type, req.user_responses, req.extracted_so_far
        )
        result["source"] = "rule_based"
    else:
        result["source"] = "ollama"

    return {
        "success":            True,
        "still_missing":      result.get("still_missing", []),
        "all_complete":       result.get("all_complete", False),
        "completeness_score": result.get("completeness_score", 0),
        "issues_found":       result.get("issues_found", []),
        "ready_to_draft":     result.get("ready_to_draft", False),
        "final_data":         result.get("final_data", {}),
        "show_popup":         len(result.get("still_missing", [])) > 0,
        "source":             result.get("source", "unknown"),
    }


@router.post("/drafter/step3-generate")
def step3_generate(req: Step3Request):
    """
    Step 3: Generate the complete petition draft.
    Only called when ready_to_draft = True.
    """
    if not req.final_data:
        raise HTTPException(400, "No case data provided")

    # Try Ollama
    rag_ctx = req.rag_context or _get_rag_context(
        f"{req.draft_type} {req.final_data.get('ground','')} divorce cruelty Hindu Marriage Act",
        top_k=5,
    )
    draft  = _ollama_generate(req.draft_type, req.final_data, rag_ctx)
    source = "ollama_llm"

    # Fallback: template
    if not draft or len(draft.strip()) < 300:
        draft  = _template_generate(req.draft_type, req.final_data)
        source = "rule_based_template"

    return {
        "success":    True,
        "draft":      draft,
        "draft_type": req.draft_type,
        "case_data":  req.final_data,
        "word_count": len(draft.split()),
        "source":     source,
    }


@router.get("/drafter/required-fields/{draft_type}")
def get_required_fields(draft_type: str):
    """Returns field schema for a draft type — used to build the popup UI."""
    fields = REQUIRED_FIELDS.get(draft_type)
    if not fields:
        raise HTTPException(404, f"Unknown draft type: {draft_type}")
    return {
        "draft_type": draft_type,
        "fields": [
            {
                "key":      k,
                "label":    v["label"],
                "required": v["required"],
                "question": v["ask"],
            }
            for k, v in fields.items()
        ],
    }
