import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Star, StarOff, Trash2, Eye, Search,
  Filter, Download, Copy, RefreshCw, Scale, BarChart2,
  CheckCircle2, Clock, Landmark, AlertCircle, X,
  ChevronRight, BookOpen, ArrowLeft,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/* ── helpers ─────────────────────────────────────────────────────────────── */
function fmt(isoStr) {
  if (!isoStr) return '—'
  const d = new Date(isoStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function parseNotes(notesStr) {
  try { return JSON.parse(notesStr || '{}') } catch { return {} }
}

function ScoreBadge({ value, label, color }) {
  const clr = color || (value >= 80 ? '#16a34a' : value >= 50 ? '#d97706' : '#dc2626')
  const bg  = color ? `${color}18` : (value >= 80 ? '#dcfce7' : value >= 50 ? '#fef3c7' : '#fee2e2')
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '10px 16px', borderRadius: 10,
      background: bg, border: `1px solid ${clr}30`, minWidth: 80,
    }}>
      <span style={{ fontSize: 20, fontWeight: 800, color: clr, lineHeight: 1 }}>{value}%</span>
      <span style={{ fontSize: 10.5, color: clr, marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</span>
    </div>
  )
}

function SourceBadge({ source }) {
  const isAI = source && source.includes('ollama')
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20,
      background: isAI ? '#eff6ff' : '#f8fafc',
      border: `1px solid ${isAI ? '#bfdbfe' : '#e2e8f0'}`,
      color: isAI ? '#1d4ed8' : '#64748b',
      fontSize: 10.5, fontWeight: 600,
    }}>
      {isAI ? '🤖 AI Generated' : '📋 Template'}
    </span>
  )
}

/* ── Detail Drawer ───────────────────────────────────────────────────────── */
function DetailDrawer({ item, onClose, onStar, onDelete }) {
  const notes = parseNotes(item?.notes)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(item.draft_text || '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const handleDownload = () => {
    const blob = new Blob([item.draft_text || ''], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${item.title || 'draft'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!item) return null

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        zIndex: 400, backdropFilter: 'blur(2px)',
      }} />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: Math.min(680, window.innerWidth - 40),
        background: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
        zIndex: 401, display: 'flex', flexDirection: 'column',
        animation: 'slideIn 0.22s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, borderRadius: 6, marginTop: 2,
          }}>
            <X size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {item.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={11} /> {fmt(item.created_at)}
              <SourceBadge source={item.draft_source} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleCopy} title="Copy draft" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
              color: copied ? '#16a34a' : 'var(--text-secondary)', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500,
            }}>
              <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleDownload} title="Download" style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 5, fontWeight: 500,
            }}>
              <Download size={13} /> Download
            </button>
          </div>
        </div>

        {/* Score strip */}
        <div style={{
          padding: '14px 22px', borderBottom: '1px solid var(--border)',
          display: 'flex', gap: 10, flexWrap: 'wrap',
        }}>
          <ScoreBadge value={notes.completeness_score ?? item.validation_score ?? 0} label="Completeness" />
          <ScoreBadge value={notes.legal_accuracy ?? item.validation_score ?? 0} label="Legal Accuracy" />
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 16px', borderRadius: 10,
            background: 'var(--bg-card)', border: '1px solid var(--border)', minWidth: 80,
          }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {notes.word_count ?? '—'}
            </span>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Words</span>
          </div>
          {notes.ground && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '10px 16px', borderRadius: 10,
              background: '#faf5ff', border: '1px solid #e9d5ff', minWidth: 80,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', lineHeight: 1, textTransform: 'capitalize' }}>
                {notes.ground}
              </span>
              <span style={{ fontSize: 10.5, color: '#7c3aed', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>Ground</span>
            </div>
          )}
        </div>

        {/* Meta info */}
        <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {item.plaintiff_name && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Petitioner</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{item.plaintiff_name}</div>
            </div>
          )}
          {item.defendant_name && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Respondent</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{item.defendant_name}</div>
            </div>
          )}
          {item.court && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Court</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{item.court}</div>
            </div>
          )}
        </div>

        {/* Draft text */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
            Generated Draft
          </div>
          <pre style={{
            fontFamily: "'Courier New', monospace", fontSize: 12.5,
            color: 'var(--text-primary)', lineHeight: 1.7,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '16px 18px', margin: 0,
          }}>
            {item.draft_text || 'No draft text available.'}
          </pre>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '12px 22px', borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button onClick={() => onStar(item)} style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            padding: '8px 14px', cursor: 'pointer',
            color: item.is_starred ? '#d97706' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500,
          }}>
            {item.is_starred ? <Star size={14} fill="#d97706" /> : <StarOff size={14} />}
            {item.is_starred ? 'Starred' : 'Add Star'}
          </button>
          <button onClick={() => { onDelete(item.id); onClose() }} style={{
            background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
            padding: '8px 14px', cursor: 'pointer',
            color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 500,
          }}>
            <Trash2 size={14} /> Delete Draft
          </button>
        </div>
      </div>
    </>
  )
}

/* ── Case Card ───────────────────────────────────────────────────────────── */
function CaseCard({ item, onClick, onStar, onDelete }) {
  const notes = parseNotes(item.notes)
  const score = notes.completeness_score ?? item.validation_score ?? 0
  const accuracy = notes.legal_accuracy ?? item.validation_score ?? 0
  const scoreColor = score >= 80 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 14, padding: '18px 20px',
        cursor: 'pointer', transition: 'all 0.18s ease',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--text-muted)'
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* Star badge */}
      {item.is_starred && (
        <div style={{ position: 'absolute', top: 14, right: 14 }}>
          <Star size={14} fill="#d97706" color="#d97706" />
        </div>
      )}

      {/* Title + meta */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Scale size={16} color="var(--text-secondary)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 4 }}>
            {item.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={10} /> {fmt(item.created_at)}
            </span>
            <SourceBadge source={item.draft_source} />
            {notes.ground && (
              <span style={{
                fontSize: 10.5, fontWeight: 600, padding: '1px 7px',
                borderRadius: 20, background: '#faf5ff', color: '#7c3aed',
                border: '1px solid #e9d5ff', textTransform: 'capitalize',
              }}>{notes.ground}</span>
            )}
          </div>
        </div>
      </div>

      {/* Parties */}
      {(item.plaintiff_name || item.defendant_name) && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.plaintiff_name}</span>
          {item.defendant_name && <><span style={{ color: 'var(--text-muted)' }}>vs</span><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.defendant_name}</span></>}
        </div>
      )}

      {/* Score row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
        {/* Completeness bar */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Completeness</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: scoreColor }}>{score}%</span>
          </div>
          <div style={{ height: 5, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
        </div>
        {/* Legal accuracy bar */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Legal Accuracy</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: accuracy >= 80 ? '#16a34a' : accuracy >= 50 ? '#d97706' : '#dc2626' }}>{accuracy}%</span>
          </div>
          <div style={{ height: 5, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${accuracy}%`, height: '100%', background: accuracy >= 80 ? '#16a34a' : accuracy >= 50 ? '#d97706' : '#dc2626', borderRadius: 3, transition: 'width 0.5s ease' }} />
          </div>
        </div>
        {notes.word_count && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingLeft: 4 }}>
            {notes.word_count} words
          </div>
        )}
      </div>

      {/* Actions row */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => onStar(item)} title={item.is_starred ? 'Unstar' : 'Star'} style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 7,
          padding: '5px 8px', cursor: 'pointer',
          color: item.is_starred ? '#d97706' : 'var(--text-muted)',
        }}>
          {item.is_starred ? <Star size={13} fill="#d97706" /> : <StarOff size={13} />}
        </button>
        <button onClick={() => onClick()} title="View draft" style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 7,
          padding: '5px 8px', cursor: 'pointer', color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 500,
        }}>
          <Eye size={12} /> View
        </button>
        <button onClick={() => onDelete(item.id)} title="Delete" style={{
          background: 'none', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7,
          padding: '5px 8px', cursor: 'pointer', color: '#dc2626',
        }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function MyCasesPage() {
  const navigate  = useNavigate()
  const { isLoggedIn, advocate, authApi } = useAuth()

  const [cases,    setCases]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')   // all|starred|draft
  const [selected, setSelected] = useState(null)    // item for drawer
  const [stats,    setStats]    = useState(null)

  /* ── Load data ─────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    if (!isLoggedIn) return
    setLoading(true); setError('')
    try {
      const [histRes, statsRes] = await Promise.all([
        authApi.get('/history', { params: { module: filter === 'draft' ? 'draft' : undefined, starred: filter === 'starred' ? true : undefined, search: search || undefined, limit: 50 } }),
        authApi.get('/history/stats'),
      ])
      setCases(histRes.data.items || [])
      setStats(statsRes.data.stats)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load cases')
    } finally { setLoading(false) }
  }, [isLoggedIn, authApi, filter, search])

  useEffect(() => { load() }, [load])

  /* ── Actions ───────────────────────────────────────────────────── */
  const handleStar = async (item) => {
    try {
      await authApi.put(`/history/${item.id}`, { is_starred: !item.is_starred })
      setCases(prev => prev.map(c => c.id === item.id ? { ...c, is_starred: !c.is_starred } : c))
      if (selected?.id === item.id) setSelected(prev => ({ ...prev, is_starred: !prev.is_starred }))
    } catch {/* silent */}
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft? This cannot be undone.')) return
    try {
      await authApi.delete(`/history/${id}`)
      setCases(prev => prev.filter(c => c.id !== id))
      if (selected?.id === id) setSelected(null)
    } catch {/* silent */}
  }

  /* ── Not logged in ─────────────────────────────────────────────── */
  if (!isLoggedIn) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-canvas)', flexDirection: 'column', gap: 16, padding: 32,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'var(--bg-primary)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}>
        <Scale size={28} color="var(--text-muted)" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Sign in to view My Cases</div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.6 }}>
          Your drafted petitions, legal notices and case history are saved here after signing in.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => navigate('/login')} style={{
          padding: '10px 24px', background: 'var(--text-primary)', color: '#fff',
          border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}>Sign In</button>
        <button onClick={() => navigate('/signup')} style={{
          padding: '10px 24px', background: 'none', color: 'var(--text-secondary)',
          border: '1px solid var(--border)', borderRadius: 9, fontWeight: 500, fontSize: 14, cursor: 'pointer',
        }}>Create Account</button>
      </div>
    </div>
  )

  /* ── Main ──────────────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-canvas)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        :root {
          --bg-canvas: #f8f9fa; --bg-primary: #ffffff; --bg-card: #f4f4f5;
          --text-primary: #111827; --text-secondary: #374151; --text-muted: #9ca3af;
          --border: #e5e7eb;
        }
        [data-theme="dark"] {
          --bg-canvas: #111; --bg-primary: #1a1a1a; --bg-card: #222;
          --text-primary: #f1f1f1; --text-secondary: #ccc; --text-muted: #666;
          --border: #2a2a2a;
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border)',
            borderRadius: 9, padding: '8px 10px', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
          }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>My Cases</h1>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              All your drafted petitions and legal documents
            </p>
          </div>
          <button onClick={load} style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border)',
            borderRadius: 9, padding: '8px 12px', cursor: 'pointer', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* ── Stats strip ── */}
        {stats && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Drafts', value: stats.total, icon: <FileText size={16} />, color: '#1d4ed8' },
              { label: 'AI Drafts', value: stats.modules?.draft ?? 0, icon: <BookOpen size={16} />, color: '#7c3aed' },
              { label: 'Starred', value: stats.starred, icon: <Star size={16} />, color: '#d97706' },
            ].map(s => (
              <div key={s.label} style={{
                flex: '1 1 140px', background: 'var(--bg-primary)',
                border: '1px solid var(--border)', borderRadius: 12,
                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ color: s.color }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, fontWeight: 600 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Search + Filters ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, petitioner, respondent…"
              style={{
                width: '100%', padding: '10px 14px 10px 34px',
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: 9, fontSize: 13, color: 'var(--text-primary)', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--text-muted)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          {['all', 'starred', 'draft'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '9px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer', border: '1px solid var(--border)',
              background: filter === f ? 'var(--text-primary)' : 'var(--bg-primary)',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              textTransform: 'capitalize', transition: 'all 0.15s',
            }}>
              {f === 'all' ? 'All Cases' : f === 'starred' ? '⭐ Starred' : 'Drafts'}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 16,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <div style={{ fontSize: 14 }}>Loading cases…</div>
          </div>
        ) : cases.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--bg-primary)', borderRadius: 16,
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <FileText size={24} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>No cases yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, margin: '0 auto 20px', lineHeight: 1.6 }}>
              Generate a draft in AI Drafter and it will be saved here automatically.
            </div>
            <button onClick={() => navigate('/draft')} style={{
              padding: '10px 22px', background: 'var(--text-primary)', color: '#fff',
              border: 'none', borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>
              Go to AI Drafter
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {cases.map(item => (
              <CaseCard
                key={item.id}
                item={item}
                onClick={() => setSelected(item)}
                onStar={handleStar}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <DetailDrawer
          item={selected}
          onClose={() => setSelected(null)}
          onStar={handleStar}
          onDelete={handleDelete}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
