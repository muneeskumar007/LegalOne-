/**
 * ValidatePanel — reusable component that renders validation results.
 * Used in both ValidatePage and as an inline panel after draft generation.
 */
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

const SEV_COLOR  = { critical:'var(--error)', high:'var(--warning)', medium:'var(--info)', low:'var(--text-muted)' }
const SEV_CLASS  = { critical:'badge-error',  high:'badge-warning',  medium:'badge-info',  low:'badge-gold' }
const SEV_ICONS  = { critical: XCircle, high: AlertTriangle, medium: Info, low: Info }

export default function ValidatePanel({ validation }) {
  if (!validation) return null
  const { quality_score, sections_present = [], sections_missing = [], warnings = [], advocate_notes = [], statistics = {} } = validation
  const color = quality_score >= 80 ? 'var(--success)' : quality_score >= 60 ? 'var(--warning)' : 'var(--error)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Score row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', minWidth: 64 }}>
          <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 36, fontWeight: 700, color, lineHeight: 1 }}>{quality_score}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>/ 100</div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="progress-bar" style={{ marginBottom: 8 }}>
            <div className="progress-fill" style={{ width: `${quality_score}%`, background: `linear-gradient(90deg, ${color}, ${color})` }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className={`badge ${quality_score >= 60 ? 'badge-success' : 'badge-error'}`} style={{ fontSize: 10 }}>
              {quality_score >= 60 ? '✓ Valid' : '✗ Incomplete'}
            </span>
            <span className="badge badge-info" style={{ fontSize: 10 }}>{statistics.word_count || 0} words</span>
            <span className="badge badge-gold" style={{ fontSize: 10 }}>{sections_present.length}/{sections_present.length + sections_missing.length} sections</span>
          </div>
        </div>
      </div>

      {/* Sections */}
      {(sections_present.length > 0 || sections_missing.length > 0) && (
        <div style={{ padding: '14px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Section Checklist
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {sections_present.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 5, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.12)', fontSize: 12 }}>
                <CheckCircle size={11} color="var(--success)" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              </div>
            ))}
            {sections_missing.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 5, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.12)', fontSize: 12 }}>
                <XCircle size={11} color="var(--error)" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                <span className={`badge ${SEV_CLASS[s.severity]}`} style={{ fontSize: 9, marginLeft: 'auto' }}>{s.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ padding: '14px 16px', background: 'var(--bg-card)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Warnings ({warnings.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {warnings.slice(0, 6).map((w, i) => {
              const Icon = SEV_ICONS[w.severity] || Info
              return (
                <div key={i} style={{ padding: '9px 11px', borderRadius: 7, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Icon size={12} color={SEV_COLOR[w.severity]} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ color: 'var(--text-primary)', marginBottom: w.suggestion ? 3 : 0 }}>{w.message}</div>
                      {w.suggestion && <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>💡 {w.suggestion}</div>}
                    </div>
                    <span className={`badge ${SEV_CLASS[w.severity]}`} style={{ fontSize: 9, marginLeft: 'auto', flexShrink: 0 }}>{w.severity}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Advocate notes */}
      {advocate_notes.length > 0 && (
        <div style={{ padding: '12px 14px', background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            ⚖️ Advocate Review Notes
          </div>
          {advocate_notes.map((n, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5, paddingLeft: 10, borderLeft: '2px solid rgba(212,168,67,0.3)', lineHeight: 1.5 }}>
              {n}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
