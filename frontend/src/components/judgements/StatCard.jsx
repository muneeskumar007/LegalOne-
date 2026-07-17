import { motion } from 'framer-motion'

/**
 * StatCard — reusable metric card for the AI Drafter dashboard.
 *
 * Props:
 *   title       {string}       Card heading
 *   value       {string|number} Primary display value (empty → shows dash)
 *   description {string}       Helper text beneath the value
 *   icon        {Component}    Lucide-react icon component
 *   accent      {string}       Tailwind colour key: 'blue'|'indigo'|'violet'|'emerald'|'amber'
 *   loading     {boolean}
 */

const ACCENT_MAP = {
  blue:    { icon: 'jd-sc-icon--blue',    card: 'jd-sc--blue'    },
  indigo:  { icon: 'jd-sc-icon--indigo',  card: 'jd-sc--indigo'  },
  violet:  { icon: 'jd-sc-icon--violet',  card: 'jd-sc--violet'  },
  emerald: { icon: 'jd-sc-icon--emerald', card: 'jd-sc--emerald' },
  amber:   { icon: 'jd-sc-icon--amber',   card: 'jd-sc--amber'   },
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent = 'blue',
  loading = false,
}) {
  const { icon: iconCls, card: cardCls } = ACCENT_MAP[accent] ?? ACCENT_MAP.blue
  const numericScore = title === 'Score' && value != null && Number.isFinite(Number(value))
  const score = numericScore ? Math.min(100, Math.max(0, Number(value))) : null

  return (
    <motion.article
      className={`jd-stat-card ${cardCls}`}
      whileHover={{ boxShadow: '0 2px 6px rgba(0,0,0,.06)' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      aria-label={`${title} metric card`}
    >
      {loading ? (
        <>
          <div className="jd-skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} />
          <div className="jd-skeleton jd-sc-skel-title" />
          <div className="jd-skeleton jd-sc-skel-value" />
          <div className="jd-skeleton jd-sc-skel-desc" />
        </>
      ) : (
        <>
          {numericScore ? (
            <span className="jd-score-circle" style={{ '--jd-score-progress': `${score * 3.6}deg` }} aria-label={`Score ${score} percent`}>
              <span className="jd-score-number">{score}</span>
              <span className="jd-score-label">SCORE</span>
            </span>
          ) : (
            <span className={`jd-stat-icon ${iconCls}`} aria-hidden="true">
              <Icon size={16} strokeWidth={2} />
            </span>
          )}
          <div className="jd-stat-text">
          <p className="jd-stat-title">{title}</p>
          <p className="jd-stat-value">{value ?? '—'}</p>
          <p className="jd-stat-description">{description}</p>
          </div>
          {/* decorative circle */}
          <span className="jd-sc-deco" aria-hidden="true" />
        </>
      )}
    </motion.article>
  )
}
