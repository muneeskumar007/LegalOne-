import { useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

/* ─── Animation variants ─────────────────────────────────────────────── */

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.92, y: 12 },
}

const transition = { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }

/* ─── Focus trap ─────────────────────────────────────────────────────── */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return

    /* Focus the first focusable element */
    const focusableEls = Array.from(ref.current.querySelectorAll(FOCUSABLE))
    focusableEls[0]?.focus()

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return
      const els = Array.from(ref.current.querySelectorAll(FOCUSABLE))
      if (!els.length) return
      const first = els[0]
      const last = els[els.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, ref])
}

/* ─── Component ──────────────────────────────────────────────────────── */

/**
 * HelpModal — centered AI Drafter help dialog.
 *
 * Props:
 *   open    {boolean} — controls visibility
 *   onClose {() => void}
 */
export default function HelpModal({ open, onClose }) {
  const dialogRef = useRef(null)
  useFocusTrap(dialogRef, open)

  /* Escape key */
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  /* Prevent body scroll when open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleBackdropClick = useCallback(
    (e) => { if (e.target === e.currentTarget) onClose() },
    [onClose],
  )

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="jd-modal-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={transition}
          onClick={handleBackdropClick}
          aria-hidden="false"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(3px)',
            padding: '16px',
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-modal-title"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 440,
              background: 'var(--jd-card-bg, #ffffff)',
              border: '1px solid var(--jd-border, transparent)',
              borderRadius: 14,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px 16px',
              borderBottom: '1px solid var(--jd-border, #E5E7EB)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Accent dot */}
                <span style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--jd-text-primary, #111827)',
                  flexShrink: 0,
                }} />
                <h2
                  id="help-modal-title"
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--jd-text-primary, #111827)',
                    fontFamily: 'Inter, DM Sans, system-ui, sans-serif',
                    letterSpacing: '-.01em',
                  }}
                >
                  AI Drafter Help
                </h2>
              </div>

              <motion.button
                type="button"
                aria-label="Close help modal"
                onClick={onClose}
                whileHover={{ scale: 1.08, background: 'var(--jd-hover-bg, #F3F4F6)' }}
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.14 }}
                style={{
                  display: 'inline-grid',
                  placeItems: 'center',
                  width: 30,
                  height: 30,
                  border: '1px solid var(--jd-border, #E5E7EB)',
                  borderRadius: '50%',
                  background: 'var(--jd-input-bg, #fff)',
                  color: 'var(--jd-text-muted, #6B7280)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={15} aria-hidden="true" />
              </motion.button>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: '20px 24px' }}>
              <ul style={{
                margin: 0,
                paddingLeft: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                <li style={{
                  fontSize: 14,
                  color: 'var(--jd-text-secondary, #374151)',
                  lineHeight: 1.6,
                  fontFamily: 'Inter, DM Sans, system-ui, sans-serif',
                }}>
                  Backend integration is currently under development.
                </li>
                <li style={{
                  fontSize: 14,
                  color: 'var(--jd-text-secondary, #374151)',
                  lineHeight: 1.6,
                  fontFamily: 'Inter, DM Sans, system-ui, sans-serif',
                }}>
                  Use <strong style={{ color: 'var(--jd-text-primary, #111827)' }}>New Draft</strong> to start creating a new legal draft.
                </li>
              </ul>
            </div>

            {/* ── Footer ── */}
            <div style={{
              padding: '14px 24px 20px',
              borderTop: '1px solid var(--jd-border, #F3F4F6)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <motion.button
                type="button"
                onClick={onClose}
                aria-label="Close help modal"
                whileHover={{ scale: 1.02, background: 'var(--jd-hover-bg, #1f2937)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 36,
                  padding: '0 20px',
                  border: 0,
                  borderRadius: 8,
                  background: 'var(--jd-page-bg, #111827)',
                  color: 'var(--jd-text-primary, #fff)',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'Inter, DM Sans, system-ui, sans-serif',
                  cursor: 'pointer',
                  letterSpacing: '-.01em',
                }}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
