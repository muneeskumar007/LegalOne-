/**
 * Shared UI primitives used across pages.
 */
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'

export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div style={{ display: 'flex', gap: 10, padding: 14, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, color: 'var(--error)', fontSize: 13, marginBottom: 16 }}>
      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <strong>Error: </strong>{message}
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Make sure backend is running: <code style={{ fontFamily: 'JetBrains Mono,monospace' }}>uvicorn main:app --reload --port 8000</code>
        </div>
      </div>
    </div>
  )
}

export function SuccessBanner({ message }) {
  if (!message) return null
  return (
    <div style={{ display: 'flex', gap: 10, padding: 12, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, color: 'var(--success)', fontSize: 13, marginBottom: 16 }}>
      <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      {message}
    </div>
  )
}

export function InfoNote({ message }) {
  if (!message) return null
  return (
    <div style={{ display: 'flex', gap: 10, padding: 11, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 7, color: 'var(--warning)', fontSize: 12, marginTop: 10 }}>
      <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
      {message}
    </div>
  )
}

export function SkeletonBlock({ lines = 4 }) {
  const widths = [200, 160, 220, 140, 180]
  return (
    <div style={{ padding: 16 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 13, width: `${widths[i % widths.length]}px`, marginBottom: 12 }} />
      ))}
    </div>
  )
}

export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{children}</h2>
      {sub && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{sub}</p>}
    </div>
  )
}

export function Card({ children, style = {} }) {
  return (
    <div className="glass-card" style={{ padding: 18, ...style }}>{children}</div>
  )
}

export function Badge({ children, variant = 'gold' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}
