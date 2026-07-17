import { CircleHelp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import HelpModal from './HelpModal'

/**
 * HelpButton — circular icon button that opens the AI Drafter help modal.
 * Sits in the jd-header-actions row and re-uses its existing CSS.
 */
export default function HelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.button
        type="button"
        aria-label="Open AI Drafter help"
        title="Help"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        transition={{ duration: 0.15 }}
      >
        <CircleHelp size={18} aria-hidden="true" />
      </motion.button>

      <HelpModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
