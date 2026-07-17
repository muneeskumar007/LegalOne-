import { motion, AnimatePresence } from 'framer-motion'
import { FileSearch } from 'lucide-react'

/**
 * EmptyState — friendly placeholder shown when there are no records.
 *
 * Props:
 *   title       {string}  — override default heading
 *   description {string}  — override default body text
 *   icon        {Component} — optional custom Lucide icon (defaults to FileSearch)
 */
export default function EmptyState({
  title = 'No draft data available',
  description = 'Drafts will appear here once data is received from the backend.',
  icon: Icon = FileSearch,
}) {
  return (
    <AnimatePresence>
      <motion.div
        className="jd-empty-state"
        role="status"
        aria-live="polite"
        aria-label={title}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Icon blob */}
        <motion.span
          className="jd-empty-icon"
          aria-hidden="true"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon size={28} strokeWidth={1.5} />
        </motion.span>

        <h3>{title}</h3>
        <p>{description}</p>

        {/* Decorative dashes */}
        <div className="jd-empty-divider" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
