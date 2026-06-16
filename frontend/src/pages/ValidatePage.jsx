import { useState } from 'react'
import { validateDraft } from '../utils/api'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../context/AuthContext'
import HistoryPanel from '../components/HistoryPanel'
import { CheckCircle, XCircle, AlertTriangle, Info, Loader, Clock, Save } from 'lucide-react'

const SEV_ICON  = { critical: XCircle, high: AlertTriangle, medium: Info, low: Info }
const SEV_CLASS = { critical:'badge-error', high:'badge-warning', medium:'badge-info', low:'badge-gold' }

export default function ValidatePage() {
  const { isLoggedIn }    = useAuth()
  const { save, saving }  = useHistory('validate')

  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [histOpen, setHistOpen] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const validate = async () => {
    if (!text.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await validateDraft(text)
      setResult(data.validation)
      if (isLoggedIn) {
        await save({
          raw_input:        text.slice(0, 2000),
          draft_text:       text,
          validation_score: data.validation?.quality_score,
        })
        setSavedMsg('Saved'); setTimeout(() => setSavedMsg(''), 2500)
      }
    } catch(e) { setError(e.response?.data?.detail || e.message) }
    setLoading(false)
  }

  const restore = (item) => { setText(item.draft_text || item.raw_input || ''); setHistOpen(false) }

  const score = result?.quality_score || 0
  const scoreColor = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)'

  return (
    <div style={{ maxWidth:900 }}>
      <div className="animate-fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, marginBottom:6 }}>
            <CheckCircle size={22} style={{ display:'inline', marginRight:10, color:'var(--gold)' }} />
            Draft Validator
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>Check any legal draft for missing sections, compliance issues, and contradictions</p>
        </div>
        <button onClick={() => setHistOpen(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-card)', color:isLoggedIn?'var(--gold)':'var(--text-muted)', fontSize:13, cursor:'pointer', transition:'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='var(--gold-dim)'}
          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
          <Clock size={14} /> History {!isLoggedIn && <span style={{ fontSize:10 }}>(login)</span>}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="glass-card" style={{ padding:16 }}>
            <label style={{ fontSize:12, color:'var(--text-muted)', display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>Paste Legal Draft</label>
            <textarea className="legal-input" rows={14} value={text} onChange={e => setText(e.target.value)}
              placeholder="Paste your petition, plaint, counter-statement, or any legal document here…" disabled={loading} />
            <button className="btn-gold" onClick={validate} disabled={loading||!text.trim()} style={{ width:'100%', padding:'12px', borderRadius:8, fontSize:14, marginTop:12 }}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><Loader size={16} style={{ animation:'spin 1s linear infinite' }} />Validating…</span>
                : '🔍 Validate Draft'}
            </button>
            {saving && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6, textAlign:'center' }}>Saving…</div>}
            {savedMsg && <div style={{ fontSize:11, color:'var(--success)', marginTop:6, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}><Save size={11} />{savedMsg}</div>}
          </div>
        </div>

        <div>
          {error && <div style={{ padding:14, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, color:'var(--error)', fontSize:13, marginBottom:16 }}>{error}</div>}

          {!result && !loading && (
            <div style={{ height:'100%', minHeight:300, display:'flex', alignItems:'center', justifyContent:'center', border:'2px dashed var(--border)', borderRadius:12, color:'var(--text-muted)', fontSize:14, flexDirection:'column', gap:8 }}>
              <CheckCircle size={32} color="var(--text-muted)" />
              <div>Validation results will appear here</div>
              <div style={{ fontSize:12, opacity:0.6 }}>{isLoggedIn ? 'Auto-saved after validation' : 'Sign in to save history'}</div>
            </div>
          )}

          {result && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Score card */}
              <div className="glass-card" style={{ padding:20, textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Quality Score</div>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:56, fontWeight:700, color:scoreColor, lineHeight:1 }}>{score}</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>out of 100</div>
                <div className="progress-bar" style={{ marginBottom:12 }}>
                  <div className="progress-fill" style={{ width:`${score}%`, background:`linear-gradient(90deg,${scoreColor},${scoreColor})` }} />
                </div>
                <div style={{ display:'flex', justifyContent:'center', gap:8 }}>
                  <span className={`badge ${result.is_valid?'badge-success':'badge-error'}`}>{result.is_valid?'✓ Valid Draft':'✗ Needs Review'}</span>
                  <span className="badge badge-info">{result.statistics?.word_count} words</span>
                </div>
              </div>

              {/* Sections checklist */}
              <div className="glass-card" style={{ padding:16 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>
                  Sections ({result.sections_present?.length}/{(result.sections_present?.length||0)+(result.sections_missing?.length||0)})
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {result.sections_present?.map((s,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:6, background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.15)', fontSize:12 }}>
                      <CheckCircle size={12} color="var(--success)" />
                      <span style={{ color:'var(--text-secondary)' }}>{s.label}</span>
                    </div>
                  ))}
                  {result.sections_missing?.map((s,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:6, background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.15)', fontSize:12 }}>
                      <XCircle size={12} color="var(--error)" />
                      <span style={{ color:'var(--text-muted)' }}>{s.label}</span>
                      <span className={`badge ${SEV_CLASS[s.severity]}`} style={{ fontSize:9, marginLeft:'auto' }}>{s.severity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {result.warnings?.length > 0 && (
                <div className="glass-card" style={{ padding:16 }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Warnings ({result.warnings.length})</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {result.warnings.map((w,i) => {
                      const Icon = SEV_ICON[w.severity]||Info
                      const colors = { critical:'var(--error)', high:'var(--warning)', medium:'var(--info)', low:'var(--text-muted)' }
                      return (
                        <div key={i} style={{ padding:'10px 12px', borderRadius:6, background:'var(--bg-card)', border:'1px solid var(--border)', fontSize:12 }}>
                          <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                            <Icon size={13} color={colors[w.severity]} style={{ flexShrink:0, marginTop:1 }} />
                            <div>
                              <div style={{ color:'var(--text-primary)', marginBottom:3 }}>{w.message}</div>
                              {w.suggestion && <div style={{ color:'var(--text-muted)', fontSize:11 }}>💡 {w.suggestion}</div>}
                            </div>
                            <span className={`badge ${SEV_CLASS[w.severity]}`} style={{ fontSize:9, marginLeft:'auto', flexShrink:0 }}>{w.severity}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Advocate notes */}
              {result.advocate_notes?.length > 0 && (
                <div style={{ padding:'12px 14px', background:'rgba(212,168,67,0.06)', border:'1px solid rgba(212,168,67,0.2)', borderRadius:8 }}>
                  <div style={{ fontSize:10, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>⚖️ Advocate Review Notes</div>
                  {result.advocate_notes.map((n,i) => (
                    <div key={i} style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:5, paddingLeft:10, borderLeft:'2px solid rgba(212,168,67,0.3)', lineHeight:1.5 }}>{n}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <HistoryPanel module="validate" isOpen={histOpen} onClose={() => setHistOpen(false)} onRestore={restore} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
