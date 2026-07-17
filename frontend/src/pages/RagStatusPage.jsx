/**
 * RagStatusPage.jsx
 * Place this file at: legalone/frontend/src/pages/RagStatusPage.jsx
 *
 * Shows which RAG index is active, allows testing retrieval,
 * and lets admin hot-reload the index after adding new judgments.
 */

import { useState, useEffect } from 'react'
import { Database, Search, RefreshCw, CheckCircle, AlertCircle, Loader, Zap } from 'lucide-react'
import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 60000 })

export default function RagStatusPage() {
  const [status,    setStatus]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState(null)
  const [searching, setSearching] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [reloadMsg, setReloadMsg] = useState('')

  // Load status on mount
  useEffect(() => { loadStatus() }, [])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/rag-status')
      setStatus(data)
    } catch(e) {
      setStatus({ success: false, error: e.message })
    }
    setLoading(false)
  }

  const testRetrieval = async () => {
    if (!query.trim()) return
    setSearching(true); setResults(null)
    try {
      const { data } = await api.post('/rag-test', { query, top_k: 5 })
      setResults(data)
    } catch(e) {
      setResults({ success: false, error: e.message })
    }
    setSearching(false)
  }

  const reloadIndex = async () => {
    setReloading(true); setReloadMsg('')
    try {
      const { data } = await api.post('/rag-reload')
      setReloadMsg(data.message)
      await loadStatus()
    } catch(e) {
      setReloadMsg('Reload failed: ' + e.message)
    }
    setReloading(false)
  }

  const isReal = status?.active_index === 'real_dataset'

  return (
    <div style={{ maxWidth: 860 }}>

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily:'Playfair Display,serif', fontSize:24, fontWeight:700, marginBottom:6 }}>
          <Database size={22} style={{ display:'inline', marginRight:10, color:'var(--gold)' }} />
          RAG Dataset Status
        </h2>
        <p style={{ color:'var(--text-muted)', fontSize:13 }}>
          Monitor which legal knowledge index is powering your AI drafts
        </p>
      </div>

      {/* Status card */}
      <div className="glass-card animate-fade-up" style={{ padding:20, marginBottom:20 }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text-muted)', fontSize:13 }}>
            <Loader size={16} style={{ animation:'spin 1s linear infinite' }} /> Loading index status…
          </div>
        ) : status?.success === false ? (
          <div style={{ color:'var(--error)', fontSize:13 }}>
            <AlertCircle size={15} style={{ display:'inline', marginRight:6 }} />
            Could not fetch RAG status: {status?.error}
          </div>
        ) : (
          <div>
            {/* Active index banner */}
            <div style={{
              display:'flex', alignItems:'center', gap:12, padding:'14px 16px',
              borderRadius:10, marginBottom:16,
              background: isReal ? 'rgba(74,222,128,0.08)' : 'rgba(251,146,60,0.08)',
              border: `1px solid ${isReal ? 'rgba(74,222,128,0.2)' : 'rgba(251,146,60,0.2)'}`,
            }}>
              {isReal
                ? <CheckCircle size={20} color="var(--success)" />
                : <AlertCircle size={20} color="var(--warning)" />
              }
              <div>
                <div style={{ fontWeight:600, fontSize:14,
                  color: isReal ? 'var(--success)' : 'var(--warning)' }}>
                  {isReal ? '✓ Using Real Dataset' : '⚠ Using Built-in Corpus'}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                  {status?.message}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { label:'Active Index',       value: status?.active_index,    color:'var(--info)'    },
                { label:'Principles Indexed', value: status?.active_size,     color:'var(--gold)'    },
                { label:'Built-in Fallback',  value: status?.builtin_corpus_size + ' provisions', color:'var(--text-muted)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding:'12px 14px', background:'var(--bg-card)', borderRadius:8, border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:16, fontWeight:600, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Path */}
            {status?.real_dataset_path && (
              <div style={{ marginTop:12, padding:'8px 12px', background:'var(--bg-card)', borderRadius:6, fontSize:11, color:'var(--text-muted)', fontFamily:'JetBrains Mono,monospace' }}>
                Index path: {status.real_dataset_path}
              </div>
            )}

            {/* Reload button */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14 }}>
              <button
                onClick={reloadIndex}
                disabled={reloading}
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  padding:'8px 16px', borderRadius:7,
                  border:'1px solid var(--border)',
                  background:'var(--bg-card)',
                  color:'var(--text-secondary)',
                  fontSize:13, cursor:'pointer',
                  opacity: reloading ? 0.6 : 1
                }}
              >
                <RefreshCw size={13} style={{ animation: reloading ? 'spin 1s linear infinite' : 'none' }} />
                {reloading ? 'Reloading…' : 'Reload Index'}
              </button>
              {reloadMsg && (
                <span style={{ fontSize:12, color:'var(--success)' }}>✓ {reloadMsg}</span>
              )}
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>
                Use after adding new judgment PDFs to dataset
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Test retrieval */}
      <div className="glass-card animate-fade-up delay-100" style={{ padding:20, marginBottom:20 }}>
        <div style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:600, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <Search size={15} color="var(--gold)" /> Test Retrieval
        </div>
        <div style={{ display:'flex', gap:10, marginBottom: results ? 16 : 0 }}>
          <input
            className="legal-input"
            style={{ fontSize:13 }}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. divorce mental cruelty husband, cheque bounce section 138 presumption…"
            onKeyDown={e => e.key === 'Enter' && testRetrieval()}
          />
          <button
            onClick={testRetrieval}
            disabled={searching || !query.trim()}
            className="btn-gold"
            style={{ padding:'10px 20px', borderRadius:8, fontSize:13, whiteSpace:'nowrap' }}
          >
            {searching
              ? <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> Searching…
                </span>
              : <><Zap size={13} style={{ display:'inline', marginRight:5 }} />Search</>
            }
          </button>
        </div>

        {results?.success && (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              Top {results.results?.length} results
            </div>
            {results.results?.map((r, i) => (
              <div key={i} style={{
                padding:'12px 14px', borderRadius:8,
                background:'var(--bg-card)', border:'1px solid var(--border)'
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11,
                      background:'var(--bg-secondary)', padding:'2px 7px', borderRadius:4,
                      color:'var(--gold)', fontWeight:600 }}>
                      #{r.rank} [{r.score?.toFixed(3)}]
                    </span>
                    {r.case_name && (
                      <span style={{ fontSize:12, color:'var(--text-primary)', fontWeight:500 }}>
                        {r.case_name}
                      </span>
                    )}
                    {r.court && (
                      <span style={{ fontSize:11, color:'var(--text-muted)' }}>{r.court}</span>
                    )}
                  </div>
                  <span className={`badge ${r.source === 'real_dataset' ? 'badge-success' : 'badge-info'}`} style={{ fontSize:9, flexShrink:0 }}>
                    {r.source === 'real_dataset' ? '📚 Real' : '📋 Built-in'}
                  </span>
                </div>
                {r.principle && (
                  <div style={{ fontSize:13, color:'var(--text-primary)', fontWeight:500, marginBottom:4 }}>
                    {r.principle}
                  </div>
                )}
                {r.text && (
                  <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>
                    {r.text}
                  </div>
                )}
                {r.act && (
                  <div style={{ fontSize:11, color:'var(--gold)', marginTop:5 }}>
                    {r.act} {r.section && `— ${r.section}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {results?.success === false && (
          <div style={{ color:'var(--error)', fontSize:13, marginTop:10 }}>
            Error: {results.error}
          </div>
        )}
      </div>

      {/* How to upgrade */}
      {!isReal && !loading && (
        <div style={{ padding:'16px 18px', background:'rgba(212,168,67,0.06)', border:'1px solid rgba(212,168,67,0.2)', borderRadius:10 }}>
          <div style={{ fontSize:12, color:'var(--gold)', fontWeight:600, marginBottom:8 }}>
            ⚡ How to upgrade to real dataset
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {[
              '1. Run the pipeline: python3 run_pipeline.py --step 5',
              '2. Copy files: cp dataset/faiss_index/legal_rag.* legalone/dataset/faiss_index/',
              '3. Click "Reload Index" button above — no restart needed',
            ].map((step, i) => (
              <div key={i} style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'JetBrains Mono,monospace' }}>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
