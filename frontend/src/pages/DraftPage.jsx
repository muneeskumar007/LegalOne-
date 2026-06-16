import { useState, useRef, useEffect } from 'react'
import { generateDraft, exportPDF } from '../utils/api'
import {
  Copy, Loader, FileText, AlertCircle, Download,
  Clock, Save, Edit3, Check, X, RotateCcw, Eye, Pencil
} from 'lucide-react'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../context/AuthContext'
import HistoryPanel from '../components/HistoryPanel'

const EXAMPLES = [
  { label:'Money Recovery', text:'Karthick files a money recovery suit against Ganesh for ₹1,00,000 borrowed 1 year ago. Despite repeated demands, Ganesh has failed to repay.' },
  { label:'Cheque Bounce',  text:'Priya issued a cheque of ₹50,000 to Ravi which was returned dishonoured by the bank. A legal demand notice was sent but Priya failed to pay.' },
  { label:'Property',       text:'Suresh owns plot at 12, Anna Nagar. Ramesh has illegally encroached and is refusing to vacate despite repeated demands. Suresh seeks injunction.' },
  { label:'Consumer',       text:'Meena purchased a refrigerator worth ₹35,000. It stopped working within 2 months. The company refused to repair or replace despite complaints.' },
]

/* ─── Inline editor toolbar button ──────────────────────────────────────── */
function ToolBtn({ onClick, title, children, active, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '5px 10px', borderRadius: 5, border: 'none',
        background: active  ? 'rgba(212,168,67,0.2)'  :
                   danger  ? 'rgba(248,113,113,0.1)' : 'var(--bg-card)',
        color:    active  ? 'var(--gold)'            :
                   danger  ? 'var(--error)'           : 'var(--text-secondary)',
        cursor: 'pointer', fontSize: 12, display: 'flex',
        alignItems: 'center', gap: 5, fontWeight: 500,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {children}
    </button>
  )
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function DraftPage() {
  const { isLoggedIn }            = useAuth()
  const { save, saving }          = useHistory('draft')

  /* input state */
  const [input, setInput]         = useState('')
  const [context, setContext]     = useState('')
  const [draftType, setDraftType] = useState('petition')

  /* result state */
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')

  /* editor state */
  const [editMode, setEditMode]   = useState(false)       // show textarea editor
  const [editText, setEditText]   = useState('')          // live editable text
  const [originalText, setOriginalText] = useState('')    // to support Revert
  const [hasEdits, setHasEdits]   = useState(false)
  const [savedMsg, setSavedMsg]   = useState('')
  const [copied, setCopied]       = useState(false)
  const [exporting, setExporting] = useState(false)
  const [histOpen, setHistOpen]   = useState(false)
  const [wordCount, setWordCount] = useState(0)

  const editorRef = useRef(null)

  /* whenever result arrives, seed editText */
  useEffect(() => {
    if (result?.draft?.draft) {
      const txt = result.draft.draft
      setEditText(txt)
      setOriginalText(txt)
      setHasEdits(false)
      setEditMode(false)
      setWordCount(txt.split(/\s+/).filter(Boolean).length)
    }
  }, [result])

  /* track word count live while editing */
  useEffect(() => {
    setWordCount(editText.split(/\s+/).filter(Boolean).length)
    setHasEdits(editText !== originalText)
  }, [editText, originalText])

  /* ── generate ─────────────────────────────────────────────────────────── */
  const generate = async () => {
    if (!input.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await generateDraft(input, context, draftType)
      setResult(data)
      if (isLoggedIn) {
        await save({
          raw_input:      input,
          plaintiff_name: data.facts?.plaintiff_name,
          defendant_name: data.facts?.defendant_name,
          amount:         data.facts?.amount,
          case_type:      data.classification?.case_label,
          court:          data.classification?.court,
          draft_text:     data.draft?.draft,
          draft_source:   data.draft?.source,
        })
        setSavedMsg('Saved to history')
        setTimeout(() => setSavedMsg(''), 3000)
      }
    } catch(e) { setError(e.response?.data?.detail || e.message) }
    setLoading(false)
  }

  /* ── editor actions ───────────────────────────────────────────────────── */
  const enterEditMode = () => { setEditMode(true); setTimeout(() => editorRef.current?.focus(), 50) }

  const saveEdits = async () => {
    setEditMode(false)
    // persist to history if logged in
    if (isLoggedIn && result) {
      await save({
        raw_input:    input,
        draft_text:   editText,
        draft_source: result.draft?.source,
        case_type:    result.classification?.case_label,
        court:        result.classification?.court,
      })
      setSavedMsg('Edited draft saved')
      setTimeout(() => setSavedMsg(''), 3000)
    }
  }

  const discardEdits = () => { setEditText(originalText); setEditMode(false); setHasEdits(false) }
  const revertToOriginal = () => { setEditText(originalText); setHasEdits(false) }

  const copy = () => {
    navigator.clipboard.writeText(editText)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  /* ── PDF download — only the draft content ────────────────────────────── */
  const download = async () => {
    if (!editText.trim()) return
    setExporting(true)
    try {
      /* Pass only minimal metadata — pdf_export.py no longer adds branding/table/copyright */
      const meta = {
        title:          `${draftType === 'petition' ? 'Petition' : 'Counter Statement'}`,
        case_type:      result?.classification?.case_label || '',
        advocate_name:  '',   // intentionally blank — no system name in PDF
      }
      const blob = await exportPDF(editText, meta)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      const pname = result?.facts?.plaintiff_name?.replace(/\s+/g,'_') || 'petition'
      a.download = `${pname}_${draftType}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* plain text fallback */
      const blob = new Blob([editText], { type: 'text/plain' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url; a.download = 'draft.txt'; a.click()
      URL.revokeObjectURL(url)
    }
    setExporting(false)
  }

  const restore = (item) => { setInput(item.raw_input || ''); setHistOpen(false) }

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 960 }}>

      {/* Page header */}
      <div className="animate-fade-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, marginBottom:6 }}>
            <FileText size={22} style={{ display:'inline', marginRight:10, color:'var(--gold)' }} />
            Draft Generator
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:13 }}>
            Generate a legal petition · edit inline · download clean PDF
          </p>
        </div>
        <button onClick={() => setHistOpen(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-card)', color:isLoggedIn?'var(--gold)':'var(--text-muted)', fontSize:13, cursor:'pointer', transition:'border-color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor='var(--gold-dim)'}
          onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
          <Clock size={14} /> History {!isLoggedIn && <span style={{ fontSize:10 }}>(login)</span>}
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:24 }}>

        {/* ── LEFT: input panel ─────────────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Examples */}
          <div className="glass-card" style={{ padding:14 }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Quick Examples</div>
            {EXAMPLES.map(ex => (
              <button key={ex.label} onClick={() => setInput(ex.text)} style={{ display:'block', width:'100%', textAlign:'left', padding:'7px 10px', borderRadius:6, fontSize:12, background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer', marginBottom:5, transition:'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold-dim)'; e.currentTarget.style.color='var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)';   e.currentTarget.style.color='var(--text-secondary)' }}>
                <span style={{ color:'var(--gold)', fontWeight:600 }}>{ex.label}</span>
                <span style={{ marginLeft:8, opacity:0.7 }}>{ex.text.slice(0,55)}…</span>
              </button>
            ))}
          </div>

          {/* Input form */}
          <div className="glass-card" style={{ padding:16 }}>
            <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.05em' }}>Case Description *</label>
            <textarea className="legal-input" rows={6} value={input} onChange={e => setInput(e.target.value)}
              placeholder="Describe the facts in plain language…" disabled={loading} />

            <label style={{ fontSize:11, color:'var(--text-muted)', display:'block', margin:'11px 0 5px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Additional Context</label>
            <textarea className="legal-input" rows={2} value={context} onChange={e => setContext(e.target.value)}
              placeholder="Court name, specific reliefs…" disabled={loading} style={{ resize:'none' }} />

            {/* Petition / Counter toggle */}
            <div style={{ display:'flex', gap:7, margin:'11px 0' }}>
              {[['petition','📋 Petition'],['counter','⚖️ Counter']].map(([t,lbl]) => (
                <button key={t} onClick={() => setDraftType(t)} style={{ flex:1, padding:'8px', borderRadius:6, fontSize:13, fontWeight:500, cursor:'pointer', border:`1px solid ${draftType===t?'var(--gold-dim)':'var(--border)'}`, background:draftType===t?'rgba(212,168,67,0.12)':'var(--bg-card)', color:draftType===t?'var(--gold)':'var(--text-muted)', transition:'all 0.2s' }}>
                  {lbl}
                </button>
              ))}
            </div>

            <button className="btn-gold" onClick={generate} disabled={loading||!input.trim()} style={{ width:'100%', padding:'12px', borderRadius:8, fontSize:14 }}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <Loader size={15} style={{ animation:'spin 1s linear infinite' }} />Generating…
                  </span>
                : '⚡ Generate Draft'}
            </button>

            {saving  && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6, textAlign:'center' }}>Saving…</div>}
            {savedMsg && <div style={{ fontSize:11, color:'var(--success)', marginTop:6, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}><Save size={11} />{savedMsg}</div>}
          </div>

          {/* Facts extracted mini-card */}
          {result?.facts && (
            <div className="glass-card" style={{ padding:14 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Extracted Facts</div>
              {[['Plaintiff',result.facts.plaintiff_name],['Defendant',result.facts.defendant_name],['Amount',result.facts.amount],['Court',result.classification?.court]].filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{ display:'flex', gap:8, marginBottom:5 }}>
                  <span style={{ fontSize:11, color:'var(--text-muted)', minWidth:60 }}>{k}</span>
                  <span style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: output panel ───────────────────────────────────────── */}
        <div>
          {error && (
            <div style={{ display:'flex', gap:8, padding:14, background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.2)', borderRadius:8, color:'var(--error)', fontSize:13, marginBottom:14 }}>
              <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }} />{error}
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div style={{ height:'100%', minHeight:400, display:'flex', alignItems:'center', justifyContent:'center', border:'2px dashed var(--border)', borderRadius:12, color:'var(--text-muted)', fontSize:14, flexDirection:'column', gap:10 }}>
              <FileText size={36} color="var(--text-muted)" />
              <div>Generated petition will appear here</div>
              <div style={{ fontSize:12, opacity:0.6 }}>{isLoggedIn ? 'Auto-saved · editable · downloadable as PDF' : 'Sign in to save history'}</div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div style={{ padding:24 }}>
              {[220,160,240,140,190,160,200].map((w,i) => (
                <div key={i} className="skeleton" style={{ height:13, width:`${w}px`, marginBottom:14 }} />
              ))}
            </div>
          )}

          {/* Draft output */}
          {result && editText && (
            <div style={{ display:'flex', flexDirection:'column', gap:0 }}>

              {/* ── Toolbar ─────────────────────────────────────────────── */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 14px', background:'var(--bg-secondary)',
                border:'1px solid var(--border)', borderRadius:'10px 10px 0 0',
                flexWrap:'wrap', gap:8,
              }}>
                {/* Left: status badges */}
                <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                  <span className={`badge ${result.draft?.source==='ollama_llm'?'badge-success':'badge-warning'}`} style={{ fontSize:10 }}>
                    {result.draft?.source==='ollama_llm'?'🤖 AI':'📋 Template'}
                  </span>
                  <span className="badge badge-info" style={{ fontSize:10 }}>{result.classification?.case_label?.slice(0,20)}</span>
                  {hasEdits && <span className="badge badge-warning" style={{ fontSize:10 }}>✏ Edited</span>}
                  <span style={{ fontSize:11, color:'var(--text-muted)' }}>{wordCount} words</span>
                </div>

                {/* Right: action buttons */}
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {!editMode ? (
                    <>
                      {/* Edit button */}
                      <ToolBtn onClick={enterEditMode} title="Edit draft" active>
                        <Pencil size={12} /> Edit
                      </ToolBtn>

                      {/* Revert (only if edited) */}
                      {hasEdits && (
                        <ToolBtn onClick={revertToOriginal} title="Revert to original">
                          <RotateCcw size={12} /> Revert
                        </ToolBtn>
                      )}

                      {/* Copy */}
                      <ToolBtn onClick={copy} title="Copy to clipboard">
                        <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
                      </ToolBtn>

                      {/* Download PDF */}
                      <button
                        onClick={download}
                        disabled={exporting}
                        title="Download as PDF (case content only)"
                        style={{
                          display:'flex', alignItems:'center', gap:6,
                          padding:'5px 12px', borderRadius:6, border:'none',
                          background:'linear-gradient(135deg,var(--gold),var(--gold-dim))',
                          color:'#0f0d0a', fontSize:12, fontWeight:600,
                          cursor: exporting?'not-allowed':'pointer',
                          opacity: exporting?0.6:1, transition:'all 0.2s',
                        }}>
                        <Download size={12} /> {exporting ? 'Exporting…' : 'Download PDF'}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Save edits */}
                      <ToolBtn onClick={saveEdits} title="Save edits" active>
                        <Check size={13} /> Save Edits
                      </ToolBtn>
                      {/* Discard edits */}
                      <ToolBtn onClick={discardEdits} title="Discard changes" danger>
                        <X size={13} /> Discard
                      </ToolBtn>
                    </>
                  )}
                </div>
              </div>

              {/* ── Edit mode notice ──────────────────────────────────── */}
              {editMode && (
                <div style={{
                  padding:'8px 14px',
                  background:'rgba(212,168,67,0.08)',
                  border:'1px solid rgba(212,168,67,0.25)',
                  borderTop:'none',
                  fontSize:12, color:'var(--gold)',
                  display:'flex', alignItems:'center', gap:7,
                }}>
                  <Edit3 size={12} />
                  Editing mode — make your changes then click <strong style={{ marginLeft:4 }}>Save Edits</strong> to confirm
                </div>
              )}

              {/* ── Editor / Viewer ────────────────────────────────────── */}
              {editMode ? (
                /* Editable textarea — full height */
                <textarea
                  ref={editorRef}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 560,
                    padding: '20px 22px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 13,
                    lineHeight: 1.8,
                    color: 'var(--text-primary)',
                    background: '#0f0d0a',
                    border: '1px solid var(--gold-dim)',
                    borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    resize: 'vertical',
                    outline: 'none',
                    boxShadow: 'inset 0 0 0 2px rgba(212,168,67,0.08)',
                    boxSizing: 'border-box',
                  }}
                  spellCheck={false}
                />
              ) : (
                /* Read-only formatted view */
                <div
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 13,
                    lineHeight: 1.85,
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-secondary)',
                    background: '#0d0b09',
                    border: '1px solid var(--border)',
                    borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    padding: '20px 22px',
                    maxHeight: 560,
                    overflowY: 'auto',
                  }}
                >
                  {editText}
                </div>
              )}

              {/* ── Bottom hint ────────────────────────────────────────── */}
              <div style={{ marginTop:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                  {editMode
                    ? '✏ You are editing — changes are not saved until you click Save Edits'
                    : hasEdits
                      ? '✅ Your edits are applied — download PDF will use edited version'
                      : '💡 Click Edit to customise the draft before downloading'}
                </div>
                {result.draft?.note && (
                  <div style={{ fontSize:11, color:'var(--warning)', maxWidth:260, textAlign:'right' }}>⚠ {result.draft.note}</div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      <HistoryPanel module="draft" isOpen={histOpen} onClose={() => setHistOpen(false)} onRestore={restore} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
