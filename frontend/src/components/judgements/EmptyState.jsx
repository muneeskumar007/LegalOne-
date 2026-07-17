import React from 'react'
import { FileX } from 'lucide-react'

export default function EmptyState({
  icon: Icon = FileX,
  title = 'No data available',
  description = '',
  className = '',
  children,
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-600 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-gray-400 text-center max-w-xs">{description}</p>
      )}
      {children}
    </div>
  )
}
