// import { motion } from 'framer-motion'
// import StatusBadge from './StatusBadge'
// import ActionMenu from './ActionMenu'

// /**
//  * Maps a case type string to a colour variant class for the type chip.
//  * Purely presentational — does not change the underlying data.
//  */
// function getTypeChipClass(caseType) {
//   const key = (caseType || '').toLowerCase()
//   if (key.includes('divorce'))   return 'jd-td-chip--divorce'
//   if (key.includes('notice'))    return 'jd-td-chip--notice'
//   if (key.includes('petition'))  return 'jd-td-chip--petition'
//   if (key.includes('affidavit')) return 'jd-td-chip--affidavit'
//   if (key.includes('counter'))   return 'jd-td-chip--counter'
//   if (key.includes('argument'))  return 'jd-td-chip--arguments'
//   return ''
// }

// /**
//  * TableRow — single data row in the Judgements table.
//  *
//  * Props:
//  *   judgement {object}  — API response shape:
//  *     { id, title, parties, caseType, caseNumber, status, lastModified }
//  *   onView     {(judgement) => void}
//  *   onContinue {(judgement) => void}
//  *   onEdit     {(judgement) => void}
//  *   onShare    {(judgement) => void}
//  *   onDelete   {(judgement) => void}
//  */
// export default function TableRow({ judgement, onView, onContinue, onEdit, onShare, onDelete }) {
//   return (
//     <motion.tr
//       className="jd-table-row"
//       initial={{ opacity: 0, y: 4 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.2 }}
//       whileHover={{ backgroundColor: '#f8fafc' }}
//     >
//       {/* Case Title + Parties */}
//       <td data-label="Case Title / Parties" className="jd-col-title">
//         <strong>{judgement.title}</strong>
//         {judgement.parties && <span className="jd-td-sub">{judgement.parties}</span>}
//       </td>

//       {/* Case Type */}
//       <td data-label="Case Type" className="jd-col-type">
//         <span className={`jd-td-chip ${getTypeChipClass(judgement.caseType)}`}>
//           {judgement.caseType}
//         </span>
//       </td>

//       {/* Case Number */}
//       <td data-label="Case No." className="jd-col-number">
//         <span className="jd-td-mono">{judgement.caseNumber}</span>
//       </td>

//       {/* Status */}
//       <td data-label="Status" className="jd-col-status">
//         <StatusBadge status={judgement.status} />
//       </td>

//       {/* Last Modified */}
//       <td data-label="Last Modified" className="jd-col-modified">
//         {judgement.lastModified}
//       </td>

//       {/* Actions */}
//       <td data-label="Actions" className="jd-col-actions">
//         <ActionMenu
//           onContinue={() => onContinue?.(judgement)}
//           onView={() => onView?.(judgement)}
//           onEdit={() => onEdit?.(judgement)}
//           onShare={() => onShare?.(judgement)}
//           onDelete={() => onDelete?.(judgement)}
//         />
//       </td>
//     </motion.tr>
//   )
// }











import { motion } from 'framer-motion'
import StatusBadge from './StatusBadge'
import ActionMenu from './ActionMenu'

/**
 * Maps a case type string to a colour variant class for the type chip.
 * Purely presentational — does not change the underlying data.
 */
function getTypeChipClass(caseType) {
  const key = (caseType || '').toLowerCase()
  if (key.includes('divorce'))   return 'jd-td-chip--divorce'
  if (key.includes('notice'))    return 'jd-td-chip--notice'
  if (key.includes('petition'))  return 'jd-td-chip--petition'
  if (key.includes('affidavit')) return 'jd-td-chip--affidavit'
  if (key.includes('counter'))   return 'jd-td-chip--counter'
  if (key.includes('argument'))  return 'jd-td-chip--arguments'
  return ''
}

/** Small caption shown under the Status pill, e.g. "Drafting", "Ready to Export" */
function getStatusCaption(status) {
  const key = (status || '').toLowerCase().trim()
  const map = {
    draft: 'Not Started',
    'in progress': 'Drafting',
    review: 'Needs Review',
    completed: 'Ready to Export',
    filed: 'Filed with Court',
    rejected: 'Rejected',
    pending: 'Pending Review',
  }
  return map[key]
}

/**
 * TableRow — single data row in the Judgements table.
 *
 * Props:
 *   judgement {object}  — API response shape:
 *     { id, title, parties, caseType, caseCategory, caseNumber, status, lastModified }
 *   onView     {(judgement) => void}
 *   onContinue {(judgement) => void}
 *   onEdit     {(judgement) => void}
 *   onShare    {(judgement) => void}
 *   onDelete   {(judgement) => void}
 */
export default function TableRow({ judgement, onView, onContinue, onEdit, onShare, onDelete }) {
  const statusCaption = getStatusCaption(judgement.status)

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
        <span className={`jd-td-chip ${getTypeChipClass(judgement.caseType)}`}>
          {judgement.caseType}
        </span>
        {judgement.caseCategory && (
          <span className="jd-td-caption">{judgement.caseCategory}</span>
        )}
      </td>

      {/* Case Number */}
      <td data-label="Case No." className="jd-col-number">
        <span className="jd-td-mono">{judgement.caseNumber || '—'}</span>
      </td>

      {/* Status */}
      <td data-label="Status" className="jd-col-status">
        <StatusBadge status={judgement.status} />
        {statusCaption && <span className="jd-td-caption">{statusCaption}</span>}
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
