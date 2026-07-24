// import EmptyState from './EmptyState'
// import { TableLoadingRows } from './LoadingSkeleton'
// import TableHeader from './TableHeader'
// import TableRow from './TableRow'

// /**
//  * JudgementTable — data table shell for all judgement records.
//  *
//  * Props:
//  *   judgements  {Array}    — array of judgement objects from the API
//  *   loading     {boolean}  — show skeleton rows when true
//  *   onView      {(j) => void}
//  *   onContinue  {(j) => void}
//  *   onEdit      {(j) => void}
//  *   onShare     {(j) => void}
//  *   onDelete    {(j) => void}
//  */
// export default function JudgementTable({
//   judgements = [],
//   loading = false,
//   onView,
//   onContinue,
//   onEdit,
//   onShare,
//   onDelete,
// }) {
//   const isEmpty = !loading && judgements.length === 0

//   return (
//     <div className="jd-table-shell" aria-label="Judgements table" role="region">
//       <div className="jd-table-scroll">
//         <table className="jd-table" aria-live="polite" aria-busy={loading}>
//           <TableHeader />
//           <tbody>
//             {loading ? (
//               <TableLoadingRows rows={6} />
//             ) : (
//               judgements.map((judgement) => (
//                 <TableRow
//                   key={judgement.id}
//                   judgement={judgement}
//                   onView={onView}
//                   onContinue={onContinue}
//                   onEdit={onEdit}
//                   onShare={onShare}
//                   onDelete={onDelete}
//                 />
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {isEmpty && <EmptyState />}
//     </div>
//   )
// }








import EmptyState from './EmptyState'
import { TableLoadingRows } from './LoadingSkeleton'
import TableHeader from './TableHeader'
import TableRow from './TableRow'

/**
 * JudgementTable — data table shell for all judgement records.
 *
 * Props:
 *   judgements  {Array}    — array of judgement objects from the API
 *   loading     {boolean}  — show skeleton rows when true
 *   onView      {(j) => void}
 *   onContinue  {(j) => void}
 *   onEdit      {(j) => void}
 *   onShare     {(j) => void}
 *   onDelete    {(j) => void}
 */
export default function JudgementTable({
  judgements = [],
  loading = false,
  onView,
  onContinue,
  onEdit,
  onShare,
  onDelete,
}) {
  const isEmpty = !loading && judgements.length === 0

  return (
    <div className="jd-table-shell" aria-label="Judgements table" role="region">
      <div className="jd-table-scroll">
        <table className="jd-table" aria-live="polite" aria-busy={loading}>
          <TableHeader />
          <tbody>
            {loading ? (
              <TableLoadingRows rows={6} />
            ) : (
              judgements.map((judgement) => (
                <TableRow
                  key={judgement.id}
                  judgement={judgement}
                  onView={onView}
                  onContinue={onContinue}
                  onEdit={onEdit}
                  onShare={onShare}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {isEmpty && <EmptyState />}
    </div>
  )
}
