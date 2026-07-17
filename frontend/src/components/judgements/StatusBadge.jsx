/**
 * StatusBadge — colour-coded pill for case status values.
 *
 * Supported statuses (case-insensitive):
 *   draft | in progress | review | completed | filed | rejected | pending
 *
 * Props:
 *   status {string}
 */

const STATUS_STYLES = {
  draft:        'jd-badge--draft',
  'in progress':'jd-badge--progress',
  review:       'jd-badge--review',
  completed:    'jd-badge--completed',
  filed:        'jd-badge--filed',
  rejected:     'jd-badge--rejected',
  pending:      'jd-badge--pending',
}

export default function StatusBadge({ status }) {
  if (!status) return null
  const key = status.toLowerCase().trim()
  const cls = STATUS_STYLES[key] ?? 'jd-badge--default'

  return (
    <span className={`jd-status-badge ${cls}`} aria-label={`Status: ${status}`}>
      <span className="jd-badge-dot" aria-hidden="true" />
      {status}
    </span>
  )
}
