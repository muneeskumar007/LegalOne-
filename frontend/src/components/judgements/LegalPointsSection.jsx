import React from 'react'
import { BookOpen, Plus, ChevronDown, Edit2, Trash2 } from 'lucide-react'
import Button from './Button'
import EmptyState from './EmptyState'

function LegalPointCard({ point, index, onEdit, onDelete }) {
  return (
    <div className="flex items-start gap-4 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
      {/* Number Badge */}
      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-xs font-bold text-gray-500">{index + 1}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 font-medium leading-relaxed">
          {point.title}
        </p>
        {point.observation && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            <span className="font-medium text-gray-600">Observation:</span>{' '}
            {point.observation}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit?.(point.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
          aria-label="Edit"
        >
          <Edit2 size={15} />
        </button>
        <button
          onClick={() => onDelete?.(point.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
          aria-label="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

export default function LegalPointsSection({
  legalPoints = null,
  caseTitle = null,
  caseDetails = null,
  totalPoints = null,
  onAddPoint,
  onViewAll,
  onEditPoint,
  onDeletePoint,
  className = '',
}) {
  const isEmpty = !legalPoints || legalPoints.length === 0

  return (
    <div className={`bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Legal Points / Observations
          </h2>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            iconSize={14}
            onClick={onAddPoint}
          >
            Add Legal Point / Observation
          </Button>
        </div>

        {/* Case Reference */}
        {caseTitle && (
          <div className="mt-3 flex items-start gap-2.5">
            <BookOpen size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{caseTitle}</p>
              {caseDetails && (
                <p className="text-xs text-gray-500 mt-0.5">{caseDetails}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {isEmpty ? (
        <EmptyState
          icon={BookOpen}
          title="No legal points available."
          description="Legal points and observations will appear here once added."
          className="py-12"
        />
      ) : (
        <>
          {legalPoints.map((point, i) => (
            <LegalPointCard
              key={point.id || i}
              point={point}
              index={i}
              onEdit={onEditPoint}
              onDelete={onDeletePoint}
            />
          ))}

          {/* View All Button */}
          {totalPoints && totalPoints > legalPoints.length && (
            <div className="flex justify-center py-3 border-t border-gray-100">
              <button
                onClick={onViewAll}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                View All {totalPoints} Legal Points / Observations
                <ChevronDown size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
