import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * Pagination — page navigation bar.
 *
 * Props:
 *   currentPage   {number}
 *   totalPages    {number}
 *   totalRecords  {number}
 *   pageSize      {number}
 *   onPageChange  {(page: number) => void}
 */
export default function Pagination({
  currentPage = 1,
  totalPages,
  totalRecords,
  pageSize = 10,
  onPageChange,
}) {
  const hasRecords = typeof totalRecords === 'number' && totalRecords > 0
  const start = hasRecords ? (currentPage - 1) * pageSize + 1 : 0
  const end   = hasRecords ? Math.min(currentPage * pageSize, totalRecords) : 0

  /* Build a smart window: always show first, last, current ± 1, and ellipses */
  const pages = totalPages ? Array.from({ length: totalPages }, (_, i) => i + 1) : []

  function getPageWindow() {
    if (!totalPages || totalPages <= 7) return pages
    const window = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
    const sorted = [...window].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
    const result = []
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
      result.push(sorted[i])
    }
    return result
  }

  const pageWindow = getPageWindow()

  return (
    <nav
      className="jd-pagination"
      aria-label="Judgements pagination"
      role="navigation"
    >
      {/* Record count label */}
      <p className="jd-pg-label">
        {hasRecords
          ? `Showing ${start}–${end} of ${totalRecords} cases`
          : 'No cases to display'}
      </p>

      {/* Page controls */}
      <div className="jd-pg-controls">
        {/* Previous */}
        <motion.button
          type="button"
          className="jd-pg-btn"
          disabled={!totalPages || currentPage <= 1}
          onClick={() => onPageChange?.(currentPage - 1)}
          aria-label="Previous page"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          transition={{ duration: 0.12 }}
        >
          <ChevronLeft size={15} aria-hidden="true" />
        </motion.button>

        {/* Page numbers */}
        {pageWindow.map((item, i) =>
          item === '…' ? (
            <span key={`ellipsis-${i}`} className="jd-pg-ellipsis" aria-hidden="true">
              …
            </span>
          ) : (
            <motion.button
              key={item}
              type="button"
              className={`jd-pg-btn${item === currentPage ? ' is-current' : ''}`}
              onClick={() => onPageChange?.(item)}
              aria-label={`Page ${item}`}
              aria-current={item === currentPage ? 'page' : undefined}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.93 }}
              transition={{ duration: 0.12 }}
            >
              {item}
            </motion.button>
          )
        )}

        {/* Next */}
        <motion.button
          type="button"
          className="jd-pg-btn"
          disabled={!totalPages || currentPage >= totalPages}
          onClick={() => onPageChange?.(currentPage + 1)}
          aria-label="Next page"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          transition={{ duration: 0.12 }}
        >
          <ChevronRight size={15} aria-hidden="true" />
        </motion.button>
      </div>
    </nav>
  )
}
