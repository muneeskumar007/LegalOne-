import { useState } from 'react'
import { extractFacts, classifyCase, generateDraft, validateDraft } from '../utils/api'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../context/AuthContext'
import HistoryPanel from '../components/HistoryPanel'
import { CheckCircle, Circle, Loader, AlertTriangle, Copy, Clock, Save } from 'lucide-react'

const STEPS = [
  { id:'extract',  label:'Fact Extraction',    desc:'Parsing names, amounts, dates…'   },
  { id:'classify', label:'Case Classification', desc:'Mapping to statutory rules…'      },
  { id:'draft',    label:'Draft Generation',    desc:'Calling LLM / template engine…'  },
  { id:'validate', label:'Validation',          desc:'Checking legal completeness…'     },
]

function StepBadge({ step, status }) {
  const colors = { pending:'var(--text-muted)', active:'var(--gold)', done:'var(--success)', error:'var(--error)' }
  const Icon = status==='done' ? CheckCircle : status==='active' ? Loader : status==='error' ? AlertTriangle : Circle
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:8, marginBottom:8, transition:'all 0.3s',
      background: status==='active'?'rgba(212,168,67,0.1)': status==='done'?'rgba(74,222,128,0.08)': status==='error'?'rgba(248,113,113,0.08)':'var(--bg-card)',
      border:`1px solid ${status==='active'?'rgba(212,168,67,0.25)': status==='done'?'rgba(74,222,128,0.2)': status==='error'?'rgba(248,113,113,0.2)':'var(--border)'}`
    }}>
      <Icon size={16} color={colors[status]} style={{ flexShrink:0, animation:status==='active'?'spin 1s linear infinite':'none' }} />
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:status==='pending'?'var(--text-muted)':'var(--text-primary)' }}>{step.label}</div>
        {status==='active' && <div style={{ fontSize:11, color:'var(--gold)', marginTop:2 }}>{step.desc}</div>}
      </div>
      {status==='done'   && <span className="badge badge-success" style={{ fontSize:10 }}>Done</span>}
      {status==='active' && <span className="badge badge-gold"    style={{ fontSize:10 }}>Running…</span>}
    </div>
  )
}

export default function PipelinePage() {
  const { isLoggedIn }    = useAuth()
  const { save, saving }  = useHistory('pipeline')

  const [input, setInput]       = useState('')
  const [running, setRunning]   = useState(false)
  const [stepStatus, setStepStatus] = useState({ extract:'pending', classify:'pending', draft:'pending', validate:'pending' })
  const [results, setResults]   = useState(null)
  const [error, setError]       = useState('')
  const [histOpen, setHistOpen] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const setStep = (id, status) => setStepStatus(prev => ({ ...prev, [id]:status }))

  const runPipeline = async () => {
    if (!input.trim()) return
    setRunning(true); setError(''); setResults(null)
    setStepStatus({ extract:'pending', classify:'pending', draft:'pending', validate:'pending' })
    try {
      setStep('extract','active')
      const extracted  = await extractFacts(input)
      setStep('extract','done')

      setStep('classify','active')
      const classified = await classifyCase(extracted.facts)
      setStep('classify','done')

      setStep('draft','active')
      const drafted    = await generateDraft(input)
      setStep('draft','done')

      setStep('validate','active')
      const validated  = await validateDraft(drafted.draft.draft)
      setStep('validate','done')

      const r = { extracted: extracted.facts, classified: classified.classification, drafted: drafted.draft, validated: validated.validation }
      setResults(r)

      if (isLoggedIn) {
        await save({
          raw_input:       input,
          plaintiff_name:  extracted.facts?.plaintiff_name,
          defendant_name:  extracted.facts?.defendant_name,
          amount:          extracted.facts?.amount,
          case_type:       classified.classification?.case_label,
          court:           classified.classification?.court,
          draft_text:      drafted.draft?.draft,
          draft_source:    drafted.draft?.source,
          validation_score:validated.validation?.quality_score,
        })
        setSavedMsg('Saved to history')
        setTimeout(() => setSavedMsg(''), 3000)
      }
    } catch(e) {
      setError(e.response?.data?.detail || e.message || 'Pipeline error')
    }
    setRunning(false)
  }

  const restore = (item) => { setInput(item.raw_input || ''); setHistOpen(false) }
  const copyDraft = () => { if (results?.drafted?.draft) navigator.clipboard.writeText(results.drafted.draft) }

  return (
    <div style={{ maxWidth:900 }}>
      <div className="animate-fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, marginBottom:6 }}>AI Legal Pipeline</h2>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>Full end-to-end: Fact Extraction → Classification → Rule Engine → RAG → Draft → Validation</p>
        </div>
        <button onClick={() => setHistOpen(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-card)', color:isLoggedIn?'var(--gold)':'var(--text-muted)', fontSize:13, cursor:'pointer', transition:'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='var(--gold-dim)'}
          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
          <Clock size={14} /> History {!isLoggedIn && <span style={{ fontSize:10 }}>(login)</span>}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:24 }}>
        {/* Left */}
        <div>
          <div className="glass-card" style={{ padding:18, marginBottom:14 }}>
            <label style={{ fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Case Description</label>
            <textarea className="legal-input" rows={7} value={input} onChange={e => setInput(e.target.value)}
              placeholder="e.g. Karthick files a money recovery suit against Ganesh for ₹1,00,000 borrowed 1 year ago…"
              disabled={running} />
            <button className="btn-gold" onClick={runPipeline} disabled={running||!input.trim()} style={{ width:'100%', padding:'12px', borderRadius:8, marginTop:12, fontSize:14 }}>
              {running ? 'Running Pipeline…' : '⚡ Run Full Pipeline'}
            </button>
            {saving && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6, textAlign:'center' }}>Saving…</div>}
            {savedMsg && <div style={{ fontSize:11, color:'var(--success)', marginTop:6, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}><Save size={11} />{savedMsg}</div>}
          </div>

          <div>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Pipeline Steps</div>
            {STEPS.map(s => <StepBadge key={s.id} step={s} status={stepStatus[s.id]} />)}
          </div>
        </div>

        {/* Right */}
        <div>
          {error && (
            <div style={{ padding:16, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, color:'var(--error)', fontSize:13, marginBottom:16 }}>
              <strong>Error:</strong> {error}
              <div style={{ fontSize:11, marginTop:4, color:'var(--text-muted)' }}>Make sure backend is running: uvicorn main:app --reload</div>
            </div>
          )}

          {!results && !running && (
            <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', border:'2px dashed var(--border)', borderRadius:12, color:'var(--text-muted)', fontSize:14, flexDirection:'column', gap:8 }}>
              <span style={{ fontSize:32 }}>⚖️</span>
              <div>Results appear here after running the pipeline</div>
              <div style={{ fontSize:12, opacity:0.6 }}>{isLoggedIn ? 'Auto-saved after completion' : 'Sign in to save history'}</div>
            </div>
          )}

          {results && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Extracted facts */}
              <div className="glass-card" style={{ padding:16 }}>
                <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:12 }}>Extracted Facts</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[['Plaintiff',results.extracted.plaintiff_name],['Defendant',results.extracted.defendant_name],['Amount',results.extracted.amount],['Case Type',results.extracted.case_type_hint],['Cause of Action',results.extracted.cause_of_action],['Evidence',results.extracted.evidence_mentioned?.join(', ')]].map(([k,v]) => v && (
                    <div key={k} style={{ padding:'8px 10px', background:'var(--bg-card)', borderRadius:6 }}>
                      <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>{k}</div>
                      <div style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Classification */}
              <div className="glass-card" style={{ padding:16 }}>
                <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:10 }}>Classification & Statutory Mapping</div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <span className="badge badge-gold">{results.classified.case_label}</span>
                  <span style={{ fontSize:12, color:'var(--text-muted)' }}>{results.classified.court}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {results.classified.applicable_acts?.slice(0,3).map((act,i) => (
                    <div key={i} style={{ padding:'7px 11px', background:'var(--bg-card)', borderRadius:6, fontSize:12 }}>
                      <span style={{ color:'var(--gold)', fontWeight:600 }}>{act.act}</span>
                      <span style={{ color:'var(--text-muted)', marginLeft:6 }}>{act.sections?.slice(0,2).join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation score */}
              <div className="glass-card" style={{ padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)' }}>Validation Score</div>
                  <span style={{ fontFamily:'Playfair Display,serif', fontSize:22, fontWeight:700, color:results.validated.quality_score>=70?'var(--success)':'var(--warning)' }}>
                    {results.validated.quality_score}%
                  </span>
                </div>
                <div className="progress-bar" style={{ marginBottom:10 }}>
                  <div className="progress-fill" style={{ width:`${results.validated.quality_score}%` }} />
                </div>
                {results.validated.warnings?.slice(0,3).map((w,i) => (
                  <div key={i} style={{ fontSize:11, color:w.severity==='critical'?'var(--error)':w.severity==='high'?'var(--warning)':'var(--text-muted)', marginBottom:4, display:'flex', gap:6 }}>
                    <AlertTriangle size={12} style={{ flexShrink:0, marginTop:1 }} />{w.message}
                  </div>
                ))}
              </div>

              {/* Draft preview */}
              <div className="glass-card" style={{ padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)' }}>Generated Draft</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={copyDraft} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'5px 10px', borderRadius:6, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                      <Copy size={12} /> Copy
                    </button>
                    <span className={`badge ${results.drafted.source==='ollama_llm'?'badge-success':'badge-warning'}`} style={{ fontSize:10 }}>
                      {results.drafted.source==='ollama_llm'?'🤖 Ollama':'📋 Template'}
                    </span>
                  </div>
                </div>
                <div className="draft-output" style={{ maxHeight:300, overflowY:'auto', fontSize:12 }}>
                  {results.drafted.draft}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <HistoryPanel module="pipeline" isOpen={histOpen} onClose={() => setHistOpen(false)} onRestore={restore} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
