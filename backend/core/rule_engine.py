"""
Rule Engine: Maps extracted facts to Indian statutory provisions.
Uses rule-based logic for deterministic statutory alignment.
"""

from typing import Dict, List, Any


# ─── Statutory Rule Database ────────────────────────────────────────────────

STATUTORY_RULES: Dict[str, Dict] = {
    "money_recovery": {
        "case_type": "Civil Suit for Recovery of Money",
        "court": "Civil Court / Munsiff Court",
        "acts": [
            {
                "act": "Code of Civil Procedure, 1908",
                "sections": ["Order VII Rule 1", "Section 9", "Order XXXVII"],
                "relevance": "Plaint requirements and civil court jurisdiction for money suits"
            },
            {
                "act": "Indian Contract Act, 1872",
                "sections": ["Section 10", "Section 37", "Section 73"],
                "relevance": "Enforceability of contract and recovery of dues"
            },
            {
                "act": "Limitation Act, 1963",
                "sections": ["Article 18", "Article 55"],
                "relevance": "3-year limitation period for money recovery suits"
            },
            {
                "act": "Negotiable Instruments Act, 1881",
                "sections": ["Section 118", "Section 138"],
                "relevance": "Promissory note enforcement and cheque dishonour"
            },
            {
                "act": "Indian Evidence Act, 1872 / Bharatiya Sakshya Adhiniyam, 2023",
                "sections": ["Section 101", "Section 102", "Section 118 BSA"],
                "relevance": "Burden of proof lies on plaintiff for establishing debt"
            }
        ],
        "ingredients": [
            "Existence of legally enforceable debt",
            "Identity of borrower (defendant)",
            "Date and amount of loan/transaction",
            "Mode of transaction (cash/bank transfer)",
            "Demand made and default committed",
            "Cause of action arose within limitation period"
        ],
        "relief_available": [
            "Decree for recovery of principal amount",
            "Interest from date of suit till realization",
            "Costs of litigation"
        ]
    },
    "cheque_dishonour": {
        "case_type": "Criminal Complaint under Section 138 NI Act",
        "court": "Magistrate Court (Judicial First Class Magistrate)",
        "acts": [
            {
                "act": "Negotiable Instruments Act, 1881",
                "sections": ["Section 138", "Section 141", "Section 142"],
                "relevance": "Offence of cheque dishonour and procedure"
            },
            {
                "act": "Code of Criminal Procedure, 1973 / BNSS, 2023",
                "sections": ["Section 200", "Section 204"],
                "relevance": "Complaint filing and issuance of process"
            }
        ],
        "ingredients": [
            "Issuance of cheque by accused",
            "Cheque drawn on legally enforceable debt",
            "Dishonour of cheque by bank",
            "Demand notice sent within 30 days of dishonour",
            "Failure to pay within 15 days of notice",
            "Complaint filed within 30 days of cause of action"
        ],
        "relief_available": [
            "Imprisonment up to 2 years",
            "Fine up to twice the cheque amount",
            "Compensation to complainant"
        ]
    },
    "property_dispute": {
        "case_type": "Civil Suit for Declaration / Injunction",
        "court": "Civil Court / District Court",
        "acts": [
            {
                "act": "Specific Relief Act, 1963",
                "sections": ["Section 34", "Section 38", "Section 39"],
                "relevance": "Declaratory and injunction reliefs"
            },
            {
                "act": "Transfer of Property Act, 1882",
                "sections": ["Section 5", "Section 54", "Section 105"],
                "relevance": "Transfer of immovable property"
            },
            {
                "act": "Registration Act, 1908",
                "sections": ["Section 17", "Section 49"],
                "relevance": "Compulsory registration of property documents"
            },
            {
                "act": "Code of Civil Procedure, 1908",
                "sections": ["Order XXXIX Rules 1 & 2", "Section 9"],
                "relevance": "Temporary injunction and court jurisdiction"
            }
        ],
        "ingredients": [
            "Description of property with survey/door number",
            "Title and possession of plaintiff",
            "Defendant's encroachment or disputed act",
            "Irreparable harm if relief not granted",
            "Balance of convenience in plaintiff's favour"
        ],
        "relief_available": [
            "Declaration of title",
            "Permanent injunction",
            "Temporary injunction pending suit",
            "Mandatory injunction",
            "Costs of suit"
        ]
    },
    "criminal_assault": {
        "case_type": "Criminal Complaint / FIR",
        "court": "Magistrate Court / Sessions Court",
        "acts": [
            {
                "act": "Bharatiya Nyaya Sanhita, 2023 (BNS)",
                "sections": ["Section 115", "Section 118", "Section 121"],
                "relevance": "Hurt, grievous hurt, and criminal force"
            },
            {
                "act": "Indian Penal Code, 1860 (IPC) [pre-July 2024]",
                "sections": ["Section 319", "Section 320", "Section 351"],
                "relevance": "Hurt, grievous hurt, assault"
            },
            {
                "act": "Code of Criminal Procedure, 1973 / BNSS, 2023",
                "sections": ["Section 154", "Section 156"],
                "relevance": "FIR filing and police investigation"
            }
        ],
        "ingredients": [
            "Identity of accused",
            "Date, time, and place of incident",
            "Nature of assault and injuries sustained",
            "Witnesses present at scene",
            "Medical certificate / MLC report",
            "Prior enmity or motive (if any)"
        ],
        "relief_available": [
            "Registration of FIR",
            "Arrest and prosecution of accused",
            "Compensation under Section 357 CrPC",
            "Imprisonment and/or fine"
        ]
    },
    "domestic_violence": {
        "case_type": "Application under Protection of Women from Domestic Violence Act",
        "court": "Magistrate Court / Family Court",
        "acts": [
            {
                "act": "Protection of Women from Domestic Violence Act, 2005",
                "sections": ["Section 12", "Section 18", "Section 19", "Section 20", "Section 23"],
                "relevance": "Protection orders, residence orders, monetary relief"
            },
            {
                "act": "Indian Penal Code / BNS, 2023",
                "sections": ["Section 498A IPC / Section 85 BNS"],
                "relevance": "Cruelty by husband and relatives"
            }
        ],
        "ingredients": [
            "Matrimonial relationship or domestic relationship",
            "Acts of physical, emotional, sexual or economic abuse",
            "Shared household details",
            "Children involved (if any)",
            "Injuries / medical reports",
            "Witnesses to abuse"
        ],
        "relief_available": [
            "Protection Order",
            "Residence Order",
            "Monetary Relief",
            "Custody Order",
            "Compensation Order"
        ]
    },
    "consumer_complaint": {
        "case_type": "Consumer Complaint",
        "court": "District Consumer Disputes Redressal Commission",
        "acts": [
            {
                "act": "Consumer Protection Act, 2019",
                "sections": ["Section 2(7)", "Section 34", "Section 35", "Section 36"],
                "relevance": "Consumer rights and complaint filing procedure"
            }
        ],
        "ingredients": [
            "Complainant is a consumer",
            "Deficiency in service or defect in goods",
            "Purchase details and amount paid",
            "Nature of deficiency/defect",
            "Prior complaint to seller/service provider",
            "Loss/injury suffered"
        ],
        "relief_available": [
            "Replacement or repair of goods",
            "Refund of price paid",
            "Compensation for loss and injury",
            "Punitive damages"
        ]
    }
}

# ─── Case-type keyword detection ────────────────────────────────────────────

CASE_KEYWORDS: Dict[str, List[str]] = {
    "money_recovery": [
        "money", "loan", "borrow", "lend", "debt", "recover", "repay",
        "amount", "rupee", "payment", "due", "owe", "promissory", "lakh",
        "crore", "interest", "default", "unpaid"
    ],
    "cheque_dishonour": [
        "cheque", "check", "dishonour", "bounce", "return", "insufficent funds",
        "NI act", "negotiable", "138", "bank"
    ],
    "property_dispute": [
        "property", "land", "house", "plot", "encroach", "possession",
        "title", "sale deed", "injunction", "trespass", "boundary", "flat",
        "building", "immovable", "survey"
    ],
    "criminal_assault": [
        "assault", "attack", "beat", "hurt", "injury", "fight", "hit",
        "punch", "stab", "wound", "grievous", "bodily harm", "threaten"
    ],
    "domestic_violence": [
        "domestic", "violence", "wife", "husband", "matrimonial", "cruelty",
        "dowry", "harassment", "abuse", "498a", "family"
    ],
    "consumer_complaint": [
        "consumer", "product", "defect", "service", "deficiency", "refund",
        "purchase", "quality", "warranty", "guarantee", "complaint"
    ]
}


def detect_case_type(facts_text: str) -> str:
    """Detect case type from raw facts text using keyword matching."""
    text_lower = facts_text.lower()
    scores: Dict[str, int] = {case: 0 for case in CASE_KEYWORDS}
    for case_type, keywords in CASE_KEYWORDS.items():
        for kw in keywords:
            if kw in text_lower:
                scores[case_type] += 1
    best = max(scores, key=lambda k: scores[k])
    return best if scores[best] > 0 else "money_recovery"


def get_statutory_mapping(case_type: str) -> Dict[str, Any]:
    """Return full statutory mapping for a detected case type."""
    return STATUTORY_RULES.get(case_type, STATUTORY_RULES["money_recovery"])


def map_facts_to_rules(extracted_facts: Dict[str, Any]) -> Dict[str, Any]:
    """
    Core rule engine: takes extracted facts dict and returns
    statutory mapping, missing ingredients, and applicable acts.
    """
    raw_text = " ".join(str(v) for v in extracted_facts.values())
    case_type = detect_case_type(raw_text)
    mapping = get_statutory_mapping(case_type)

    # Check which ingredients are likely present
    present_ingredients = []
    missing_ingredients = []
    for ingredient in mapping["ingredients"]:
        # Heuristic: check if key concept words appear in facts
        key_words = ingredient.lower().split()[:3]
        if any(kw in raw_text.lower() for kw in key_words if len(kw) > 3):
            present_ingredients.append(ingredient)
        else:
            missing_ingredients.append(ingredient)

    return {
        "detected_case_type": case_type,
        "case_label": mapping["case_type"],
        "court": mapping["court"],
        "applicable_acts": mapping["acts"],
        "ingredients_present": present_ingredients,
        "ingredients_missing": missing_ingredients,
        "relief_available": mapping["relief_available"],
        "confidence": round(len(present_ingredients) / max(len(mapping["ingredients"]), 1), 2)
    }
