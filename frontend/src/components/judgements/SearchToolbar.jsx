import { Filter, Search, X } from 'lucide-react'
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
  onClearFilters,
  activeFilterCount = 0,
}) {
  const hasSearch = search.trim().length > 0
  const hasActiveFilters = activeFilterCount > 0

  function handleKeyDown(e) {
    if (e.key === 'Enter') onFilter?.()
  }

  return (
    <div className="jd-toolbar" role="search" aria-label="Case search and filters">
      {/* Search input */}
      <label className="jd-search">
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Search drafts</span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch?.(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search drafts by title, parties, case no. or type..."
          aria-label="Search drafts"
        />
        {hasSearch && (
          <button
            type="button"
            className="jd-search-clear"
            onClick={() => onSearch?.('')}
            aria-label="Clear search"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
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
        className={`jd-filter-button ${hasActiveFilters ? 'is-active' : ''}`}
        onClick={onFilter}
        aria-label="Apply filters"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15 }}
      >
        <Filter size={15} aria-hidden="true" />
        <span>Filter</span>
        {hasActiveFilters && (
          <span className="jd-filter-count" aria-label={`${activeFilterCount} active filters`}>
            {activeFilterCount}
          </span>
        )}
      </motion.button>

      {hasActiveFilters && (
        <button
          type="button"
          className="jd-clear-filters"
          onClick={onClearFilters}
          aria-label="Clear active filters"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}
