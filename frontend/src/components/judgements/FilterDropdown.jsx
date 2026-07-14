import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

/**
 * FilterDropdown — select wrapper with floating chevron.
 *
 * Props:
 *   label    {string}
 *   value    {string}
 *   options  {Array<{ value: string, label: string }>}
 *   onChange {(value: string) => void}
 */
export default function FilterDropdown({ label, value, options = [], onChange }) {
  return (
    <motion.label
      className="jd-select-wrap"
      whileFocus={{ borderColor: '#7792cc' }}
      title={label}
    >
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </motion.label>
  )
}
