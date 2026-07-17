import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Settings, User, UserRound, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'

/* ─── Animation variants ─────────────────────────────────────────────── */

const dropdownVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -8 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -8 },
}

const dialogBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 16 },
}

const transition = { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }

/* ─── Focus trap helper ──────────────────────────────────────────────── */

const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function useFocusTrap(ref, active) {
  useEffect(() => {
    if (!active || !ref.current) return
    const els = Array.from(ref.current.querySelectorAll(FOCUSABLE))
    els[0]?.focus()

    function onTab(e) {
      if (e.key !== 'Tab') return
      const focusable = Array.from(ref.current.querySelectorAll(FOCUSABLE))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onTab)
    return () => document.removeEventListener('keydown', onTab)
  }, [active, ref])
}

/* ─── Logout confirmation dialog ─────────────────────────────────────── */

function LogoutDialog({ open, onClose }) {
  const dialogRef = useRef(null)
  useFocusTrap(dialogRef, open)

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleConfirm = () => {
    console.log('Logout clicked')
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          variants={dialogBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={transition}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.38)',
            backdropFilter: 'blur(3px)',
            padding: 16,
          }}
        >
          <motion.div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-desc"
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transition}
            style={{
              width: '100%',
              maxWidth: 380,
              background: 'var(--jd-card-bg, #fff)',
              border: '1px solid var(--jd-border, transparent)',
              borderRadius: 14,
              boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 20px 14px',
              borderBottom: '1px solid var(--jd-border, #F3F4F6)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-grid',
                  placeItems: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: '#FEF2F2',
                  color: '#DC2626',
                  flexShrink: 0,
                }}>
                  <LogOut size={14} aria-hidden="true" />
                </span>
                <h3
                  id="logout-dialog-title"
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--jd-text-primary, #111827)',
                    fontFamily: 'Inter, DM Sans, system-ui, sans-serif',
                  }}
                >
                  Logout
                </h3>
              </div>

              <motion.button
                type="button"
                aria-label="Cancel logout"
                onClick={onClose}
                whileHover={{ scale: 1.08, background: 'var(--jd-hover-bg, #F3F4F6)' }}
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.14 }}
                style={{
                  display: 'inline-grid',
                  placeItems: 'center',
                  width: 28,
                  height: 28,
                  border: '1px solid var(--jd-border, #E5E7EB)',
                  borderRadius: '50%',
                  background: 'var(--jd-input-bg, #fff)',
                  color: 'var(--jd-text-muted, #6B7280)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} aria-hidden="true" />
              </motion.button>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 20px' }}>
              <p
                id="logout-dialog-desc"
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: 'var(--jd-text-secondary, #374151)',
                  lineHeight: 1.6,
                  fontFamily: 'Inter, DM Sans, system-ui, sans-serif',
                }}
              >
                Are you sure you want to logout?
              </p>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '12px 20px 18px',
              borderTop: '1px solid var(--jd-border, #F3F4F6)',
            }}>
              <motion.button
                type="button"
                onClick={onClose}
                aria-label="Cancel logout"
                whileHover={{ scale: 1.02, background: 'var(--jd-hover-bg, #F9FAFB)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.14 }}
                style={{
                  height: 34,
                  padding: '0 16px',
                  border: '1px solid var(--jd-border, #E5E7EB)',
                  borderRadius: 8,
                  background: 'var(--jd-input-bg, #fff)',
                  color: 'var(--jd-text-secondary, #374151)',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'Inter, DM Sans, system-ui, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </motion.button>

              <motion.button
                type="button"
                onClick={handleConfirm}
                aria-label="Confirm logout"
                whileHover={{ scale: 1.02, background: '#b91c1c' }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.14 }}
                style={{
                  height: 34,
                  padding: '0 16px',
                  border: 0,
                  borderRadius: 8,
                  background: '#DC2626',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'Inter, DM Sans, system-ui, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Logout
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/* ─── ProfileDropdown ────────────────────────────────────────────────── */

const MENU_ITEMS = [
  { id: 'profile',  label: 'My Profile', icon: User    },
  { id: 'settings', label: 'Settings',   icon: Settings },
  { id: 'logout',   label: 'Logout',     icon: LogOut,  danger: true },
]

/**
 * ProfileDropdown — avatar button + animated right-aligned dropdown menu.
 *
 * UI-only actions:
 *   - My Profile → toast
 *   - Settings   → toast
 *   - Logout     → confirmation dialog (console.log only)
 */
export default function ProfileDropdown() {
  const [open, setOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const wrapRef = useRef(null)

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    function onPointer(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  /* Close on Escape */
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const handleItem = useCallback((id) => {
    setOpen(false)
    if (id === 'profile') {
      toast('Profile page coming soon.', { icon: '👤' })
    } else if (id === 'settings') {
      toast('Settings page under development.', { icon: '⚙️' })
    } else if (id === 'logout') {
      setShowLogout(true)
    }
  }, [])

  return (
    <>
      <div ref={wrapRef} style={{ position: 'relative' }}>
        {/* Avatar trigger */}
        <motion.button
          type="button"
          className="jd-profile-button"
          aria-label="Open user profile menu"
          aria-haspopup="true"
          aria-expanded={open}
          title="User profile"
          onClick={() => setOpen((o) => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          transition={{ duration: 0.15 }}
        >
          <UserRound size={17} aria-hidden="true" />
        </motion.button>

        {/* Dropdown */}
        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              aria-label="User menu"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={transition}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                zIndex: 500,
                minWidth: 172,
                padding: '5px',
                border: '1px solid var(--jd-border, #E5E7EB)',
                borderRadius: 10,
                background: 'var(--jd-card-bg, #fff)',
                boxShadow: '0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                transformOrigin: 'top right',
              }}
            >
              {MENU_ITEMS.map(({ id, label, icon: Icon, danger }) => (
                <motion.button
                  key={id}
                  type="button"
                  role="menuitem"
                  aria-label={label}
                  onClick={() => handleItem(id)}
                  whileHover={{
                    background: danger ? '#FEF2F2' : 'var(--jd-hover-bg, #F9FAFB)',
                    color: danger ? '#991B1B' : 'var(--jd-text-primary, #111827)',
                  }}
                  transition={{ duration: 0.12 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '8px 10px',
                    border: 0,
                    borderRadius: 7,
                    background: 'transparent',
                    color: danger ? '#DC2626' : 'var(--jd-text-secondary, #374151)',
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'Inter, DM Sans, system-ui, sans-serif',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout confirmation dialog — rendered in a portal */}
      <LogoutDialog
        open={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </>
  )
}
