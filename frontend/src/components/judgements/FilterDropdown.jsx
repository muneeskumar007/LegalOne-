import { CalendarDays, Check, ChevronDown, FileText, Filter } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

/**
 * FilterDropdown — select wrapper with floating chevron.
 *
 * Props:
 *   label    {string}
 *   value    {string}
 *   options  {Array<{ value: string, label: string }>}
 *   onChange {(value: string) => void}
 */
const ICONS = {
  'Case type': FileText,
  'Case status': Filter,
  'Last modified': CalendarDays,
}

export default function FilterDropdown({ label, value, options = [], onChange }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const buttonRef = useRef(null)
  const wrapRef = useRef(null)
  const listboxId = useId()
  const selected = useMemo(
    () => options.find((opt) => opt.value === value) || options[0],
    [options, value],
  )
  const Icon = ICONS[label] || Filter

  useEffect(() => {
    if (!open) return
    function onPointerDown(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    const selectedIndex = Math.max(0, options.findIndex((opt) => opt.value === value))
    setActiveIndex(selectedIndex)
  }, [options, value])

  function choose(nextValue) {
    onChange?.(nextValue)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function handleButtonKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setActiveIndex((current) => {
        if (e.key === 'ArrowDown') return Math.min(options.length - 1, current + 1)
        return Math.max(0, current - 1)
      })
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((current) => !current)
    }
  }

  function handleOptionKeyDown(e, option, index) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      choose(option.value)
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(Math.min(options.length - 1, index + 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(Math.max(0, index - 1))
    }
  }

  return (
    <div className="jd-select-wrap" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`jd-select-button ${value ? 'has-value' : ''}`}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleButtonKeyDown}
      >
        <Icon size={14} aria-hidden="true" />
        <span>{selected?.label || label}</span>
        <ChevronDown size={14} aria-hidden="true" className="jd-select-chevron" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="jd-select-menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isActive = index === activeIndex
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`jd-select-option ${isSelected ? 'is-selected' : ''} ${isActive ? 'is-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(option.value)}
                  onKeyDown={(e) => handleOptionKeyDown(e, option, index)}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check size={14} aria-hidden="true" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
