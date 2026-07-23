import { motion } from 'framer-motion'
import StatusBadge from './StatusBadge'
import ActionMenu from './ActionMenu'

/**
 * TableRow — single data row in the Judgements table.
 *
 * Props:
 *   judgement {object}  — API response shape:
 *     { id, title, parties, caseType, caseNumber, status, lastModified }
 *   onView     {(judgement) => void}
 *   onContinue {(judgement) => void}
 *   onEdit     {(judgement) => void}
 *   onShare    {(judgement) => void}
 *   onDelete   {(judgement) => void}
 */
export default function TableRow({ judgement, onView, onContinue, onEdit, onShare, onDelete }) {
  return (
    <motion.tr
      className="jd-table-row"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ backgroundColor: '#f8fafc' }}
    >
      {/* Case Title + Parties */}
      <td data-label="Case Title / Parties" className="jd-col-title">
        <strong>{judgement.title}</strong>
        {judgement.parties && <span className="jd-td-sub">{judgement.parties}</span>}
      </td>

      {/* Case Type */}
      <td data-label="Case Type" className="jd-col-type">
        <span className="jd-td-chip">{judgement.caseType}</span>
      </td>

      {/* Case Number */}
      <td data-label="Case No." className="jd-col-number">
        <span className="jd-td-mono">{judgement.caseNumber}</span>
      </td>

      {/* Status */}
      <td data-label="Status" className="jd-col-status">
        <StatusBadge status={judgement.status} />
      </td>

      {/* Last Modified */}
      <td data-label="Last Modified" className="jd-col-modified">
        {judgement.lastModified}
      </td>

      {/* Actions */}
      <td data-label="Actions" className="jd-col-actions">
        <ActionMenu
          onContinue={() => onContinue?.(judgement)}
          onView={() => onView?.(judgement)}
          onEdit={() => onEdit?.(judgement)}
          onShare={() => onShare?.(judgement)}
          onDelete={() => onDelete?.(judgement)}
        />
      </td>
    </motion.tr>
  )
}
