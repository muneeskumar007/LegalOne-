import { useState } from 'react'
import { compareDocuments } from '../utils/api'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../context/AuthContext'
import HistoryPanel from '../components/HistoryPanel'
import { GitCompare, Loader, AlertTriangle, CheckCircle, Clock, Save } from 'lucide-react'

export default function ComparePage() {
  const { isLoggedIn }    = useAuth()
  const { save, saving }  = useHistory('compare')

  const [doc1, setDoc1]         = useState('')
  const [doc2, setDoc2]         = useState('')
  const [label1, setLabel1]     = useState('Petition')
  const [label2, setLabel2]     = useState('Counter')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [histOpen, setHistOpen] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const compare = async () => {
    if (!doc1.trim() || !doc2.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await compareDocuments(doc1, doc2, label1, label2)
      setResult(data.comparison)
      if (isLoggedIn) {
        await save({
          raw_input:      `${label1}: ${doc1.slice(0,500)}\n\n${label2}: ${doc2.slice(0,500)}`,
          compare_result: JSON.stringify(data.comparison),
        })
        setSavedMsg('Saved'); setTimeout(() => setSavedMsg(''), 2500)
      }
    } catch(e) { setError(e.response?.data?.detail || e.message) }
    setLoading(false)
  }

  const restore = (item) => {
    if (item.compare_result) {
      try {
        const r = typeof item.compare_result === 'string' ? JSON.parse(item.compare_result) : item.compare_result
        setResult(r)
      } catch {}
    }
    setHistOpen(false)
  }

  return (
    <div style={{ maxWidth:1000 }}>
      <div className="animate-fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, marginBottom:6 }}>
            <GitCompare size={22} style={{ display:'inline', marginRight:10, color:'var(--gold)' }} />
            Document Comparison
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>Detect factual contradictions between petition and counter statement</p>
        </div>
        <button onClick={() => setHistOpen(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-card)', color:isLoggedIn?'var(--gold)':'var(--text-muted)', fontSize:13, cursor:'pointer', transition:'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='var(--gold-dim)'}
          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
          <Clock size={14} /> History {!isLoggedIn && <span style={{ fontSize:10 }}>(login)</span>}
        </button>
      </div>

      {/* Document inputs */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {[[doc1,setDoc1,label1,setLabel1],[doc2,setDoc2,label2,setLabel2]].map(([val,setVal,lbl,setLbl],idx) => (
          <div key={idx} className="glass-card" style={{ padding:16 }}>
            <div style={{ display:'flex', gap:8, marginBottom:10 }}>
              <input value={lbl} onChange={e => setLbl(e.target.value)} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-primary)', borderRadius:6, padding:'5px 10px', fontSize:12, width:120, outline:'none' }} />
              <span style={{ fontSize:12, color:'var(--text-muted)', alignSelf:'center' }}>Document {idx+1}</span>
            </div>
            <textarea className="legal-input" rows={12} value={val} onChange={e => setVal(e.target.value)}
              placeholder={`Paste ${lbl} here…`} disabled={loading} />
          </div>
        ))}
      </div>

      <div style={{ display:'flex', justifyContent:'center', marginBottom:24, flexDirection:'column', alignItems:'center', gap:8 }}>
        <button className="btn-gold" onClick={compare} disabled={loading||!doc1.trim()||!doc2.trim()} style={{ padding:'12px 36px', borderRadius:8, fontSize:14 }}>
          {loading ? <span style={{ display:'flex', alignItems:'center', gap:8 }}><Loader size={16} style={{ animation:'spin 1s linear infinite' }} />Comparing…</span> : '🔍 Compare Documents'}
        </button>
        {saving && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Saving to history…</div>}
        {savedMsg && <div style={{ fontSize:11, color:'var(--success)', display:'flex', alignItems:'center', gap:4 }}><Save size={11} />{savedMsg}</div>}
      </div>

      {error && <div style={{ padding:14, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, color:'var(--error)', fontSize:13, marginBottom:16 }}>{error}</div>}

      {result && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="animate-fade-up">
          {/* Summary stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {[
              { label:'Conflicts Found',       value:result.total_conflicts, color:result.total_conflicts>0?'var(--error)':'var(--success)' },
              { label:`${label1} Stance`,      value:result.document1_stance, color:'var(--info)' },
              { label:`${label2} Stance`,      value:result.document2_stance, color:'var(--warning)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card" style={{ padding:16, textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{label}</div>
                <div style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Conflicts */}
          {result.conflicts?.length > 0 ? (
            <div className="glass-card" style={{ padding:18 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>
                <AlertTriangle size={13} style={{ display:'inline', marginRight:6, color:'var(--warning)' }} />
                Detected Conflicts ({result.conflicts.length})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {result.conflicts.map((c,i) => (
                  <div key={i} style={{ padding:14, background:'var(--bg-card)', borderRadius:8, border:'1px solid rgba(251,146,60,0.2)' }}>
                    <div style={{ fontSize:12, color:'var(--gold)', fontWeight:600, marginBottom:10 }}>⚡ {c.category?.replace(/_/g,' ').toUpperCase()}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                      {[[label1,c.document1_claim],[label2,c.document2_claim]].map(([lbl,claim]) => (
                        <div key={lbl} style={{ padding:'10px 12px', background:'var(--bg-secondary)', borderRadius:6 }}>
                          <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:4 }}>{lbl}</div>
                          <div style={{ fontSize:12, color:'var(--text-secondary)', fontStyle:'italic' }}>"{claim}"</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop:8, fontSize:11, color:'var(--text-muted)', padding:'6px 10px', background:'rgba(96,165,250,0.06)', borderRadius:4, border:'1px solid rgba(96,165,250,0.15)' }}>📌 {c.analysis}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding:20, textAlign:'center', background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:8 }}>
              <CheckCircle size={24} color="var(--success)" style={{ margin:'0 auto 8px' }} />
              <div style={{ color:'var(--success)', fontWeight:600 }}>No major conflicts detected</div>
            </div>
          )}

          {/* Recommendation */}
          <div style={{ padding:16, background:'rgba(212,168,67,0.06)', border:'1px solid rgba(212,168,67,0.2)', borderRadius:8 }}>
            <div style={{ fontSize:11, color:'var(--gold)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>⚖️ Analysis</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{result.recommendation}</div>
          </div>
        </div>
      )}

      <HistoryPanel module="compare" isOpen={histOpen} onClose={() => setHistOpen(false)} onRestore={restore} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
