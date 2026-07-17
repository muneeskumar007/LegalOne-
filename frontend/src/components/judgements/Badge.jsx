import React from 'react'

const variants = {
  default:
    'bg-gray-100 text-gray-700 border-gray-200',
  purple:
    'bg-purple-50 text-purple-700 border-purple-200',
  blue:
    'bg-blue-50 text-blue-700 border-blue-200',
  green:
    'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber:
    'bg-amber-50 text-amber-700 border-amber-200',
  red:
    'bg-red-50 text-red-700 border-red-200',
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full
        text-xs font-medium border whitespace-nowrap
        ${variants[variant] || variants.default}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
