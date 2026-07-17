import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, FileCheck2, Gavel, Plus, Scale, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'

import StatCard        from '../components/judgements/StatCard'
import CategoryTabs    from '../components/judgements/CategoryTabs'
import SearchToolbar   from '../components/judgements/SearchToolbar'
import JudgementTable  from '../components/judgements/JudgementTable'
import Pagination      from '../components/judgements/Pagination'
import HelpButton      from '../components/HeaderActions/HelpButton'
import ThemeToggle     from '../components/HeaderActions/ThemeToggle'
import ProfileDropdown from '../components/HeaderActions/ProfileDropdown'

/* ─── Static config (no business values) ───────────────────────────── */

const STAT_CONFIG = [
  { title: 'Score',          description: 'Overall draft assessment',  icon: Award,      accent: 'blue'    },
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
 * JudgementsDashboard (AI Drafter)
 *
 * Top-level page component for the AI Drafter / My Cases view.
 *
 * All state-managed values (search, filters, active tab) are controlled here
 * and passed down as props. When backend integration begins, only the API call
 * and the `drafts`, `loading`, `page`, `totalPages`, `totalRecords` state
 * needs to be wired up — no child component changes required.
 */
export default function JudgementsDashboard() {
  const navigate = useNavigate()

  /* UI state only — no API calls */
  const [activeTab,    setActiveTab]    = useState('All Cases')
  const [search,       setSearch]       = useState('')
  const [filterValues, setFilterValues] = useState({ type: '', status: '', modified: '' })
  const [appliedSearch, setAppliedSearch] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ type: '', status: '', modified: '' })
  const [page,         setPage]         = useState(1)

  /* Future: replace these with API-sourced values from the draft/case list API */
  const judgements   = []
  const loading      = false
  const totalPages   = undefined
  const totalRecords = undefined
  const pageSize     = 6
  const stats        = STAT_CONFIG.map((s) => ({ ...s, value: undefined }))

  const activeFilterCount = [
    appliedSearch.trim(),
    ...Object.values(appliedFilters),
  ].filter(Boolean).length

  const visibleJudgements = judgements.filter((draft) => {
    const query = appliedSearch.trim().toLowerCase()
    const matchesSearch = !query || [
      draft.title,
      draft.parties,
      draft.caseNo,
      draft.caseNumber,
      draft.type,
      draft.case_type,
    ].some((value) => String(value || '').toLowerCase().includes(query))

    const matchesType = !appliedFilters.type || String(draft.type || draft.case_type || '').toLowerCase() === appliedFilters.type
    const matchesStatus = !appliedFilters.status || String(draft.status || '').toLowerCase() === appliedFilters.status
    const matchesModified = !appliedFilters.modified || String(draft.modifiedRange || draft.modified || '').toLowerCase().includes(appliedFilters.modified)

    return matchesSearch && matchesType && matchesStatus && matchesModified
  })

  /* Handlers (UI-only until backend is connected) */
  function handleFilterChange(name, value) {
    setFilterValues((prev) => ({ ...prev, [name]: value }))
  }
  function handleApplyFilters() {
    setAppliedSearch(search)
    setAppliedFilters(filterValues)
    setPage(1)
  }
  function handleClearFilters() {
    const cleared = { type: '', status: '', modified: '' }
    setSearch('')
    setFilterValues(cleared)
    setAppliedSearch('')
    setAppliedFilters(cleared)
    setPage(1)
  }
  function handleView(draft)     { /* onView handler placeholder     */ void draft }
  function handleContinue(draft) { /* onContinue handler placeholder */ void draft }
  function handleEdit(draft)     { /* onEdit handler placeholder     */ void draft }
  function handleShare(draft)    { /* onShare handler placeholder    */ void draft }
  function handleDelete(draft)   { /* onDelete handler placeholder   */ void draft }

  /**
   * handleNewDraft — navigates immediately to the existing /draft route.
   * This does NOT depend on draft/case list API responses or loading state.
   */
  function handleNewDraft() {
    navigate('/draft')
  }

  /* Merge filter values into config for SearchToolbar */
  const filtersWithValues = FILTERS_CONFIG.map((f) => ({
    ...f,
    value: filterValues[f.name],
  }))

  return (
    <section className="jd-page">
      {/* Toast notifications (react-hot-toast) */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Inter, DM Sans, system-ui, sans-serif',
            fontSize: 13,
            borderRadius: 8,
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        }}
      />

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
          {/* Help — opens AI Drafter help modal */}
          <HelpButton />

          {/* Theme toggle — light ↔ dark */}
          <ThemeToggle />

          {/* Profile avatar — dropdown with My Profile, Settings, Logout */}
          <ProfileDropdown />
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

          {/*
           * + New Draft button — navigates immediately to /draft.
           * NOT gated on any draft/case list API loading state.
           */}
          <motion.button
            type="button"
            className="jd-primary-button"
            onClick={handleNewDraft}
            aria-label="Create a new draft"
            whileHover={{ scale: 1.02, background: '#1f2937' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <Plus size={15} aria-hidden="true" />
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
          onFilter={handleApplyFilters}
          onClearFilters={handleClearFilters}
          activeFilterCount={activeFilterCount}
        />

        {/* Table */}
        <JudgementTable
          judgements={visibleJudgements}
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
