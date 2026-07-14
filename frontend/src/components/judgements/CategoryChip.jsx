import { motion } from 'framer-motion'

/**
 * CategoryChip — single tab pill for CategoryTabs.
 *
 * Props:
 *   label   {string}
 *   count   {number}  — optional badge count
 *   active  {boolean}
 *   onClick {function}
 */
export default function CategoryChip({ label, count, active, onClick }) {
  return (
    <motion.button
      type="button"
      role="tab"
      aria-selected={active}
      className={`jd-category-chip${active ? ' is-active' : ''}`}
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.15 }}
    >
      {label}
      {count !== undefined && (
        <span className="jd-category-count" aria-label={`${count} cases`}>
          {count}
        </span>
      )}
    </motion.button>
  )
}
