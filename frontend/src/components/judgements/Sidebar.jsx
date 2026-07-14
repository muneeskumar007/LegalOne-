import React from 'react'
import { FolderOpen } from 'lucide-react'

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-2.5 px-3 animate-pulse">
      <div className="flex items-center gap-2.5">
        <div className="w-4 h-4 bg-gray-200 rounded" />
        <div className="h-3.5 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-3.5 w-8 bg-gray-200 rounded" />
    </div>
  )
}

function CategoryItem({ name, count, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm transition-all cursor-pointer ${
        isActive
          ? 'bg-gray-100 text-gray-900 font-semibold'
          : 'text-gray-600 hover:bg-gray-50 font-medium'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <FolderOpen size={15} className={isActive ? 'text-gray-700' : 'text-gray-400'} />
        <span className="truncate">{name}</span>
      </div>
      {count !== undefined && count !== null ? (
        <span className={`text-xs tabular-nums ${isActive ? 'text-gray-700' : 'text-gray-400'}`}>
          {count.toLocaleString()}
        </span>
      ) : (
        <span className="text-xs text-gray-300">—</span>
      )}
    </button>
  )
}

export default function Sidebar({
  categories = null,
  activeCategory = null,
  onCategorySelect,
  className = '',
}) {
  const isLoading = categories === null

  return (
    <aside className={`w-full lg:w-56 flex-shrink-0 ${className}`}>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          Categories
        </h2>

        <div className="space-y-0.5">
          {isLoading ? (
            /* Skeleton loading placeholders */
            <>
              {[...Array(8)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </>
          ) : categories.length > 0 ? (
            categories.map((cat) => (
              <CategoryItem
                key={cat.id || cat.name}
                name={cat.name}
                count={cat.count}
                isActive={activeCategory === (cat.id || cat.name)}
                onClick={() => onCategorySelect?.(cat.id || cat.name)}
              />
            ))
          ) : (
            <p className="text-xs text-gray-400 text-center py-6">
              No categories available.
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
