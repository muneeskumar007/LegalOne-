"""
argument_writer.py
Generates structured legal arguments (petitioner & respondent) from case facts,
citing relevant precedents and statutory provisions retrieved via RAG.
"""

import json
import requests
from typing import Dict, Any, List, Optional
from  core.rag_pipeline import retrieve

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL    = "llama3"

# ── Built-in precedent database ──────────────────────────────────────────────
PRECEDENTS: List[Dict] = [
    {
        "citation": "Basalingappa v. Mudibasappa, (2019) 5 SCC 418",
        "court": "Supreme Court of India",
        "principle": "Presumption under Sections 118 and 139 of NI Act is rebuttable on preponderance of probabilities. Accused need not prove beyond reasonable doubt.",
        "applicable_to": ["cheque_dishonour", "money_recovery"],
        "favours": "defendant"
    },
    {
        "citation": "Rangappa v. Sri Mohan, (2010) 11 SCC 441",
        "court": "Supreme Court of India",
        "principle": "Once execution of cheque is admitted, presumption under Section 139 NI Act arises in favour of the complainant for legally enforceable debt.",
        "applicable_to": ["cheque_dishonour"],
        "favours": "plaintiff"
    },
    {
        "citation": "M.S. Narayana Menon v. State of Kerala, (2006) 6 SCC 39",
        "court": "Supreme Court of India",
        "principle": "In cheque dishonour cases, burden shifts to accused to rebut statutory presumption once basic facts are established.",
        "applicable_to": ["cheque_dishonour"],
        "favours": "plaintiff"
    },
    {
        "citation": "Suresh Kumar Bhikamchand Jain v. Pandey Prakash, AIR 2019 SC 1",
        "court": "Supreme Court of India",
        "principle": "Bank withdrawal statement alone does not prove repayment to plaintiff. Withdrawal merely shows availability of money, not its disbursement to the creditor.",
        "applicable_to": ["money_recovery"],
        "favours": "plaintiff"
    },
    {
        "citation": "Ajay Enterprises v. Municipal Corporation, (2009) 3 SCC 224",
        "court": "Supreme Court of India",
        "principle": "In civil suits, standard of proof is preponderance of probabilities, not beyond reasonable doubt. Documentary evidence carries greater evidentiary value than oral testimony alone.",
        "applicable_to": ["money_recovery", "property_dispute"],
        "favours": "neutral"
    },
    {
        "citation": "Dorab Cawasji Warden v. Coomi Sorab Warden, (1990) 2 SCC 117",
        "court": "Supreme Court of India",
        "principle": "For grant of temporary injunction: prima facie case, balance of convenience, irreparable injury. All three must co-exist.",
        "applicable_to": ["property_dispute"],
        "favours": "plaintiff"
    },
    {
        "citation": "Satnam Singh v. Surinder Kaur, (2009) 2 SCC 562",
        "court": "Supreme Court of India",
        "principle": "Plaintiff must prove exclusive, open, peaceful, and continuous possession for injunction. Title alone without possession may not suffice.",
        "applicable_to": ["property_dispute"],
        "favours": "neutral"
    },
    {
        "citation": "S.R. Batra v. Taruna Batra, (2007) 3 SCC 169",
        "court": "Supreme Court of India",
        "principle": "Under PWDVA 2005, 'shared household' means where the aggrieved person lived in domestic relationship. Right to reside cannot be claimed in property owned by relatives of husband.",
        "applicable_to": ["domestic_violence"],
        "favours": "neutral"
    },
    {
        "citation": "National Insurance Co. v. Hindustan Safety Glass, (2017) 4 SCC 377",
        "court": "Supreme Court of India",
        "principle": "Burden of proof in civil cases is on the party asserting a fact. Preponderance of probability sufficient — mathematical certainty not required.",
        "applicable_to": ["money_recovery", "consumer_complaint"],
        "favours": "neutral"
    },
]


def get_relevant_precedents(case_type: str, side: str = "both") -> List[Dict]:
    """Return precedents applicable to a case type, optionally filtered by side."""
    result = [p for p in PRECEDENTS if case_type in p["applicable_to"]]
    if side == "plaintiff":
        return [p for p in result if p["favours"] in ("plaintiff", "neutral")]
    elif side == "defendant":
        return [p for p in result if p["favours"] in ("defendant", "neutral")]
    return result


def _call_ollama(prompt: str, system: str = "") -> Optional[str]:
    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user",   "content": prompt}
                ],
                "stream": False,
                "options": {"temperature": 0.3, "num_predict": 1500}
            },
            timeout=120
        )
        if resp.status_code == 200:
            return resp.json().get("message", {}).get("content", "")
    except Exception as e:
        print(f"[Ollama] {e}")
    return None


def _template_argument(facts: Dict, case_type: str, side: str,
                        precedents: List[Dict], rag_sections: str) -> str:
    """Rule-based fallback argument generator."""
    pname    = facts.get("plaintiff_name", "The Plaintiff")
    dname    = facts.get("defendant_name", "The Defendant")
    amount   = facts.get("amount", "the suit amount")
    evidence = ", ".join(facts.get("evidence_mentioned", []) or ["documentary evidence"])

    prec_text = "\n".join([
        f"  {i+1}. {p['citation']} ({p['court']})\n"
        f"     {p['principle']}"
        for i, p in enumerate(precedents[:3])
    ])

    if side == "petitioner":
        return f"""
ARGUMENTS ON BEHALF OF THE PETITIONER / PLAINTIFF

SUBMITTED BY: {pname.upper()}

A. OPENING SUBMISSION

It is most respectfully submitted that the Plaintiff, {pname}, has filed
the present suit against the Defendant, {dname}, for recovery of a sum of
{amount}. The claim is fully supported by law, facts, and documentary
evidence on record.

B. FACTUAL SUBMISSIONS

1. The Defendant borrowed {amount} from the Plaintiff under a legally
   enforceable agreement, as established by {evidence}.

2. Despite repeated demands made by the Plaintiff, both oral and written,
   the Defendant has wilfully neglected and refused to repay the said sum.

3. The Plaintiff has produced cogent documentary evidence establishing
   the debt, its quantum, and the default committed by the Defendant.

C. LEGAL SUBMISSIONS

4. The Plaintiff submits that the present suit is squarely maintainable
   under the applicable provisions of law, including the Indian Contract
   Act, 1872, and the Code of Civil Procedure, 1908.

5. The burden of proof has been discharged by the Plaintiff by producing
   primary documentary evidence. Under Sections 101 and 102 of the
   Indian Evidence Act, 1872, the burden to prove repayment or discharge
   now squarely lies upon the Defendant.

6. The Defendant's mere denial, unsupported by credible evidence, cannot
   displace the Plaintiff's established case.

D. JUDICIAL PRECEDENTS

{prec_text}

E. PRAYER

In view of the above submissions, it is most humbly prayed that this
Honourable Court be pleased to decree the suit in favour of the Plaintiff
for {amount} with interest and costs.

                              Respectfully submitted,
                              COUNSEL FOR PLAINTIFF
"""
    else:
        return f"""
ARGUMENTS ON BEHALF OF THE RESPONDENT / DEFENDANT

SUBMITTED BY: {dname.upper()}

A. OPENING SUBMISSION

The Defendant, {dname}, most respectfully submits that the present suit
filed by the Plaintiff, {pname}, is not maintainable and deserves to be
dismissed with costs on the following grounds:

B. PRELIMINARY OBJECTIONS

1. The suit is not maintainable in law or on facts as presented.
2. The Plaintiff has no locus standi to maintain the present suit.
3. The claim is grossly exaggerated and without legal basis.

C. FACTUAL SUBMISSIONS ON MERITS

4. The Defendant specifically denies having any outstanding liability
   towards the Plaintiff as claimed or at all.

5. Without prejudice to the above, the Defendant states that all dues,
   if any, have been fully discharged and settled between the parties.

6. The Defendant has produced documentary evidence, including bank
   records and witness testimony, to substantiate the defence.

D. LEGAL SUBMISSIONS

7. The standard of proof in civil proceedings is "preponderance of
   probabilities." The Defendant has raised a probable defence supported
   by documentary evidence, which is sufficient to rebut any presumption.

8. The Plaintiff has failed to establish a legally enforceable claim
   by cogent and reliable evidence. Oral claims unsupported by
   independent corroboration cannot sustain a civil decree.

E. JUDICIAL PRECEDENTS

{prec_text}

F. PRAYER

In view of the above submissions, the Defendant humbly prays that this
Honourable Court dismiss the suit with costs and grant such further
relief as may be deemed fit and just.

                              Respectfully submitted,
                              COUNSEL FOR DEFENDANT
"""


def generate_arguments(
    facts: Dict[str, Any],
    rule_mapping: Dict[str, Any],
    side: str = "both"
) -> Dict[str, Any]:
    """
    Generate legal arguments for petitioner, respondent, or both.
    side: "petitioner" | "respondent" | "both"
    """
    case_type = rule_mapping.get("detected_case_type", "money_recovery")
    query     = f"{facts.get('case_summary', '')} legal argument {case_type}"
    rag_ctx   = "\n".join([
        f"• {r['act']} {r['section']}: {r['text'][:200]}"
        for r in retrieve(query, top_k=4)
    ])

    sides_to_generate = (
        ["petitioner", "respondent"] if side == "both"
        else [side]
    )

    system = """You are a senior Indian legal advocate with 25+ years of experience.
Write structured legal arguments in formal court language. Cite specific Indian statutes
and Supreme Court judgements. Use numbered paragraphs. Be persuasive and concise."""

    results = {}
    for s in sides_to_generate:
        precs = get_relevant_precedents(case_type, s)

        prec_block = "\n".join([
            f"  - {p['citation']}: {p['principle']}"
            for p in precs[:3]
        ])

        prompt = f"""Write formal legal court arguments for the {s.upper()} in this case:

CASE FACTS:
{json.dumps(facts, indent=2)}

CASE TYPE: {rule_mapping.get('case_label')}
APPLICABLE LAW: {', '.join(a['act'] for a in rule_mapping.get('applicable_acts', [])[:3])}

RELEVANT PRECEDENTS:
{prec_block}

RELEVANT LEGAL PROVISIONS (RAG):
{rag_ctx[:600]}

Write 5-7 structured argument paragraphs with:
- Opening submission
- Factual submissions (numbered)
- Legal grounds (citing sections)
- 2-3 judicial precedents with citation
- Prayer/conclusion
Keep it formal, persuasive, and court-ready."""

        llm_result = _call_ollama(prompt, system)
        if llm_result and len(llm_result) > 300:
            results[s] = {"argument": llm_result, "source": "ollama_llm", "precedents": precs}
        else:
            results[s] = {
                "argument": _template_argument(facts, case_type, s, precs, rag_ctx),
                "source": "rule_based_template",
                "precedents": precs
            }

    return {
        "arguments": results,
        "precedents_db_size": len(PRECEDENTS),
        "case_type": case_type,
        "rag_context_used": rag_ctx[:400]
    }
