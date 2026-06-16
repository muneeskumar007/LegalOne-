import { useState } from 'react'
import { generateArguments, exportPDF } from '../utils/api'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../context/AuthContext'
import HistoryPanel from '../components/HistoryPanel'
import { Loader, Copy, Download, AlertCircle, Scale, ChevronDown, ChevronUp, Clock, Save, Edit2, Check, X } from 'lucide-react'

const EXAMPLES = [
  { label:'Money Recovery', text:'Karthick files a money recovery suit against Ganesh for ₹1,00,000 borrowed 1 year ago. Ganesh claims he already paid in cash with witnesses present.' },
  { label:'Cheque Bounce',  text:'Priya issued a cheque of ₹75,000 to Ravi which was returned dishonoured. A legal demand notice was sent but Priya failed to pay within 15 days.' },
  { label:'Property',       text:'Suresh is lawful owner of a plot at 12, Anna Nagar. Ramesh has illegally encroached and is refusing to vacate despite repeated demands.' },
]

function ArgumentCard({ title, content, precedents, source, onCopy, onExport, exporting, onUpdate }) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(content)
  
  const handleSave = () => {
    if (onUpdate) onUpdate(editContent)
    setEditing(false)
  }
  
  const handleCancel = () => {
    setEditContent(content)
    setEditing(false)
  }
  
  return (
    <div className="glass-card" style={{ padding:0, overflow:'hidden' }}>
      <div onClick={() => setExpanded(e => !e)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', cursor:'pointer', background:'rgba(212,168,67,0.06)', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Scale size={15} color="var(--gold)" />
          <span style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:600 }}>{title}</span>
          <span className={`badge ${source==='ollama_llm'?'badge-success':'badge-warning'}`} style={{ fontSize:10 }}>{source==='ollama_llm'?'🤖 AI':'📋 Template'}</span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          {!editing && (
            <>
              <button onClick={e => { e.stopPropagation(); setEditing(true) }} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <Edit2 size={11} /> Edit
              </button>
              <button onClick={e => { e.stopPropagation(); onCopy() }} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <Copy size={11} /> Copy
              </button>
              <button onClick={e => { e.stopPropagation(); onExport() }} disabled={exporting} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:5, opacity:exporting?0.5:1 }}>
                <Download size={11} /> {exporting?'…':'PDF'}
              </button>
            </>
          )}
          {editing && (
            <>
              <button onClick={e => { e.stopPropagation(); handleSave() }} style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', color:'var(--success)', padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <Check size={11} /> Save
              </button>
              <button onClick={e => { e.stopPropagation(); handleCancel() }} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', padding:'4px 10px', borderRadius:6, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <X size={11} /> Cancel
              </button>
            </>
          )}
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </div>
      {expanded && (
        <div style={{ padding:'16px 18px' }}>
          {editing ? (
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="legal-input" style={{ width:'100%', minHeight:300, fontSize:12, marginBottom:14, fontFamily:'JetBrains Mono,monospace' }} />
          ) : (
            <div className="draft-output" style={{ maxHeight:380, overflowY:'auto', fontSize:12, marginBottom:14 }}>{content}</div>
          )}
          {!editing && precedents?.length > 0 && (
            <div>
              <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Cited Precedents</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {precedents.slice(0,4).map((p,i) => (
                  <div key={i} style={{ padding:'8px 12px', background:'var(--bg-card)', borderRadius:7, border:'1px solid var(--border)', fontSize:12 }}>
                    <div style={{ color:'var(--gold)', fontWeight:600, marginBottom:3, fontFamily:'JetBrains Mono,monospace', fontSize:11 }}>{p.citation}</div>
                    <div style={{ color:'var(--text-secondary)', lineHeight:1.5 }}>{p.principle}</div>
                    <div style={{ display:'flex', gap:6, marginTop:4 }}>
                      <span style={{ fontSize:10, color:'var(--text-muted)' }}>{p.court}</span>
                      <span className={`badge ${p.favours==='plaintiff'?'badge-success':p.favours==='defendant'?'badge-warning':'badge-info'}`} style={{ fontSize:9 }}>Favours {p.favours}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const SIDES = { petitioner:'Petitioner Arguments', respondent:'Respondent Arguments' }

export default function ArgumentPage() {
  const { isLoggedIn }    = useAuth()
  const { save, saving }  = useHistory('arguments')

  const [input, setInput]       = useState('')
  const [side, setSide]         = useState('both')
  const [loading, setLoading]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [exporting, setExporting] = useState({})
  const [histOpen, setHistOpen] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [editedArgs, setEditedArgs] = useState({})

  const generate = async () => {
    if (!input.trim()) return
    setLoading(true); setError(''); setResult(null); setEditedArgs({})
    try {
      const data = await generateArguments(input, side)
      setResult(data)
      if (isLoggedIn) {
        const args = data.result?.arguments || {}
        await save({
          raw_input:     input,
          case_type:     data.result?.case_type,
          argument_text: Object.values(args).map(a => a.argument).join('\n\n---\n\n'),
        })
        setSavedMsg('Saved'); setTimeout(() => setSavedMsg(''), 2500)
      }
    } catch(e) { setError(e.response?.data?.detail || e.message) }
    setLoading(false)
  }

  const handleArgumentUpdate = (key, content) => {
    setEditedArgs(e => ({ ...e, [key]: content }))
    setSavedMsg('Updated'); setTimeout(() => setSavedMsg(''), 2500)
  }

  const restore = (item) => { setInput(item.raw_input || ''); setHistOpen(false) }

  const download = async (key, text, sideLabel) => {
    setExporting(e => ({ ...e, [key]:true }))
    try {
      const meta = { title:`Legal Arguments — ${sideLabel}`, case_type:result?.result?.case_type||'', source:result?.result?.arguments?.[key]?.source||'template' }
      const blob = await exportPDF(text, meta)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href=url; a.download=`arguments_${sideLabel.toLowerCase()}.pdf`; a.click()
      URL.revokeObjectURL(url)
    } catch {
      const blob = new Blob([text],{type:'text/plain'})
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href=url; a.download=`arguments_${sideLabel}.txt`; a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(e => ({ ...e, [key]:false }))
  }

  return (
    <div style={{ maxWidth:900 }}>
      <div className="animate-fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, marginBottom:6 }}>
            <Scale size={22} style={{ display:'inline', marginRight:10, color:'var(--gold)' }} />
            Argument Writer
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>Generate formal court arguments with Supreme Court precedents for both sides</p>
        </div>
        <button onClick={() => setHistOpen(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-card)', color:isLoggedIn?'var(--gold)':'var(--text-muted)', fontSize:13, cursor:'pointer', transition:'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='var(--gold-dim)'}
          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
          <Clock size={14} /> History {!isLoggedIn && <span style={{ fontSize:10 }}>(login)</span>}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:24 }}>
        {/* Input */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="glass-card" style={{ padding:14 }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Quick Examples</div>
            {EXAMPLES.map(ex => (
              <button key={ex.label} onClick={() => setInput(ex.text)} style={{ display:'block', width:'100%', textAlign:'left', padding:'7px 10px', borderRadius:6, fontSize:12, background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer', marginBottom:5, transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold-dim)'; e.currentTarget.style.color='var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)' }}>
                <span style={{ color:'var(--gold)', fontWeight:600 }}>{ex.label}</span>
                <span style={{ marginLeft:6, opacity:0.6 }}>{ex.text.slice(0,48)}…</span>
              </button>
            ))}
          </div>

          <div className="glass-card" style={{ padding:14 }}>
            <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Case Description</label>
            <textarea className="legal-input" rows={7} value={input} onChange={e => setInput(e.target.value)} placeholder="Describe the case facts…" disabled={loading} />
            <div style={{ marginTop:10 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>Generate for</div>
              <div style={{ display:'flex', gap:6 }}>
                {[['both','Both'],['petitioner','Petitioner'],['respondent','Respondent']].map(([v,lbl]) => (
                  <button key={v} onClick={() => setSide(v)} style={{ flex:1, padding:'6px 4px', borderRadius:6, fontSize:11, fontWeight:500, cursor:'pointer', border:`1px solid ${side===v?'var(--gold-dim)':'var(--border)'}`, background:side===v?'rgba(212,168,67,0.12)':'var(--bg-card)', color:side===v?'var(--gold)':'var(--text-muted)', transition:'all 0.2s' }}>{lbl}</button>
                ))}
              </div>
            </div>
            <button className="btn-gold" onClick={generate} disabled={loading||!input.trim()} style={{ width:'100%', padding:'11px', borderRadius:8, fontSize:14, marginTop:12 }}>
              {loading ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><Loader size={15} style={{ animation:'spin 1s linear infinite' }} />Generating…</span> : '⚖️ Generate Arguments'}
            </button>
            {saving && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6, textAlign:'center' }}>Saving…</div>}
            {savedMsg && <div style={{ fontSize:11, color:'var(--success)', marginTop:6, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}><Save size={11} />{savedMsg}</div>}
          </div>
        </div>

        {/* Output */}
        <div>
          {error && <div style={{ display:'flex', gap:8, padding:14, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, color:'var(--error)', fontSize:13, marginBottom:16 }}><AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }} />{error}</div>}

          {!result && !loading && (
            <div style={{ height:'100%', minHeight:300, display:'flex', alignItems:'center', justifyContent:'center', border:'2px dashed var(--border)', borderRadius:12, color:'var(--text-muted)', fontSize:14, flexDirection:'column', gap:10 }}>
              <Scale size={32} color="var(--text-muted)" />
              <div>Arguments appear here</div>
              <div style={{ fontSize:12, opacity:0.6 }}>{isLoggedIn ? 'Auto-saved after generation' : 'Sign in to save history'}</div>
            </div>
          )}

          {loading && <div style={{ padding:24 }}>{[160,200,140,180,120].map((w,i)=><div key={i} className="skeleton" style={{ height:13, width:`${w}px`, marginBottom:14 }} />)}</div>}

          {result && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span className="badge badge-gold">{result.result?.case_type?.replace(/_/g,' ')}</span>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>{result.result?.precedents_db_size} precedents searched</span>
              </div>
              {Object.entries(result.result?.arguments||{}).map(([key,arg]) => (
                <ArgumentCard key={key} title={SIDES[key]||key} content={editedArgs[key] || arg.argument} precedents={arg.precedents} source={arg.source}
                  onCopy={() => navigator.clipboard.writeText(editedArgs[key] || arg.argument)}
                  onExport={() => download(key, editedArgs[key] || arg.argument, SIDES[key]||key)}
                  exporting={exporting[key]}
                  onUpdate={(content) => handleArgumentUpdate(key, content)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <HistoryPanel module="arguments" isOpen={histOpen} onClose={() => setHistOpen(false)} onRestore={restore} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
