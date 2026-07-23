import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  HelpCircle, Moon, Sun, User, Paperclip, Lightbulb,
  FileEdit, Landmark, RotateCcw, ClipboardList, BarChart2,
  MoreHorizontal, Info, Sparkles, X, ChevronRight,
  Copy, Download, Settings, LogOut, ArrowLeft,
  Loader2, CheckCircle2, AlertCircle, Calendar,
  MapPin, Scale, FileText, Users, ShieldCheck, RefreshCw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/* ─── Public API client for drafter (no auth required, long timeout) ─────── */
const drafterApi = axios.create({
  baseURL: '/api',
  timeout: 180000,  // 3 minutes — Ollama can be slow
})

/* ─── Draft type definitions ──────────────────────────────────────────────── */
const DRAFT_TYPES = [
  { id: 'petition',       label: 'Petition',        sub: 'Draft a petition for filing',  Icon: Landmark,      apiType: 'divorce_petition' },
  { id: 'legal-notice',   label: 'Legal Notice',    sub: 'Draft a legal notice',         Icon: FileEdit,      apiType: 'legal_notice'     },
  { id: 'counter-reply',  label: 'Counter / Reply', sub: 'Draft a counter or reply',     Icon: RotateCcw,     apiType: 'counter_reply'    },
  { id: 'proof-affidavit',label: 'Proof Affidavit', sub: 'Draft a proof affidavit',      Icon: ClipboardList, apiType: 'divorce_petition' },
  { id: 'arguments',      label: 'Arguments',       sub: 'Draft written arguments',      Icon: BarChart2,     apiType: 'divorce_petition' },
  { id: 'other',          label: 'Other',           sub: 'Other types of drafting',      Icon: MoreHorizontal,apiType: 'divorce_petition' },
]

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function getFieldIcon(field) {
  if (field.includes('petitioner') || field.includes('sender'))   return Users
  if (field.includes('respondent') || field.includes('receiver')) return User
  if (field.includes('date') || field.includes('filing'))         return Calendar
  if (field.includes('address') || field.includes('place') || field.includes('court') || field.includes('jurisdiction')) return MapPin
  if (field.includes('marriage') || field.includes('ground'))     return Scale
  if (field.includes('relief') || field.includes('prayer'))       return ShieldCheck
  if (field.includes('cruelty') || field.includes('facts') || field.includes('incident')) return FileText
  return Info
}

/* ─── Spinner ─────────────────────────────────────────────────────────────── */
function Spinner({ size = 16 }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size,
      border: `2px solid currentColor`, borderTopColor: 'transparent',
      borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0
    }} />
  )
}

/* ─── Completeness bar ────────────────────────────────────────────────────── */
function CompletenessBar({ score }) {
  const color = score < 40 ? '#ef4444' : score < 75 ? '#f59e0b' : '#22c55e'
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Information completeness</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${score}%`, background: color,
          borderRadius: 4, transition: 'width 0.6s ease'
        }} />
      </div>
    </div>
  )
}

/* ─── Missing Details Popup ───────────────────────────────────────────────── */
function MissingDetailsPopup({
  missingRequired, missingOptional,
  responses, onResponseChange,
  onCancel, onSubmit,
  completenessScore, isLoading
}) {
  const [expandedField, setExpandedField] = useState(null)
  const [showOptional, setShowOptional] = useState(false)

  const allFields = [
    ...missingRequired.map(f => ({ ...f, required: true  })),
    ...missingOptional.map(f => ({ ...f, required: false })),
  ]
  const visibleFields = showOptional ? allFields : missingRequired.map(f => ({ ...f, required: true }))

  const filledCount  = missingRequired.filter(f => (responses[f.field] || '').trim().length > 0).length
  const totalRequired = missingRequired.length

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 400,
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 540,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 24px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.08)',
        zIndex: 401,
        animation: 'popupIn 0.25s ease',
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(239,68,68,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertCircle size={16} color="#ef4444" />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Missing Details
              </h2>
            </div>
            <button onClick={onCancel} style={{
              width: 28, height: 28, borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)'
            }}>
              <X size={14} />
            </button>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
            To generate an accurate draft, please provide the following missing details.
          </p>
          <CompletenessBar score={completenessScore} />
          {/* Progress pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
           background: 'var(--focus-ring)',
            fontSize: 11.5, color: 'var(--text-secondary)', fontWeight: 600
          }}>
            <CheckCircle2 size={12} color="#22c55e" />
            {filledCount} of {totalRequired} required fields filled
          </div>
        </div>

        {/* Scrollable field list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {visibleFields.map((field, idx) => {
            const FieldIcon = getFieldIcon(field.field)
            const isExpanded = expandedField === field.field
            const isFilled   = (responses[field.field] || '').trim().length > 0

            return (
              <div key={field.field} style={{
                borderBottom: idx < visibleFields.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                {/* Field row */}
                <button
                  onClick={() => setExpandedField(isExpanded ? null : field.field)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '13px 24px',
                    background: isExpanded ? 'var(--bg-card)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 12,
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: isFilled
                      ? 'rgba(34,197,94,0.08)'
                      : field.required
                        ? 'rgba(239,68,68,0.06)'
                        : 'var(--bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${isFilled ? 'rgba(34,197,94,0.2)' : field.required ? 'rgba(239,68,68,0.15)' : 'var(--border)'}`,
                  }}>
                    {isFilled
                      ? <CheckCircle2 size={14} color="#22c55e" />
                      : <FieldIcon size={14} color={field.required ? '#ef4444' : 'var(--text-muted)'} />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {field.label}
                      {field.required && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#ef4444',
                          background: 'rgba(239,68,68,0.08)',
                          padding: '1px 6px', borderRadius: 4
                        }}>REQUIRED</span>
                      )}
                    </div>
                    {isFilled && !isExpanded && (
                      <div style={{
                        fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {responses[field.field]}
                      </div>
                    )}
                    {field.why_needed && !isExpanded && !isFilled && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                        {field.why_needed}
                      </div>
                    )}
                  </div>
                  <ChevronRight
                    size={14}
                    color="var(--text-muted)"
                    style={{ flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                  />
                </button>

                {/* Expanded input */}
                {isExpanded && (
                  <div style={{ padding: '0 24px 16px', background: 'var(--bg-card)' }}>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                      {field.question}
                    </p>
                    <textarea
                      autoFocus
                      value={responses[field.field] || ''}
                      onChange={e => onResponseChange(field.field, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      rows={3}
                      style={{
                        width: '100%', resize: 'vertical',
                        border: '1px solid var(--border-light)',
                        borderRadius: 8, padding: '10px 12px',
                        fontSize: 13, color: 'var(--text-primary)',
                        background: 'var(--bg-primary)',
                        fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                        outline: 'none', boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                     onFocus={e => { e.target.style.borderColor = 'var(--text-primary)'; e.target.style.boxShadow = '0 0 0 3px var(--focus-ring)' }}
                      onBlur={e  => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.boxShadow = 'none' }}
                    />
                    <button
                      onClick={() => setExpandedField(null)}
                      style={{
                        marginTop: 8, padding: '6px 14px', borderRadius: 7,
                        background: 'var(--accent)', color: 'var(--accent-text)',  
                        border: 'none', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Show optional fields toggle */}
          {missingOptional.length > 0 && (
            <button
              onClick={() => setShowOptional(v => !v)}
              style={{
                width: '100%', padding: '11px 24px',
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Info size={13} />
              {showOptional ? 'Hide' : 'Show'} {missingOptional.length} optional fields
              <ChevronRight size={12} style={{ transform: showOptional ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: 'flex-end', flexShrink: 0,
          background: 'var(--bg-primary)',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '9px 20px', borderRadius: 9,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading || filledCount === 0}
            style={{
              padding: '9px 22px', borderRadius: 9,
             background: filledCount === 0 ? '#d4d4d4' : 'var(--accent)',
color: 'var(--accent-text)', border: 'none',
              fontSize: 13, fontWeight: 600,
              cursor: filledCount === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? <><Spinner size={13} /> Validating…</> : <><Sparkles size={13} /> Provide Details</>}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── Draft Output View ───────────────────────────────────────────────────── */
function DraftOutput({ draft, onReset, selectedDraftLabel }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([draft], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `LegalOne_Draft_${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Output toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 9,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <ArrowLeft size={13} /> New Draft
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 999,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.15)',
            fontSize: 12, color: '#16a34a', fontWeight: 600
          }}>
            <CheckCircle2 size={12} />
            Draft Generated
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCopy} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9,
            border: '1px solid var(--border)',
            background: copied ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)',
            color: copied ? '#16a34a' : 'var(--text-secondary)',
            fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={handleDownload} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 9,
            border: 'none',
            background: 'var(--accent)', color: 'var(--accent-text)',
            
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          }}>
            <Download size={13} /> Download .txt
          </button>
        </div>
      </div>

      {/* Draft text */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '28px 32px',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: 13,
        lineHeight: 2,
        whiteSpace: 'pre-wrap',
        color: 'var(--text-primary)',
        overflowX: 'auto',
        minHeight: 400,
      }}>
        {draft}
      </div>
    </div>
  )
}

/* ─── Profile Dropdown ────────────────────────────────────────────────────── */
function ProfileDropdown({ advocate, isLoggedIn, onClose, onProfile, onLogout, onLogin, onRegister }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 300 }} />
      <div style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        width: 240,
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        boxShadow: '0 16px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 301,
        overflow: 'hidden',
        animation: 'popupIn 0.18s ease',
      }}>

        {isLoggedIn ? (
          /* ── LOGGED IN STATE ── */
          <>
            {/* Avatar + name */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a1a1a, #444)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {advocate?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Adv. {advocate?.name || 'Advocate'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {advocate?.email || ''}
                </div>
                {advocate?.bar_council_number && (
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>
                    Bar No: {advocate.bar_council_number}
                  </div>
                )}
              </div>
            </div>
            {/* Actions */}
            <div style={{ padding: '6px' }}>
              <button onClick={onProfile} style={{
                width: '100%', textAlign: 'left', padding: '9px 12px',
                background: 'none', border: 'none', borderRadius: 8,
                color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Settings size={14} /> Settings & Profile
              </button>
              <button onClick={onLogout} style={{
                width: '100%', textAlign: 'left', padding: '9px 12px',
                background: 'none', border: 'none', borderRadius: 8,
                color: '#ef4444', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </>
        ) : (
          /* ── NOT LOGGED IN STATE ── */
          <>
            <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--accent)', color: 'var(--accent-text)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 10px',
              }}>
                <User size={20} strokeWidth={1.5} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Not Signed In</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                Sign in to save drafts to My Cases and access your history
              </div>
            </div>
            <div style={{ padding: '10px' }}>
              <button onClick={onLogin} style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: 'var(--accent)', border: 'none',
                color: 'var(--accent-text)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', marginBottom: 6,
                transition: 'opacity 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Sign In
              </button>
              <button onClick={onRegister} style={{
                width: '100%', padding: '9px 14px', borderRadius: 8,
                background: 'none', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                Create Account
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

/* ─── Loading overlay ─────────────────────────────────────────────────────── */
function LoadingOverlay({ message }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(3px)',
      zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '32px 40px',
        textAlign: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        animation: 'popupIn 0.25s ease',
        minWidth: 280,
      }}>
        {/* Animated scales icon */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--bg-card)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          border: '2px solid var(--border)',
        }}>
          <Scale size={24} color="var(--text-primary)" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
          {message}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20 }}>
          This may take 30–60 seconds
        </div>
        {/* Animated dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--text-primary)',
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function DraftPage() {
  const { advocate, isLoggedIn, logout, authApi } = useAuth()
  const navigate = useNavigate()

  /* ── UI State ── */
  const [selectedDraft, setSelectedDraft]   = useState('petition')
  const [text, setText]                     = useState('')
  const [darkMode, setDarkMode]             = useState(() => localStorage.getItem('legalDark') === 'true')
  const [showProfile, setShowProfile]       = useState(false)
  const [attachedFile, setAttachedFile]     = useState(null)
  const profileRef  = useRef(null)
  const fileInputRef = useRef(null)
  const MAX = 5000

  /* ── Flow State ── */
  const [step, setStep]                     = useState('idle')
  // step: 'idle' | 'step1_loading' | 'missing' | 'step2_loading' | 'generating' | 'done' | 'error'
  const [extracted, setExtracted]           = useState({})
  const [missingRequired, setMissingRequired] = useState([])
  const [missingOptional, setMissingOptional] = useState([])
  const [completeness, setCompleteness]     = useState(0)
  const [responses, setResponses]           = useState({})
  const [draft, setDraft]                   = useState('')
  const [errorMsg, setErrorMsg]             = useState('')

  /* ── Dark mode ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('legalDark', String(darkMode))
  }, [darkMode])

  /* ── Close profile on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── Computed ── */
  const currentDraftType = DRAFT_TYPES.find(d => d.id === selectedDraft)?.apiType || 'divorce_petition'
  const currentLabel     = DRAFT_TYPES.find(d => d.id === selectedDraft)?.label || 'Draft'
  const isLoading        = step === 'step1_loading' || step === 'step2_loading' || step === 'generating'

  const loadingMessage = {
    step1_loading: 'Analyzing your case details…',
    step2_loading: 'Validating information…',
    generating:    'Generating legal draft…',
  }[step] || ''

  /* ── Handlers ── */
  const onResponseChange = useCallback((field, value) => {
    setResponses(prev => ({ ...prev, [field]: value }))
  }, [])

  /* STEP 1 — Extract & detect missing */
  const handleGenerate = async () => {
    if (!text.trim()) { setErrorMsg('Please describe your case first.'); return }
    setErrorMsg('')
    setStep('step1_loading')
    try {
      const res = await drafterApi.post('/drafter/step1-extract', {
        draft_type:  currentDraftType,
        user_input:  text,
        rag_context: '',
      })
      const data = res.data
      setExtracted(data.extracted || {})
      setCompleteness(data.completeness_score || 0)

      if (data.ready_to_draft) {
        await generateDraft(data.extracted)
      } else {
        setMissingRequired(data.missing_required || [])
        setMissingOptional(data.missing_optional || [])
        const init = {}
        ;(data.missing_required || []).forEach(f => { init[f.field] = '' })
        ;(data.missing_optional || []).forEach(f => { init[f.field] = '' })
        setResponses(init)
        setStep('missing')
      }
    } catch (e) {
      const isNetwork = !e.response
      setErrorMsg(
        isNetwork
          ? 'Cannot reach backend server. Please ensure the backend is running on port 8000.'
          : (e.response?.data?.detail || 'Server error. Please try again.')
      )
      setStep('idle')
    }
  }

  /* STEP 2 — Validate after user fills */
  const handleProvideDetails = async () => {
    setStep('step2_loading')
    try {
      const res = await drafterApi.post('/drafter/step2-validate', {
        draft_type:       currentDraftType,
        original_input:   text,
        user_responses:   responses,
        extracted_so_far: extracted,
      })
      const data = res.data
      setCompleteness(data.completeness_score || 0)

      if (data.ready_to_draft) {
        await generateDraft(data.final_data)
      } else {
        setMissingRequired(data.still_missing || [])
        const init = {}
        ;(data.still_missing || []).forEach(f => { init[f.field] = responses[f.field] || '' })
        setResponses(init)
        setStep('missing')
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Validation failed. Please try again.')
      setStep('missing')
    }
  }

  /* STEP 3 — Generate final draft + auto-save to My Cases */
  const generateDraft = async (finalData) => {
    setStep('generating')
    try {
      const res = await drafterApi.post('/drafter/step3-generate', {
        draft_type:  currentDraftType,
        final_data:  finalData,
        rag_context: '',
      })
      const { draft: draftText, completeness_score, word_count, source } = res.data

      // Compute simple legal accuracy score from field completeness
      const filledRequired = Object.values(finalData).filter(v => v && String(v).trim()).length
      const totalFields = Object.keys(finalData).length || 1
      const legalAccuracy = Math.min(100, Math.round((filledRequired / totalFields) * 100))
      const scoreVal = completeness_score || legalAccuracy

      setDraft(draftText || '')
      setCompleteness(scoreVal)
      setStep('done')

      // ── Auto-save to My Cases if user is logged in ─────────────────────
      if (isLoggedIn) {
        try {
          await authApi.post('/history', {
            module:           'draft',
            raw_input:        text,
            title:            `${DRAFT_TYPES.find(d => d.apiType === currentDraftType)?.label || 'Draft'} — ${finalData.petitioner_name || finalData.sender_name || 'Unknown'}`,
            plaintiff_name:   finalData.petitioner_name || finalData.sender_name || '',
            defendant_name:   finalData.respondent_name || finalData.receiver_name || '',
            case_type:        currentDraftType,
            court:            finalData.jurisdiction_court || '',
            draft_text:       draftText || '',
            validation_score: legalAccuracy,
            draft_source:     source || 'rule_based_template',
            notes:            JSON.stringify({
              completeness_score: scoreVal,
              legal_accuracy:     legalAccuracy,
              word_count:         word_count || (draftText || '').split(' ').length,
              ground:             finalData.ground || '',
              marriage_type:      finalData.marriage_type || '',
              separation_date:    finalData.separation_date || '',
            }),
          })
        } catch (_) {
          // Silent fail — don't break draft experience if save fails
        }
      }
    } catch (e) {
      setErrorMsg(e.response?.data?.detail || 'Draft generation failed. Please try again.')
      setStep('idle')
    }
  }

  const handleReset = () => {
    setStep('idle'); setDraft(''); setExtracted({})
    setMissingRequired([]); setMissingOptional([])
    setResponses({}); setErrorMsg(''); setCompleteness(0)
  }

  const handleFileAttach = (e) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
  }

  /* ─────────────────────────────────────────── RENDER ─────────────────────── */
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      minHeight: 'calc(100vh - 72px)',
      background: 'var(--bg-secondary)',
      margin: '-36px -40px -40px',
    }}>

      {/* ── Popups & overlays ── */}
      {isLoading && <LoadingOverlay message={loadingMessage} />}

      {(step === 'missing' || step === 'step2_loading') && !isLoading && (
        <MissingDetailsPopup
          missingRequired={missingRequired}
          missingOptional={missingOptional}
          responses={responses}
          onResponseChange={onResponseChange}
          onCancel={() => setStep('idle')}
          onSubmit={handleProvideDetails}
          completenessScore={completeness}
          isLoading={step === 'step2_loading'}
        />
      )}

      {/* ── Top Header ── */}
      <div style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div>
          <h1 style={{
            fontSize: 13, fontWeight: 800, color: 'var(--text-primary)',
            letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0
          }}>
            AI DRAFTER
          </h1>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            Describe your case in simple words and let AI create your legal draft.
          </p>
        </div>

        {/* Header buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Help */}
          <button
            title="Help"
            style={iconBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <HelpCircle size={17} strokeWidth={1.5} color="var(--text-muted)" />
          </button>

          {/* Dark mode toggle */}
          <button
            id="dark-mode-toggle"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onClick={() => setDarkMode(v => !v)}
            style={{
              ...iconBtnStyle,
              background: darkMode ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: darkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
            }}
            onMouseEnter={e => { if (!darkMode) e.currentTarget.style.background = 'var(--bg-card)' }}
            onMouseLeave={e => { if (!darkMode) e.currentTarget.style.background = 'transparent' }}
          >
            {darkMode
              ? <Sun  size={17} strokeWidth={1.5} color="#fbbf24" />
              : <Moon size={17} strokeWidth={1.5} color="var(--text-muted)" />
            }
          </button>

          {/* Profile button */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              id="profile-btn"
              title="Profile"
              onClick={() => setShowProfile(v => !v)}
              style={{
                ...iconBtnStyle,
                background: showProfile ? 'var(--bg-card)' : 'transparent',
                border: showProfile ? '1px solid var(--border)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!showProfile) e.currentTarget.style.background = 'var(--bg-card)' }}
              onMouseLeave={e => { if (!showProfile) e.currentTarget.style.background = showProfile ? 'var(--bg-card)' : 'transparent' }}
            >
              {isLoggedIn
                ? <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: 'var(--accent-text)', letterSpacing: 0
                  }}>
                    {advocate?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                : <User size={17} strokeWidth={1.5} color="var(--text-muted)" />
              }
            </button>

            {showProfile && (
              <ProfileDropdown
                advocate={advocate}
                isLoggedIn={isLoggedIn}
                onClose={() => setShowProfile(false)}
                onProfile={() => { setShowProfile(false); navigate('/profile') }}
                onLogout={() => { setShowProfile(false); logout(); navigate('/') }}
                onLogin={() => { setShowProfile(false); navigate('/login') }}
                onRegister={() => { setShowProfile(false); navigate('/signup') }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Main scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Error banner ── */}
        {errorMsg && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 10,
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.18)',
            color: '#dc2626', fontSize: 13,
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── DONE: Show the generated draft ── */}
        {step === 'done' ? (
          <DraftOutput draft={draft} onReset={handleReset} selectedDraftLabel={currentLabel} />
        ) : (
          <>
            {/* ── Textarea Card ── */}
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <textarea
                id="case-details-input"
                value={text}
                onChange={e => { if (e.target.value.length <= MAX) setText(e.target.value) }}
                placeholder="Start typing your case details in simple words..."
                style={{
                  width: '100%', resize: 'none',
                  border: 'none', outline: 'none',
                  padding: '18px 20px 10px',
                  fontSize: 13.5, color: 'var(--text-primary)',
                  background: 'transparent', lineHeight: 1.7,
                  fontFamily: 'Inter, sans-serif',
                  minHeight: 90,
                  boxSizing: 'border-box',
                }}
                rows={4}
              />

              {/* Example hint — only when empty */}
              {!text && (
                <div style={{ padding: '0 20px 14px' }}>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4 }}>For example:</p>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.7 }}>
                    "I want to file a divorce petition on the ground of cruelty.<br />
                    We were married on 15 June 2015 at Delhi.<br />
                    We are residing at 123, Green Park, New Delhi…"
                  </p>
                </div>
              )}

              {/* Card footer */}
              <div style={{
                borderTop: '1px solid var(--border)',
                padding: '10px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                {/* Attach file */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: 'pointer', color: 'var(--text-secondary)',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={handleFileAttach}
                  />
                  <Paperclip size={14} strokeWidth={1.5} />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      Attach Document <span style={{ fontWeight: 400 }}>(Optional)</span>
                    </span>
                    {attachedFile
                      ? <div style={{ fontSize: 10.5, color: '#16a34a', marginTop: 1 }}>✓ {attachedFile.name}</div>
                      : <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>PDF, DOC, DOCX (Max 10MB)</div>
                    }
                  </div>
                </div>
                {/* Counter + bulb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Lightbulb
                    size={14} strokeWidth={1.5}
                    color={text.length > MAX * 0.8 ? '#f59e0b' : 'var(--text-muted)'}
                  />
                  <span style={{
                    fontSize: 11.5,
                    color: text.length > MAX * 0.9 ? '#ef4444' : 'var(--text-muted)',
                    fontWeight: text.length > MAX * 0.9 ? 600 : 400,
                  }}>
                    {text.length} / {MAX} characters
                  </span>
                </div>
              </div>
            </div>

            {/* ── Draft Type Section ── */}
            <div>
              <h2 style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Select type of drafting
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                {DRAFT_TYPES.map(({ id, label, sub, Icon }) => {
                  const isActive = selectedDraft === id
                  return (
                    <button
                      key={id}
                      id={`draft-type-${id}`}
                      onClick={() => { setSelectedDraft(id); handleReset() }}
                      style={{
                        position: 'relative',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 8, padding: '18px 8px', borderRadius: 12,
                        background: 'var(--bg-primary)',
                        border: isActive ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                        cursor: 'pointer', textAlign: 'center',
                        transition: 'all 0.2s',
                        boxShadow: isActive ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border-light)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)' }}
                    >
                      {/* Active checkmark badge */}
                      {isActive && (
                        <span style={{
                          position: 'absolute', top: -9, right: -9,
                          width: 20, height: 20, borderRadius: '50%',
                          background: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5 3.5-4" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      <Icon size={24} strokeWidth={1.5} color={isActive ? 'var(--text-primary)' : 'var(--text-muted)'} />
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{label}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>{sub}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Bottom: How it works + Generate button ── */}
            <div style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              {/* Info */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                <Info size={14} strokeWidth={1.5} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>How it works?</p>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Just type or paste the facts of your case in simple words. Our AI will understand the
                    details, ask for any missing information, and generate a complete legal draft including
                    all necessary clauses like verification, affidavit, etc.
                  </p>
                </div>
              </div>

              {/* Generate button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                  id="generate-draft-btn"
                  onClick={handleGenerate}
                  disabled={isLoading || !text.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: !text.trim() ? '#d4d4d4' : 'var(--accent)',
color: 'var(--accent-text)',
                    border: 'none',
                    padding: '11px 24px', borderRadius: 10,
                    fontSize: 13.5, fontWeight: 700,
                    cursor: !text.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    boxShadow: text.trim() ? '0 4px 14px rgba(0,0,0,0.12)' : 'none',
                  }}
                  onMouseEnter={e => { if (text.trim()) e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <Sparkles size={15} strokeWidth={1.5} />
                  Generate Draft
                </button>
                <p style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
                  AI drafts can make mistakes. Please review before use.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Keyframe animations (injected once) ── */}
      <style>{`
         
  @keyframes fadeIn   { from { opacity:0 }                        to { opacity:1 } }
  @keyframes popupIn  { from { opacity:0; transform:translate(-50%,-48%) scale(0.96) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
  @keyframes bounce   { 0%,80%,100% { transform:scale(0) } 40% { transform:scale(1) } }
  @keyframes pulse    { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
  @keyframes spin     { to { transform:rotate(360deg) } }

  :root {
    --accent: #111827;
    --accent-text: #ffffff;
    --focus-ring: rgba(10,10,10,0.06);
  }
  [data-theme="dark"] {
    --accent: #f1f1f1;
    --accent-text: #111111;
    --focus-ring: rgba(255,255,255,0.08);
  }
`} 
      
      
      </style>
    </div>
  )
}

/* ─── Shared inline style helpers ────────────────────────────────────────── */
const iconBtnStyle = {
  width: 34, height: 34,
  borderRadius: 8,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent',
  border: '1px solid transparent',
  cursor: 'pointer',
  transition: 'all 0.18s',
  flexShrink: 0,
}


 