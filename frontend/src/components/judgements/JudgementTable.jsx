import React from 'react'
import { Star, Eye, Copy, MoreVertical, Scale } from 'lucide-react'
import Badge from './Badge'
import EmptyState from './EmptyState'

const COLUMNS = [
  { key: 'favourite', label: '', width: 'w-10' },
  { key: 'caseName', label: 'Case Name & Citation', width: 'flex-1 min-w-[200px]' },
  { key: 'court', label: 'Court', width: 'w-40' },
  { key: 'year', label: 'Year', width: 'w-20' },
  { key: 'category', label: 'Category', width: 'w-40' },
  { key: 'addedOn', label: 'Added On', width: 'w-32' },
  { key: 'actions', label: 'Actions', width: 'w-28' },
]

function TableHeader() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50/50 rounded-t-xl">
      {COLUMNS.map((col) => (
        <div
          key={col.key}
          className={`${col.width} text-xs font-semibold text-gray-500 uppercase tracking-wider`}
        >
          {col.label}
        </div>
      ))}
    </div>
  )
}

function TableRow({ judgement, onToggleFavourite, onView, onCopy, onMore }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
      {/* Favourite */}
      <div className="w-10">
        <button
          onClick={() => onToggleFavourite?.(judgement.id)}
          className="text-gray-300 hover:text-amber-400 transition-colors cursor-pointer"
        >
          <Star
            size={18}
            fill={judgement.isFavourite ? 'currentColor' : 'none'}
            className={judgement.isFavourite ? 'text-amber-400' : ''}
          />
        </button>
      </div>

      {/* Case Name & Citation */}
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-semibold text-gray-900 leading-snug">
          {judgement.caseName}
        </p>
        {judgement.citation && (
          <p className="text-xs text-gray-500 mt-0.5">{judgement.citation}</p>
        )}
        {judgement.isKeyJudgement && (
          <Badge variant="purple" className="mt-1">
            Key Judgement
          </Badge>
        )}
      </div>

      {/* Court */}
      <div className="w-40">
        <span className="text-sm text-gray-600">{judgement.court}</span>
      </div>

      {/* Year */}
      <div className="w-20">
        <span className="text-sm text-gray-600 tabular-nums">{judgement.year}</span>
      </div>

      {/* Category */}
      <div className="w-40">
        <Badge variant="purple">{judgement.category}</Badge>
      </div>

      {/* Added On */}
      <div className="w-32">
        <span className="text-sm text-gray-500">{judgement.addedOn}</span>
      </div>

      {/* Actions */}
      <div className="w-28 flex items-center gap-1">
        <button
          onClick={() => onView?.(judgement.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
          aria-label="View"
        >
          <Eye size={16} />
        </button>
        <button
          onClick={() => onCopy?.(judgement.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
          aria-label="Copy"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={() => onMore?.(judgement.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
          aria-label="More actions"
        >
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  )
}

export default function JudgementTable({
  judgements = null,
  totalCount = null,
  onToggleFavourite,
  onView,
  onCopy,
  onMore,
  className = '',
}) {
  const isEmpty = !judgements || judgements.length === 0
  const heading = totalCount !== null
    ? `All Judgements (${totalCount.toLocaleString()})`
    : 'All Judgements'

  return (
    <div className={`bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* Section Heading */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">{heading}</h2>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Scale}
          title="No judgement data available."
          description="Judgements will appear here once data is loaded from the backend."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <TableHeader />
            {judgements.map((j) => (
              <TableRow
                key={j.id}
                judgement={j}
                onToggleFavourite={onToggleFavourite}
                onView={onView}
                onCopy={onCopy}
                onMore={onMore}
              />
            ))}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-100">
            {judgements.map((j) => (
              <div key={j.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{j.caseName}</p>
                    {j.citation && <p className="text-xs text-gray-500">{j.citation}</p>}
                  </div>
                  <button
                    onClick={() => onToggleFavourite?.(j.id)}
                    className="text-gray-300 hover:text-amber-400 ml-2"
                  >
                    <Star
                      size={16}
                      fill={j.isFavourite ? 'currentColor' : 'none'}
                      className={j.isFavourite ? 'text-amber-400' : ''}
                    />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>{j.court}</span>
                  <span>·</span>
                  <span>{j.year}</span>
                  <span>·</span>
                  <span>{j.addedOn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="purple">{j.category}</Badge>
                  {j.isKeyJudgement && <Badge variant="amber">Key Judgement</Badge>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
