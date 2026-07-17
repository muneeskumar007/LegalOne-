import React from 'react'

export default function StatisticCard({
  icon: Icon,
  iconBgColor = 'bg-purple-100',
  iconColor = 'text-purple-600',
  title = 'Statistic',
  value = null,
  subtitle = '',
  className = '',
}) {
  const displayValue = value !== null && value !== undefined ? value : '--'

  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {/* Icon */}
      {Icon && (
        <div
          className={`w-11 h-11 rounded-xl ${iconBgColor} flex items-center justify-center flex-shrink-0`}
        >
          <Icon size={22} className={iconColor} />
        </div>
      )}

      {/* Content */}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">
          {displayValue}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  )
}
