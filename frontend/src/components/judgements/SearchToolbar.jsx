import { Filter, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import FilterDropdown from './FilterDropdown'

/**
 * SearchToolbar — search input + filter dropdowns + filter button.
 *
 * Props:
 *   search         {string}
 *   filters        {Array<{ name, label, value, options }>}
 *   onSearch       {(value: string) => void}
 *   onFilterChange {(name: string, value: string) => void}
 *   onFilter       {() => void}          — optional filter-button click handler
 */
export default function SearchToolbar({
  search = '',
  filters = [],
  onSearch,
  onFilterChange,
  onFilter,
}) {
  return (
    <div className="jd-toolbar" role="search" aria-label="Case search and filters">
      {/* Search input */}
      <label className="jd-search">
        <Search size={16} aria-hidden="true" color="#98a3b4" />
        <span className="sr-only">Search judgements</span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch?.(e.target.value)}
          placeholder="Search by title, parties, or case number…"
          aria-label="Search judgements"
        />
      </label>

      {/* Dynamic filter dropdowns */}
      {filters.map((filter) => (
        <FilterDropdown
          key={filter.name}
          label={filter.label}
          value={filter.value}
          options={filter.options}
          onChange={(value) => onFilterChange?.(filter.name, value)}
        />
      ))}

      {/* Filter action button */}
      <motion.button
        type="button"
        className="jd-filter-button"
        onClick={onFilter}
        aria-label="Open advanced filters"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15 }}
      >
        <Filter size={15} aria-hidden="true" />
        <span>Filter</span>
      </motion.button>
    </div>
  )
}
