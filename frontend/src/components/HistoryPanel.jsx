import { useState, useEffect } from 'react'
import { Clock, Star, Trash2, X, Search, ChevronRight, FileText, RotateCcw } from 'lucide-react'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../context/AuthContext'

const MODULE_LABELS = {
  pipeline:  '🔗 Pipeline',
  draft:     '📋 Draft',
  arguments: '⚖️ Arguments',
  validate:  '✅ Validate',
  compare:   '🔀 Compare',
}

const MODULE_COLORS = {
  pipeline:  'var(--gold)',
  draft:     'var(--info)',
  arguments: 'var(--warning)',
  validate:  'var(--success)',
  compare:   'var(--error)',
}

function TimeAgo({ iso }) {
  if (!iso) return null
  const d    = new Date(iso)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60)   return <span>{diff}s ago</span>
  if (diff < 3600) return <span>{Math.floor(diff/60)}m ago</span>
  if (diff < 86400)return <span>{Math.floor(diff/3600)}h ago</span>
  return <span>{Math.floor(diff/86400)}d ago</span>
}

export default function HistoryPanel({ module, onRestore, isOpen, onClose }) {
  const { isLoggedIn } = useAuth()
  const { load, remove, toggleStar, items, loading } = useHistory(module)
  const [search, setSearch] = useState('')
  const [starredOnly, setStarredOnly] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      load({ search: search || undefined, starred: starredOnly || undefined })
    }
  }, [isOpen, isLoggedIn, search, starredOnly])

  const handleDelete = async (id) => {
    setDeleting(id)
    await remove(id)
    setDeleting(null)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100 }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
        background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border)',
        zIndex: 101, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
        animation: 'slideInRight 0.25s ease'
      }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 16, fontWeight: 600 }}>
              <Clock size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--gold)' }} />
              Case History
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {MODULE_LABELS[module] || module} — {items.length} saved
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {!isLoggedIn ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, padding: 24 }}>
            <FileText size={36} color="var(--text-muted)" />
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Sign in to save and view case history</div>
            <a href="/login" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>Sign In →</a>
          </div>
        ) : (
          <>
            {/* Search + filter bar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="legal-input"
                  style={{ paddingLeft: 30, fontSize: 13, height: 34 }}
                  placeholder="Search cases…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button
                onClick={() => setStarredOnly(s => !s)}
                style={{
                  padding: '0 12px', borderRadius: 7, border: '1px solid var(--border)', background: starredOnly ? 'rgba(212,168,67,0.15)' : 'var(--bg-card)',
                  color: starredOnly ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5
                }}
              >
                <Star size={13} fill={starredOnly ? 'var(--gold)' : 'none'} />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {loading && (
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 8 }} />)}
                </div>
              )}

              {!loading && items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                  <Clock size={28} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <div style={{ fontSize: 14 }}>No saved cases yet</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>Run the tool and results will be auto-saved here</div>
                </div>
              )}

              {!loading && items.map(item => (
                <div key={item.id} style={{
                  margin: '0 10px 6px', padding: '12px 14px', borderRadius: 9,
                  background: expandedId === item.id ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  border: `1px solid ${item.is_starred ? 'rgba(212,168,67,0.3)' : 'var(--border)'}`,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}>

                  {/* Item header */}
                  <div onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                        {item.title || item.raw_input?.slice(0,60)}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {item.plaintiff_name && (
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {item.plaintiff_name}{item.defendant_name ? ` vs ${item.defendant_name}` : ''}
                          </span>
                        )}
                        {item.amount && <span style={{ fontSize: 10, color: 'var(--gold)' }}>{item.amount}</span>}
                        {item.validation_score !== null && item.validation_score !== undefined && (
                          <span style={{ fontSize: 10, color: item.validation_score >= 60 ? 'var(--success)' : 'var(--warning)' }}>
                            {Math.round(item.validation_score)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        <TimeAgo iso={item.created_at} />
                      </div>
                      <ChevronRight size={12} color="var(--text-muted)" style={{ transform: expandedId === item.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expandedId === item.id && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      {/* Input preview */}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5, fontStyle: 'italic' }}>
                        "{item.raw_input?.slice(0, 120)}{item.raw_input?.length > 120 ? '…' : ''}"
                      </div>

                      {/* Draft snippet */}
                      {item.draft_text && (
                        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 5, padding: '6px 8px', marginBottom: 10, maxHeight: 60, overflow: 'hidden' }}>
                          {item.draft_text.slice(0, 150)}…
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => onRestore && onRestore(item)}
                          style={{ flex: 1, padding: '7px', borderRadius: 6, border: '1px solid var(--gold-dim)', background: 'rgba(212,168,67,0.1)', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: 500 }}
                        >
                          <RotateCcw size={11} /> Restore
                        </button>
                        <button
                          onClick={() => toggleStar(item.id, item.is_starred)}
                          style={{ padding: '7px 12px', borderRadius: 6, border: `1px solid ${item.is_starred ? 'rgba(212,168,67,0.4)' : 'var(--border)'}`, background: item.is_starred ? 'rgba(212,168,67,0.1)' : 'var(--bg-secondary)', color: item.is_starred ? 'var(--gold)' : 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
                        >
                          <Star size={12} fill={item.is_starred ? 'var(--gold)' : 'none'} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                          style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: deleting === item.id ? 'var(--text-muted)' : 'var(--error)', fontSize: 12, cursor: 'pointer' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
