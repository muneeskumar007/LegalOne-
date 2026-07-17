import { useState, useRef, useEffect } from 'react'
import { Eye, MoreHorizontal, Pencil, Play, Share2, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * ActionMenu — row action buttons with an animated three-dot dropdown.
 *
 * Props:
 *   onContinue {() => void}
 *   onView     {() => void}
 *   onEdit     {() => void}
 *   onShare    {() => void}
 *   onDelete   {() => void}
 */
export default function ActionMenu({ onContinue, onView, onEdit, onShare, onDelete }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  /* Close on Escape */
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const menuItems = [
    { icon: Pencil,  label: 'Edit Draft',  handler: onEdit,   danger: false },
    { icon: Share2,  label: 'Share',        handler: onShare,  danger: false },
    { icon: Trash2,  label: 'Delete',       handler: onDelete, danger: true  },
  ]

  return (
    <div className="jd-actions" ref={menuRef}>
      {/* Continue button */}
      <motion.button
        type="button"
        className="jd-action-btn jd-action-btn--continue"
        onClick={onContinue}
        aria-label="Continue drafting"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.13 }}
      >
        <Play size={13} aria-hidden="true" />
        Continue
      </motion.button>

      {/* View button */}
      <motion.button
        type="button"
        className="jd-icon-button"
        onClick={onView}
        aria-label="View judgement"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: 0.13 }}
      >
        <Eye size={15} aria-hidden="true" />
      </motion.button>

      {/* Three-dot menu */}
      <div className="jd-more-wrap" style={{ position: 'relative' }}>
        <motion.button
          type="button"
          className={`jd-icon-button${open ? ' is-active' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="More actions"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.13 }}
        >
          <MoreHorizontal size={16} aria-hidden="true" />
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              role="menu"
              className="jd-dropdown-menu"
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.92, y: -4  }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
            >
              {menuItems.map(({ icon: Icon, label, handler, danger }) => (
                <button
                  key={label}
                  type="button"
                  role="menuitem"
                  className={`jd-dropdown-item${danger ? ' jd-dropdown-item--danger' : ''}`}
                  onClick={() => { setOpen(false); handler?.() }}
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
