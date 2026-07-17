import React from 'react'
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react'

function FilterDropdown({ label, options = [], value, onChange }) {
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={onChange}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-9 text-sm text-gray-700 font-medium cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all min-w-[140px]"
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  )
}

export default function SearchFilters({
  searchValue = '',
  onSearchChange,
  categoryValue,
  onCategoryChange,
  courtValue,
  onCourtChange,
  yearValue,
  onYearChange,
  onFilter,
  categories = [],
  courts = [],
  years = [],
}) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 mb-6">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search judgements by case name, citation, court or keyword..."
          value={searchValue}
          onChange={onSearchChange}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterDropdown
          label="All Categories"
          options={categories}
          value={categoryValue}
          onChange={onCategoryChange}
        />
        <FilterDropdown
          label="All Courts"
          options={courts}
          value={courtValue}
          onChange={onCourtChange}
        />
        <FilterDropdown
          label="All Years"
          options={years}
          value={yearValue}
          onChange={onYearChange}
        />

        {/* Filter Button */}
        <button
          onClick={onFilter}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>
    </div>
  )
}
