import { useState } from 'react'
import {
  Award, CircleHelp, FileCheck2, Gavel,
  Moon, Plus, Scale, Sparkles, Sun, UserRound,
} from 'lucide-react'
import { motion } from 'framer-motion'

import StatCard       from '../components/judgements/StatCard'
import CategoryTabs   from '../components/judgements/CategoryTabs'
import SearchToolbar  from '../components/judgements/SearchToolbar'
import JudgementTable from '../components/judgements/JudgementTable'
import Pagination     from '../components/judgements/Pagination'

/* ─── Static config (no business values) ───────────────────────────── */

const STAT_CONFIG = [
  { title: 'Score',          description: 'Overall draft assessment',  icon: Award,     accent: 'blue'    },
  { title: 'Completeness',   description: 'Required case details',     icon: FileCheck2, accent: 'indigo'  },
  { title: 'Legal Accuracy', description: 'Legal reasoning review',    icon: Scale,      accent: 'violet'  },
  { title: 'Clarity',        description: 'Language & structure',      icon: Sparkles,   accent: 'emerald' },
  { title: 'Court Readiness',description: 'Filing preparedness',       icon: Gavel,      accent: 'amber'   },
]

const TABS_CONFIG = [
  'All Cases', 'Divorce', 'Notice', 'Petition', 'Affidavit', 'Other',
].map((label) => ({ label }))

const FILTERS_CONFIG = [
  {
    name: 'type',
    label: 'Case type',
    value: '',
    options: [
      { value: '',          label: 'All Case Types' },
      { value: 'divorce',   label: 'Divorce'        },
      { value: 'notice',    label: 'Notice'         },
      { value: 'petition',  label: 'Petition'       },
      { value: 'affidavit', label: 'Affidavit'      },
      { value: 'other',     label: 'Other'          },
    ],
  },
  {
    name: 'status',
    label: 'Case status',
    value: '',
    options: [
      { value: '',            label: 'All Status'   },
      { value: 'draft',       label: 'Draft'        },
      { value: 'in progress', label: 'In Progress'  },
      { value: 'review',      label: 'Review'       },
      { value: 'completed',   label: 'Completed'    },
      { value: 'filed',       label: 'Filed'        },
    ],
  },
  {
    name: 'modified',
    label: 'Last modified',
    value: '',
    options: [
      { value: '',        label: 'Last Modified' },
      { value: 'today',   label: 'Today'         },
      { value: 'week',    label: 'This Week'     },
      { value: 'month',   label: 'This Month'    },
      { value: 'quarter', label: 'This Quarter'  },
    ],
  },
]

/* ─── Animation variants ────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0  },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
}

/* ─── Component ─────────────────────────────────────────────────────── */

/**
 * JudgementsDashboard
 *
 * Top-level page component for the Judgements / My Cases view.
 *
 * All state-managed values (search, filters, active tab) are controlled here
 * and passed down as props. When backend integration begins, only the API call
 * and the `judgements`, `loading`, `page`, `totalPages`, `totalRecords` state
 * needs to be wired up — no child component changes required.
 */
export default function JudgementsDashboard() {
  /* UI state only — no API calls */
  const [activeTab,    setActiveTab]    = useState('All Cases')
  const [search,       setSearch]       = useState('')
  const [filterValues, setFilterValues] = useState({ type: '', status: '', modified: '' })
  const [darkHeader,   setDarkHeader]   = useState(false)
  const [page,         setPage]         = useState(1)

  /* Future: replace these with API-sourced values */
  const judgements  = []
  const loading     = false
  const totalPages  = undefined
  const totalRecords= undefined
  const pageSize    = 6
  const stats       = STAT_CONFIG.map((s) => ({ ...s, value: undefined }))

  /* Handlers (no-op until backend is connected) */
  function handleFilterChange(name, value) {
    setFilterValues((prev) => ({ ...prev, [name]: value }))
  }
  function handleView(judgement)     { /* onView handler placeholder     */ void judgement }
  function handleContinue(judgement) { /* onContinue handler placeholder */ void judgement }
  function handleEdit(judgement)     { /* onEdit handler placeholder     */ void judgement }
  function handleShare(judgement)    { /* onShare handler placeholder    */ void judgement }
  function handleDelete(judgement)   { /* onDelete handler placeholder   */ void judgement }
  function handleNewDraft()          { /* onNewDraft handler placeholder */ }

  /* Merge filter values into config for SearchToolbar */
  const filtersWithValues = FILTERS_CONFIG.map((f) => ({
    ...f,
    value: filterValues[f.name],
  }))

  return (
    <section className="jd-page">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <motion.header
        className="jd-app-header"
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="jd-eyebrow">LEGALONE WORKSPACE</p>
          <h1>AI DRAFTER</h1>
          <p className="jd-header-subtitle">
            Describe your case in simple words and let AI create your legal draft.
          </p>
        </div>

        <div className="jd-header-actions">
          <button
            type="button"
            aria-label="Help"
            title="Help"
          >
            <CircleHelp size={18} />
          </button>

          <button
            type="button"
            aria-label="Toggle theme"
            title="Toggle theme"
            onClick={() => setDarkHeader((d) => !d)}
          >
            {darkHeader ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            className="jd-profile-button"
            aria-label="User profile"
            title="User profile"
          >
            <UserRound size={17} />
          </button>
        </div>
      </motion.header>

      {/* ── Statistics Cards ─────────────────────────────────────────── */}
      <motion.div
        className="jd-stat-grid"
        variants={stagger}
        initial="hidden"
        animate="show"
        aria-label="Case metrics"
      >
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={fadeUp}>
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              description={stat.description}
              accent={stat.accent}
              loading={loading}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* ── My Cases Section ─────────────────────────────────────────── */}
      <motion.section
        className="jd-cases-section"
        aria-labelledby="my-cases-heading"
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        {/* Section heading + CTA */}
        <div className="jd-section-heading">
          <div>
            <h2 id="my-cases-heading">My Cases</h2>
            <p>View, manage and continue your legal drafting work.</p>
          </div>

          <motion.button
            type="button"
            className="jd-primary-button"
            onClick={handleNewDraft}
            aria-label="Create a new draft"
            whileHover={{ scale: 1.03, boxShadow: '0 8px 20px rgba(45,74,148,.28)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <Plus size={16} aria-hidden="true" />
            New Draft
          </motion.button>
        </div>

        {/* Category tabs */}
        <CategoryTabs
          tabs={TABS_CONFIG}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {/* Search & filters */}
        <SearchToolbar
          search={search}
          filters={filtersWithValues}
          onSearch={setSearch}
          onFilterChange={handleFilterChange}
        />

        {/* Table */}
        <JudgementTable
          judgements={judgements}
          loading={loading}
          onView={handleView}
          onContinue={handleContinue}
          onEdit={handleEdit}
          onShare={handleShare}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </motion.section>
    </section>
  )
}
