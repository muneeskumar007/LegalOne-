import { Moon, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../../context/ThemeContext'

/* ─── Animation ──────────────────────────────────────────────────────── */

const iconVariants = {
  initial: { opacity: 0, rotate: -90, scale: 0.6 },
  animate: { opacity: 1, rotate: 0,   scale: 1    },
  exit:    { opacity: 0, rotate:  90, scale: 0.6  },
}

const iconTransition = { duration: 0.22, ease: 'easeOut' }

/* ─── Component ──────────────────────────────────────────────────────── */

/**
 * ThemeToggle — circular icon button that switches between light and dark mode.
 *
 * - Reads / writes theme via ThemeContext (localStorage-backed).
 * - Moon icon  → click to switch to dark mode.
 * - Sun  icon  → click to switch back to light mode.
 * - Icon swap is animated with Framer Motion (rotate + fade).
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <motion.button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleTheme}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="sun"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={iconTransition}
            style={{ display: 'inline-flex' }}
            aria-hidden="true"
          >
            <Sun size={17} />
          </motion.span>
        ) : (
          <motion.span
            key="moon"
            variants={iconVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={iconTransition}
            style={{ display: 'inline-flex' }}
            aria-hidden="true"
          >
            <Moon size={17} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
