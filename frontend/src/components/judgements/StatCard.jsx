import { motion } from 'framer-motion'

/**
 * StatCard — reusable metric card for the Judgements Dashboard.
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

  return (
    <motion.article
      className={`jd-stat-card ${cardCls}`}
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(31,49,84,.1)' }}
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
          <motion.span
            className={`jd-stat-icon ${iconCls}`}
            aria-hidden="true"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.15 }}
          >
            <Icon size={18} strokeWidth={2} />
          </motion.span>
          <p className="jd-stat-title">{title}</p>
          <p className="jd-stat-value">{value ?? '—'}</p>
          <p className="jd-stat-description">{description}</p>
          {/* decorative circle */}
          <span className="jd-sc-deco" aria-hidden="true" />
        </>
      )}
    </motion.article>
  )
}
