/**
 * LoadingSkeleton — animated shimmer placeholder.
 *
 * Props:
 *   className {string}  — additional CSS classes (e.g. width/height overrides)
 *   style     {object}  — optional inline style overrides
 */
export default function LoadingSkeleton({ className = '', style }) {
  return (
    <span
      className={`jd-skeleton ${className}`}
      aria-hidden="true"
      role="presentation"
      style={style}
    />
  )
}

/**
 * TableLoadingRows — 5 skeleton rows for the judgements table body.
 * Each row mimics the real column structure so layout doesn't shift on load.
 */
export function TableLoadingRows({ rows = 5 }) {
  return Array.from({ length: rows }, (_, i) => (
    <tr key={i} className="jd-loading-row" aria-hidden="true">
      {/* Case Title / Parties */}
      <td className="jd-col-title">
        <LoadingSkeleton className="jd-sk-title" />
        <LoadingSkeleton className="jd-sk-sub" />
      </td>
      {/* Case Type */}
      <td className="jd-col-type"><LoadingSkeleton className="jd-sk-chip" /></td>
      {/* Case No. */}
      <td className="jd-col-number"><LoadingSkeleton className="jd-sk-mono" /></td>
      {/* Status */}
      <td className="jd-col-status"><LoadingSkeleton className="jd-sk-badge" /></td>
      {/* Last Modified */}
      <td className="jd-col-modified"><LoadingSkeleton className="jd-sk-date" /></td>
      {/* Actions */}
      <td className="jd-col-actions"><LoadingSkeleton className="jd-sk-actions" /></td>
    </tr>
  ))
}
