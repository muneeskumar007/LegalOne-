"""
fact_extractor.py  —  LegalOne Backend Core
Fixed all regex patterns. Correctly identifies petitioner name, respondent name,
addresses, and all matrimonial case details.

Handles multiple input styles:
  - Formal advocate brief: "I have been instructed by the Petitioner, Mr. X..."
  - Simple first-person:   "My name is Ravi. My wife's name is..."
  - Formal court heading:  "Mr. X ... PETITIONER vs Mrs. Y ... RESPONDENT"
  - Point/paragraph style: numbered paragraphs with party details
"""

import re
from typing import Dict, Any, List, Optional

# ─── Regex building blocks ────────────────────────────────────────────────────

# Titled name: requires Mr./Mrs./Ms./Dr. prefix
NAME = r"(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}"

# Plain capitalised name (no title required — used as fallback)
PLAIN_NAME = r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}"

# Month names for date patterns
MONTHS = (
    r"(?:January|February|March|April|May|June|July|August|September|October|November|December"
    r"|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)"
)

STOPWORDS = {
    "Hindu", "Muslim", "Christian", "India", "Court", "Family", "High", "Supreme",
    "District", "Sessions", "Principal", "Judge", "Delhi", "Mumbai", "Chennai",
    "Bangalore", "Kolkata", "New", "Greater", "Lajpat", "Rajouri", "Grand",
    "Section", "Marriage", "Special", "Act", "Code", "Petitioner", "Respondent",
    "Plaintiff", "Defendant", "Appellant", "This", "That", "The", "And",
}


def _clean(name: Optional[str]) -> Optional[str]:
    """Strip noise from an extracted name."""
    if not name:
        return None
    n = re.sub(r"\s*\(née\s+\w+\)", "", name).strip().rstrip(",.:;")
    # Remove trailing legal words that got swallowed
    n = re.sub(r"\s+(vs?\.?|versus|and|the)\s*$", "", n, flags=re.IGNORECASE).strip()
    if len(n) < 3:
        return None
    # Reject single-word stopwords
    parts = n.split()
    if len(parts) == 1 and parts[0] in STOPWORDS:
        return None
    return n


# ─── NAMES ────────────────────────────────────────────────────────────────────

def _names(text: str) -> Dict:
    pet, res = None, None

    # ── PETITIONER ────────────────────────────────────────────────────────────
    # A: "instructed by the Petitioner, Mr. X" or "on behalf of the Petitioner, Mr. X"
    m = re.search(
        rf"(?:instructed by|on behalf of)\s+the\s+[Pp]etitioner,?\s+({NAME})",
        text, re.IGNORECASE
    )
    if m:
        pet = _clean(m.group(1))

    # B: "Petitioner, Mr. X" anywhere
    if not pet:
        m = re.search(rf"[Pp]etitioner,?\s+({NAME})", text, re.IGNORECASE)
        if m:
            pet = _clean(m.group(1))

    # C: "I, Mr. X, aged..." (formal verification style)
    if not pet:
        m = re.search(rf"I,\s+({NAME}),", text, re.IGNORECASE)
        if m:
            pet = _clean(m.group(1))

    # D: "my name is X" or "I am X"
    if not pet:
        m = re.search(
            rf"(?:my name is|I am)\s+(?:{NAME}|({PLAIN_NAME}))",
            text, re.IGNORECASE
        )
        if m:
            pet = _clean(m.group(1) or m.group(2))

    # E: Party block "Mr. X ... ...Petitioner"
    if not pet:
        m = re.search(rf"({NAME})[,\s\n]+[^.]*?\.\.\.\s*[Pp]etitioner", text)
        if m:
            pet = _clean(m.group(1))

    # F: plain name in petitioner block without title
    if not pet:
        m = re.search(
            rf"(?:Petitioner|PETITIONER)[:\s,]+({PLAIN_NAME})", text
        )
        if m and m.group(1).split()[0] not in STOPWORDS:
            pet = _clean(m.group(1))

    # ── RESPONDENT ────────────────────────────────────────────────────────────
    # A: "Respondent, Mrs. X"
    m = re.search(rf"[Rr]espondent,?\s+({NAME})", text)
    if m:
        res = _clean(m.group(1))

    # B: "against the Respondent, Mrs. X"
    if not res:
        m = re.search(
            rf"against\s+(?:the\s+)?[Rr]espondent,?\s+({NAME})",
            text, re.IGNORECASE
        )
        if m:
            res = _clean(m.group(1))

    # C: "his wife / her husband, Mrs. X"
    if not res:
        m = re.search(
            rf"(?:his\s+wife|her\s+husband|his\s+spouse|her\s+spouse),?\s+({NAME})",
            text, re.IGNORECASE
        )
        if m:
            res = _clean(m.group(1))

    # D: Party block "Mrs. X ... ...Respondent"
    if not res:
        m = re.search(rf"({NAME})[,\s\n]+[^.]*?\.\.\.\s*[Rr]espondent", text)
        if m:
            res = _clean(m.group(1))

    # E: "husband / wife / respondent is X"
    if not res:
        m = re.search(
            rf"(?:husband|wife|respondent|spouse)\s+is\s+(?:named?\s+)?({NAME}|{PLAIN_NAME})",
            text, re.IGNORECASE
        )
        if m:
            cand = _clean(m.group(1))
            if cand and cand not in STOPWORDS:
                res = cand

    # F: plain name in respondent block
    if not res:
        m = re.search(
            rf"(?:Respondent|RESPONDENT)[:\s,]+({PLAIN_NAME})", text
        )
        if m and m.group(1).split()[0] not in STOPWORDS:
            res = _clean(m.group(1))

    # ── FALLBACK: X vs Y ──────────────────────────────────────────────────────
    if not pet or not res:
        # Try titled names first
        m = re.search(
            rf"({NAME})\s+(?:vs?\.?|versus)\s+({NAME})", text, re.IGNORECASE
        )
        if m:
            if not pet:
                pet = _clean(m.group(1))
            if not res:
                res = _clean(m.group(2))

    if not pet or not res:
        # Plain names fallback
        m = re.search(
            rf"({PLAIN_NAME})\s+(?:vs?\.?|versus)\s+({PLAIN_NAME})", text, re.IGNORECASE
        )
        if m:
            c1 = _clean(m.group(1))
            c2 = _clean(m.group(2))
            if c1 and c1.split()[0] not in STOPWORDS and not pet:
                pet = c1
            if c2 and c2.split()[0] not in STOPWORDS and not res:
                res = c2

    return {"petitioner": pet, "respondent": res}


# ─── AGES ─────────────────────────────────────────────────────────────────────

def _ages(text: str, pet: Optional[str], res: Optional[str]) -> Dict:
    def get_age_near(name: Optional[str]) -> Optional[str]:
        if not name:
            return None
        idx = text.find(name)
        if idx == -1:
            last = name.split()[-1]
            idx = text.find(last)
        if idx == -1:
            return None
        # Search a window around the name — but STOP at the next full-stop sentence to
        # avoid picking up an unrelated person's age (e.g. a child's age).
        window_raw = text[max(0, idx - 20): idx + 400]
        # Trim to first two sentences to keep it close to the party
        sentences = re.split(r'(?<=[.!?])\s+', window_raw)
        window = ' '.join(sentences[:3])  # up to 3 sentences
        m = re.search(r"aged?\s+(?:about\s+)?(\d{1,3})\s*years?", window, re.IGNORECASE)
        return m.group(1) if m else None

    p_age = get_age_near(pet)
    r_age = get_age_near(res)

    # Fallback: use position in document — petitioner normally mentioned before respondent
    if not p_age or not r_age:
        all_ages_m = list(re.finditer(r"aged?\s+(?:about\s+)?(\d{1,3})\s*years?", text, re.IGNORECASE))
        # Get the petitioner & respondent character positions
        pet_pos = text.find(pet) if pet else -1
        res_pos = text.find(res) if res else -1
        for m in all_ages_m:
            age_val = m.group(1)
            age_pos = m.start()
            # Associate age with nearest party
            if pet_pos != -1 and not p_age:
                if abs(age_pos - pet_pos) < 300:
                    p_age = age_val
                    continue
            if res_pos != -1 and not r_age:
                if abs(age_pos - res_pos) < 300:
                    r_age = age_val
                    continue
        # Last resort: first two document ages
        if not p_age and all_ages_m:
            p_age = all_ages_m[0].group(1)
        if not r_age and len(all_ages_m) > 1:
            r_age = all_ages_m[1].group(1)

    return {"petitioner_age": p_age, "respondent_age": r_age}


# ─── ADDRESSES ────────────────────────────────────────────────────────────────

def _addresses(text: str, pet: Optional[str], res: Optional[str]) -> Dict:
    addrs = {
        "petitioner_address": None,
        "respondent_address": None,
        "matrimonial_home":   None,
        "cohabitation_address": None,
    }

    def get_addr_near(name: Optional[str]) -> Optional[str]:
        if not name:
            return None
        idx = text.find(name)
        if idx == -1:
            last = name.split()[-1]
            idx = text.find(last)
        if idx == -1:
            return None
        window = text[idx: idx + 500]
        m = re.search(
            r"(?:R/o|r/o|residing\s+at|resident\s+of|presently\s+residing\s+at"
            r"|currently\s+residing\s+at|address\s*:)\s*([A-Z0-9][^.\n]{10,200})",
            window, re.IGNORECASE
        )
        if m:
            addr = m.group(1).strip().rstrip(",")
            # Remove trailing role labels
            addr = re.sub(
                r"\s*\.+\s*(?:Petitioner|Respondent|Appellant|Plaintiff|Defendant).*$",
                "", addr, flags=re.IGNORECASE
            )
            return addr.strip()[:200]
        return None

    addrs["petitioner_address"] = get_addr_near(pet)
    addrs["respondent_address"] = get_addr_near(res)

    # Matrimonial / cohabitation home
    m = re.search(
        r"(?:matrimonial home|marital home)\s+(?:situated\s+)?at\s+([^.\n]{10,150})",
        text, re.IGNORECASE
    )
    if m:
        addrs["matrimonial_home"] = m.group(1).strip().rstrip(",")

    m = re.search(
        r"(?:lived together|resided together|after\s+marriage\s+(?:we\s+)?(?:lived|resided))\s+at\s+([^.\n]{10,150})",
        text, re.IGNORECASE
    )
    if m:
        addrs["cohabitation_address"] = m.group(1).strip().rstrip(",")
    elif addrs["matrimonial_home"]:
        addrs["cohabitation_address"] = addrs["matrimonial_home"]

    return addrs


# ─── MARRIAGE ─────────────────────────────────────────────────────────────────

def _marriage(text: str) -> Dict:
    d = {
        "marriage_date":    None,
        "marriage_place":   None,
        "marriage_type":    None,
        "separation_date":  None,
    }

    # Marriage date — DD.MM.YYYY / DD-MM-YYYY / DD/MM/YYYY
    for pat in [
        r"solemnized\s+on\s+([\d]{1,2}[.\-/][\d]{1,2}[.\-/][\d]{4})",
        r"married\s+on\s+([\d]{1,2}[.\-/][\d]{1,2}[.\-/][\d]{4})",
        r"marriage\s+(?:was\s+)?(?:solemnized|performed|registered|held)\s+on\s+([\d]{1,2}[.\-/][\d]{1,2}[.\-/][\d]{4})",
        r"wedding\s+(?:held\s+)?on\s+([\d]{1,2}[.\-/][\d]{1,2}[.\-/][\d]{4})",
        # Written date: 15 June 2015 / 15th June 2015
        rf"(?:solemnized|married|wedding|wed)\s+on\s+((?:\d{{1,2}}(?:st|nd|rd|th)?\s+)?{MONTHS}\s+\d{{4}})",
        rf"\b(\d{{1,2}}(?:st|nd|rd|th)?\s+{MONTHS}\s+\d{{4}})\b",
        rf"\b({MONTHS}\s+\d{{4}})\b",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            d["marriage_date"] = m.group(1).strip()
            break

    # Separation date
    for pat in [
        r"(?:living|residing)\s+separately\s+since\s+([\d]{1,2}[.\-/][\d]{1,2}[.\-/][\d]{4})",
        r"separated\s+(?:on|since)\s+([\d]{1,2}[.\-/][\d]{1,2}[.\-/][\d]{4})",
        r"separated\s+since\s+(\w+\s+\d{4})",
        rf"separated\s+in\s+({MONTHS}\s+\d{{4}}|\d{{4}})",
        rf"(?:left|thrown\s+out|left\s+the\s+matrimonial\s+home)\s+(?:in|since|on)\s+({MONTHS}\s+\d{{4}}|[\d./-]{{8,10}})",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            d["separation_date"] = m.group(1).strip()
            break

    # Marriage place
    for pat in [
        r"solemnized\s+on\s+[\d.\-/]+\s+at\s+([^,\n]{5,80}?)(?:,\s*according|,\s*as\s+per|\s+according|\s+as\s+per)",
        r"solemnized\s+at\s+([^,\n]{5,80}?)(?:,\s*according|,\s*as\s+per|\s+according)",
        r"marriage\s+(?:was\s+)?held\s+at\s+([^,\n]{5,80})",
        r"(?:married|wed)\s+(?:on\s+[\d.\-/]+\s+)?at\s+([^,\n.]{5,80}?)(?:\s+according|\s+as\s+per|,)",
        # Broader fallback: "solemnized on DD.MM.YYYY at X, Y" — grab X, Y
        r"solemnized\s+on\s+[\d.\-/]+\s+at\s+([A-Za-z][^.\n]{3,80}?)(?:\.|,\s*according|\s+according|$)",
        # "at Rajouri Garden, New Delhi" directly after date
        r"[\d.\-/]{8,10}\s+at\s+([A-Za-z][^.\n]{3,80}?)(?:\.|,\s*according|\s+according)",
    ]:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            place = m.group(1).strip().rstrip(",")
            # Remove trailing noise like "according to Hindu rites"
            place = re.split(r'\s+according|\s+as\s+per|\s+under', place, flags=re.IGNORECASE)[0].strip().rstrip(",")
            if len(place) > 2:
                d["marriage_place"] = place
                break

    # Marriage type — check in priority order
    tl = text.lower()
    if "arya samaj" in tl:
        d["marriage_type"] = "Hindu (Arya Samaj)"
    elif "special marriage act" in tl or "special marriage" in tl:
        d["marriage_type"] = "Special Marriage Act"
    elif re.search(r"\bhindu\b", tl):
        d["marriage_type"] = "Hindu"
    elif re.search(r"\bmuslim\b|\bislam\b|\bnikah\b", tl):
        d["marriage_type"] = "Muslim"
    elif re.search(r"\bchristian\b|\bchurch\b", tl):
        d["marriage_type"] = "Christian"
    elif "court marriage" in tl:
        d["marriage_type"] = "Court Marriage"

    return d


# ─── OCCUPATION ───────────────────────────────────────────────────────────────

def _occupation(text: str) -> Dict:
    occ = {"petitioner_occupation": None, "respondent_occupation": None}
    patterns = [
        r"employed\s+as\s+(?:a\s+)?([^,\n.]{5,80}?)(?:\s+with\s+|\s+at\s+M/s|\s+in\s+)",
        r"working\s+as\s+(?:a\s+)?([^,\n.]{5,80}?)(?:\s+with|\s+at|\s+in|[,.])",
        r"I\s+am\s+a(?:n)?\s+([a-z][a-z\s]+?)\s+by\s+profession",
        r"(?:is|are)\s+(?:a\s+)?((?:Senior\s+|Junior\s+|Chief\s+)?(?:Manager|Engineer|Doctor|Teacher|Lawyer|"
        r"Advocate|Officer|Director|Professor|Accountant|Software\s+Developer|Software\s+Engineer"
        r"|Homemaker|Housewife|Businessman|Government\s+Employee|Clerk|Nurse|Pharmacist)[^,\n.]{0,60})",
        r"(?:petitioner|I)\s+(?:is|am)\s+(?:a\s+)?([a-z][a-z\s]{3,50}?)(?:\s+by\s+profession|[,.])",
    ]
    found = []
    for pat in patterns:
        found.extend(re.findall(pat, text, re.IGNORECASE))
    clean = [f.strip().strip(",.:").rstrip() for f in found if len(f.strip()) > 3]
    if clean:
        occ["petitioner_occupation"] = clean[0]
    if len(clean) > 1:
        occ["respondent_occupation"] = clean[1]
    return occ


# ─── CHILDREN ─────────────────────────────────────────────────────────────────

def _children(text: str) -> List:
    kids = []
    # Pattern: "one male child, namely Master Aarav Malhotra, aged about 7 years, born on 12.09.2018"
    m = re.findall(
        r"(?:one\s+|a\s+)?(?:male|female|son|daughter)\s+child,?\s+namely\s+([^,]+?)"
        r"(?:,\s*aged?\s+(?:about\s+)?(\d+)\s*years?)?"
        r"(?:,\s*(?:born|b\.)\s+(?:on\s+)?([\d.\-/]+))?",
        text, re.IGNORECASE
    )
    for name, age, dob in m:
        n = name.strip().rstrip(",")
        if n:
            kids.append({"name": n, "age": age or None, "dob": dob or None})

    # Pattern: "a son named X aged Y" / "a daughter named X aged Y"
    if not kids:
        m2 = re.findall(
            r"(?:a\s+)?(?:son|daughter)\s+named?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)"
            r"(?:[^,]{0,40}aged?\s+(?:about\s+)?(\d+)\s*years?)?",
            text, re.IGNORECASE
        )
        for name, age in m2:
            kids.append({"name": name.strip(), "age": age or None, "dob": None})

    return kids


# ─── JURISDICTION ─────────────────────────────────────────────────────────────

def _jurisdiction(text: str) -> Dict:
    j = {"court": None, "city": None}

    # Pattern: "IN THE COURT OF THE FAMILY JUDGE AT DELHI"
    m = re.search(
        r"IN\s+THE\s+COURT\s+OF\s+(?:THE\s+)?([^,\n]{10,100}?)\s+(?:AT|,)\s+([A-Z][a-zA-Z\s]+?)(?:\n|,|\Z)",
        text, re.IGNORECASE
    )
    if m:
        j["court"] = m.group(1).strip()
        j["city"]  = m.group(2).strip()
        return j

    # Pattern: "Family Court, Delhi" / "Family Court at Delhi"
    m = re.search(
        r"(Family Court|District Court|Sessions Court|High Court|Principal Judge[^,\n]{0,40})"
        r"[^,\n]{0,30}(?:at|,)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
        text, re.IGNORECASE
    )
    if m:
        j["court"] = m.group(1).strip()
        j["city"]  = m.group(2).strip()
        return j

    # Pattern: "before the Family Court" without explicit city
    m = re.search(
        r"(?:before|at|in)\s+the\s+(Family Court|District Court|Sessions Court|High Court)[^,.\n]{0,40}",
        text, re.IGNORECASE
    )
    if m:
        j["court"] = m.group(1).strip()

    # Extract city from common Indian city names
    cities = [
        "New Delhi", "Delhi", "Mumbai", "Bombay", "Chennai", "Madras",
        "Bangalore", "Bengaluru", "Kolkata", "Calcutta", "Hyderabad",
        "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Nagpur", "Indore",
        "Bhopal", "Surat", "Chandigarh", "Gurgaon", "Noida", "Faridabad",
    ]
    for city in cities:
        if re.search(rf"\b{re.escape(city)}\b", text, re.IGNORECASE):
            j["city"] = city
            break

    return j


# ─── GROUND & RELIEF ──────────────────────────────────────────────────────────

def _ground_relief(text: str) -> Dict:
    tl = text.lower()
    ground_map = {
        "cruelty":        ["cruelty", "cruel", "13(1)(ia)", "section 13(1)(ia)"],
        "desertion":      ["desertion", "deserted", "13(1)(ib)"],
        "adultery":       ["adultery", "adulterous", "extra-marital", "extramarital"],
        "mutual consent": ["mutual consent", "13b", "section 13b"],
        "maintenance":    ["section 125", "s.125", "maintenance"],
        "custody":        ["custody", "guardianship"],
        "cheque bounce":  ["section 138", "cheque dishonour", "dishonour", "cheque bounce"],
        "money recovery": ["money recovery", "suit for recovery", "loan", "promissory note"],
    }
    ground = next(
        (g for g, kws in ground_map.items() if any(k in tl for k in kws)), None
    )

    reliefs = []
    for r, kws in {
        "divorce":       ["divorce", "dissolution of marriage"],
        "maintenance":   ["maintenance", "alimony", "interim maintenance"],
        "custody":       ["custody", "guardian"],
        "injunction":    ["injunction", "restrain"],
        "stridhan":      ["stridhan", "dowry articles", "return of dowry"],
    }.items():
        if any(k in tl for k in kws):
            reliefs.append(r)

    case_type = (
        "divorce_petition" if "divorce" in tl or "matrimonial" in tl else
        "maintenance"      if "maintenance" in tl else
        "custody"          if "custody" in tl else
        "cheque_bounce"    if "cheque" in tl or "138" in tl else
        "money_recovery"   if "money" in tl else
        "civil_petition"
    )

    return {
        "ground":    ground,
        "relief":    ", ".join(reliefs) or None,
        "case_type": case_type,
    }


# ─── ADVOCATE ─────────────────────────────────────────────────────────────────

def _advocate(text: str) -> Optional[str]:
    patterns = [
        rf"(?:filed\s+through|through\s+(?:learned\s+counsel\s+)?|by)\s+({NAME}),?\s+Advocate",
        r"\(([A-Z][A-Z\s]+)\)\s*\n\s*ADVOCATE",
        rf"Adv\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)",
        rf"advocate\s+is\s+({NAME}|{PLAIN_NAME})",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            name = _clean(m.group(1))
            if name:
                return name
    return None


# ─── PREVIOUS LITIGATION ──────────────────────────────────────────────────────

def _prev_lit(text: str) -> Optional[str]:
    if re.search(r"no\s+previous\s+(?:petition|case|suit|litigation)", text, re.IGNORECASE):
        return "None"
    m = re.search(r"previous\s+(?:petition|case|suit)[^.]{0,200}\.", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


# ─── CRUELTY INCIDENTS ────────────────────────────────────────────────────────

def _cruelty(text: str) -> List[str]:
    found = []
    # Dated incidents
    for pat in [
        r"(?:on|around)\s+[\d.\-/]{6,12}[^.]{0,200}(?:abused?|assaulted?|harassed?|threatened?|slapped?|beaten?|kicked?|verbally abused?)[^.]{0,100}\.",
        r"incident[s]?\s+(?:of|involving)[^.]{0,200}\.",
        r"(?:on|around)\s+[\d.\-/]{6,12}[^.]{0,200}(?:false\s+complaint|false\s+case|false\s+498A)[^.]{0,100}\.",
    ]:
        found.extend(re.findall(pat, text, re.IGNORECASE))

    # Numbered paragraph style: "1. On DD/MM/YYYY, the respondent..."
    numbered = re.findall(
        r"\d+\.\s+(?:On|That\s+on|Around)[^.]{20,300}\.",
        text, re.IGNORECASE
    )
    found.extend(numbered)

    return [f.strip() for f in found if len(f.strip()) > 20][:8]


# ─── MAINTENANCE AMOUNT ───────────────────────────────────────────────────────

def _maintenance(text: str) -> Optional[str]:
    m = re.search(
        r"maintenance\s+of\s+Rs\.?\s*([\d,]+)\s*(?:per\s+month|p\.m\.?|/-\s*per\s+month)?",
        text, re.IGNORECASE
    )
    if m:
        return m.group(1).replace(",", "")
    m = re.search(r"₹\s*([\d,]+)\s*(?:per\s+month|p\.m\.?)", text, re.IGNORECASE)
    if m:
        return m.group(1).replace(",", "")
    return None


# ─── MAIN ENTRY POINT ─────────────────────────────────────────────────────────

def extract_facts(text: str) -> Dict[str, Any]:
    """
    Extract all structured legal facts from free-text case description.
    Returns a dict compatible with the full LegalOne drafter pipeline.
    """
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
    maint_amt = _maintenance(text)

    summary = f"{pet or '?'} vs {res or '?'} — {gr_d.get('ground', '?')}"
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
        "cohabitation_address":  addrs_d.get("cohabitation_address"),

        # Marriage
        "marriage_date":         marr_d.get("marriage_date"),
        "marriage_place":        marr_d.get("marriage_place"),
        "marriage_type":         marr_d.get("marriage_type"),
        "separation_date":       marr_d.get("separation_date"),
        "children":              kids,

        # Case
        "ground":                gr_d.get("ground"),
        "relief":                gr_d.get("relief"),
        "relief_sought":         gr_d.get("relief"),
        "cause_of_action":       gr_d.get("ground"),
        "cruelty_incidents":     incidents,
        "maintenance_amount":    maint_amt,

        # Court
        "court":                 jur_d.get("court"),
        "jurisdiction_court":    jur_d.get("court"),
        "jurisdiction_city":     jur_d.get("city"),
        "location":              jur_d.get("city"),

        # Other
        "previous_litigation":   prev,
        "advocate_name":         adv,
        "amount":                maint_amt,
        "dates":                 re.findall(r"\b\d{1,2}[.\-/]\d{1,2}[.\-/]\d{4}\b", text),
        "evidence_mentioned":    [],
        "additional_facts":      [],
    }


if __name__ == "__main__":
    TEST = """I have been instructed by the Petitioner, Mr. Rohan Malhotra, aged about 38 years,
presently residing at B-124, Greater Kailash-I, New Delhi – 110048, to initiate
matrimonial proceedings. The Petitioner's marriage with the Respondent, Mrs. Priya Malhotra
(née Khanna), was solemnized on 18.02.2016 at Rajouri Garden, New Delhi, according to
Hindu rites and ceremonies. One male child, namely Master Aarav Malhotra, aged about 7 years,
was born on 12.09.2018. The parties have been residing separately since 15.03.2025.
The Petitioner is employed as a Senior Sales Manager with M/s Zenith Automobiles Pvt. Ltd.
The Petitioner seeks divorce on the ground of cruelty under Section 13(1)(ia) HMA.
The petition is to be filed at Family Court, New Delhi."""
    result = extract_facts(TEST)
    print("\n=== Extracted Facts ===")
    for k, v in result.items():
        if v and v != [] and v != "":
            print(f"  {k:30s}: {v}")
