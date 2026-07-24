"""
Draft Generator: Uses Ollama (Llama 3) to generate legally structured petitions.
Falls back to rule-based template generation if Ollama is unavailable.
"""

import json
import requests
from typing import Dict, Any, Optional
from  core.rag_pipeline import get_context_for_prompt

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3"


def _call_ollama(prompt: str, system: str = "") -> Optional[str]:
    """Call Ollama API and return generated text."""
    try:
        payload = {
            "model": OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            "stream": False,
            "options": {
                "temperature": 0.2,
                "top_p": 0.9,
                "num_predict": 2048
            }
        }
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
            timeout=120
        )
        if resp.status_code == 200:
            data = resp.json()
            return data.get("message", {}).get("content", "")
    except Exception as e:
        print(f"[Ollama] Error: {e}")
    return None


def _template_petition(facts: Dict, rule_mapping: Dict, rag_context: str) -> str:
    """
    Rule-based template generator used as fallback when Ollama is offline.
    Produces a complete, formatted petition.
    """
    pname = facts.get("plaintiff_name", "The Plaintiff")
    dname = facts.get("defendant_name", "The Defendant")
    amount = facts.get("amount", "the suit amount")
    court = rule_mapping.get("court", "The Honourable Civil Court")
    case_label = rule_mapping.get("case_label", "Civil Suit")
    acts = rule_mapping.get("applicable_acts", [])
    relief = rule_mapping.get("relief_available", [])
    case_summary = facts.get("case_summary", "")

    act_grounds = "\n".join([
        f"    {i+1}. Under {a['act']}, {', '.join(a['sections'])}: {a['relevance']}"
        for i, a in enumerate(acts)
    ])

    relief_clause = "\n".join([
        f"    ({chr(97+i)}) {r};"
        for i, r in enumerate(relief)
    ])

    return f"""
IN {court.upper()}

{case_label.upper()}

O.S. No. _____ / {__import__('datetime').datetime.now().year}

BETWEEN:

{pname.upper()}
    Son/Daughter/Wife of ____________,
    Aged about _____ years,
    Residing at ________________________________     ... PLAINTIFF

                        AND

{dname.upper()}
    Son/Daughter/Wife of ____________,
    Aged about _____ years,
    Residing at ________________________________     ... DEFENDANT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         P L A I N T
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The Plaintiff respectfully submits as under:

PARTIES:

1.  The Plaintiff, {pname}, is a law-abiding citizen and is well-known
    to the Defendant. The Plaintiff is filing the present suit in good
    faith for recovery of lawfully due amounts.

2.  The Defendant, {dname}, is known to the Plaintiff and is
    amenable to the jurisdiction of this Honourable Court.

FACTS OF THE CASE:

3.  {case_summary if case_summary else f"The Defendant borrowed a sum of {amount} from the Plaintiff upon a promise to repay the same within the agreed period."}

4.  Despite repeated demands made by the Plaintiff, the Defendant has
    wilfully failed and neglected to repay the said amount, thereby
    causing loss and hardship to the Plaintiff.

5.  The cause of action for the present suit arose when the Defendant
    failed to repay the amount on demand, and the same is continuing.

JURISDICTION:

6.  This Honourable Court has territorial and pecuniary jurisdiction
    to entertain the present suit. The cause of action arose within the
    territorial limits of this Court's jurisdiction.

CAUSE OF ACTION:

7.  The cause of action for the present suit first arose on the date
    of default, and is a continuing cause of action. The suit is filed
    within the period of limitation prescribed under the Limitation
    Act, 1963.

LEGAL GROUNDS:

8.  The Plaintiff submits that the present suit is maintainable on the
    following legal grounds:

{act_grounds}

VALUATION AND COURT FEES:

9.  The suit is valued at {amount} for the purposes of jurisdiction
    and court fees. Appropriate court fee has been affixed hereon.

PRAYER:

    In the above circumstances, the Plaintiff most humbly prays that this
    Honourable Court may be pleased to:

{relief_clause}
    (z) Pass such other and further reliefs as this Honourable Court
        may deem fit and proper in the facts and circumstances of
        the case.

                                         Respectfully submitted,

Date: ____________                       _____________________________
Place: ___________                       PLAINTIFF / ADVOCATE FOR PLAINTIFF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[RAG-Retrieved Legal Context Used]
{rag_context[:500]}...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""


def generate_draft(
    facts: Dict[str, Any],
    rule_mapping: Dict[str, Any],
    additional_context: str = ""
) -> Dict[str, Any]:
    """
    Main entry point: generate a legal petition draft.
    1. Get RAG context
    2. Try Ollama
    3. Fall back to template
    """
    query = f"{facts.get('case_summary', '')} {facts.get('plaintiff_name', '')} {facts.get('defendant_name', '')}"
    rag_context = get_context_for_prompt(query, top_k=5)

    acts_summary = "; ".join([
        f"{a['act']} ({', '.join(a['sections'][:2])})"
        for a in rule_mapping.get("applicable_acts", [])[:3]
    ])

    system_prompt = """You are an expert Indian legal drafter with 20+ years of experience in hindu marriage act,
civil and criminal litigation. You draft petitions strictly following Indian court formats,
citing correct sections of IPC/BNS, CPC, Evidence Act, and other statutes.
Always use formal legal language. Structure every petition with:
- Court heading
- Case number placeholder
- Parties (Plaintiff vs Defendant)
- Facts numbered paragraph by paragraph
- Jurisdiction paragraph
- Cause of action
- Legal Grounds with specific sections
- Valuation
- Prayer clause
Return ONLY the petition text, no explanation."""

    user_prompt = f"""Draft a formal Indian legal petition with the following details:

EXTRACTED FACTS:
{json.dumps(facts, indent=2)}

CASE TYPE: {rule_mapping.get('case_label', 'Civil Suit')}
COURT: {rule_mapping.get('court', 'Civil Court')}
APPLICABLE ACTS & SECTIONS: {acts_summary}
RELIEF SOUGHT: {', '.join(rule_mapping.get('relief_available', [])[:3])}

RELEVANT LEGAL PROVISIONS (from RAG retrieval):
{rag_context}

{f'ADDITIONAL CONTEXT: {additional_context}' if additional_context else ''}

Generate a complete, properly formatted Indian court petition. Use placeholders like [DATE], [ADDRESS] where specific information is not provided."""

    # Try Ollama first
    ollama_result = _call_ollama(user_prompt, system_prompt)

    if ollama_result and len(ollama_result) > 200:
        return {
            "draft": ollama_result,
            "source": "ollama_llm",
            "model": OLLAMA_MODEL,
            "rag_context_used": rag_context,
            "status": "success"
        }
    else:
        # Fallback to template
        template_draft = _template_petition(facts, rule_mapping, rag_context)
        return {
            "draft": template_draft,
            "source": "rule_based_template",
            "model": "template_engine",
            "rag_context_used": rag_context,
            "status": "success_template_fallback",
            "note": "Ollama not running. Install Ollama and run 'ollama run llama3' for AI-generated drafts."
        }


def generate_counter(
    facts: Dict[str, Any],
    rule_mapping: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate a counter statement / written statement for the defendant."""
    query = f"counter statement defendant {facts.get('case_summary', '')}"
    rag_context = get_context_for_prompt(query, top_k=3)

    system_prompt = """You are an expert Indian legal drafter specializing in defense pleadings.
Draft a Written Statement / Counter strictly following Indian court formats."""

    user_prompt = f"""Draft a formal Written Statement (Counter) for the Defendant:

CASE DETAILS:
{json.dumps(facts, indent=2)}

CASE TYPE: {rule_mapping.get('case_label')}
RELEVANT LAW: {rag_context[:800]}

Structure:
1. Preliminary objections
2. Para-wise reply to plaint allegations
3. Affirmative defence
4. Prayer for dismissal"""

    ollama_result = _call_ollama(user_prompt, system_prompt)
    if ollama_result and len(ollama_result) > 200:
        return {"draft": ollama_result, "source": "ollama_llm", "type": "counter"}

    # Template fallback for counter
    dname = facts.get("defendant_name", "The Defendant")
    pname = facts.get("plaintiff_name", "The Plaintiff")
    counter = f"""
WRITTEN STATEMENT / COUNTER OF {dname.upper()}

IN THE {rule_mapping.get('court', 'CIVIL COURT').upper()}

The Defendant, {dname}, respectfully submits as follows:

PRELIMINARY OBJECTIONS:

1.  The suit is not maintainable in law or on facts.
2.  The plaintiff has no cause of action against the defendant.
3.  The suit is barred by limitation.

REPLY ON MERITS:

4.  The Defendant denies each and every allegation made by the Plaintiff,
    {pname}, save what is expressly admitted herein.

5.  The Defendant states that all dues, if any, have been duly settled
    and no amount is outstanding or payable.

AFFIRMATIVE DEFENCE:

6.  Without prejudice to the above, the Defendant states that the claim
    of the Plaintiff is highly exaggerated and unsupported by evidence.

PRAYER:

    The Defendant prays that this Honourable Court dismiss the suit
    with costs.

Date: ____________                       ___________________________
                                         DEFENDANT / ADVOCATE
"""
    return {"draft": counter, "source": "rule_based_template", "type": "counter"}
