import React from 'react'
import { HelpCircle, Moon, Plus, User } from 'lucide-react'
import Button from './Button'

export default function Header({
  title = 'Judgements',
  subtitle = 'Search, manage and refer to important judgements with key legal points.',
  onAddNew,
  onToggleTheme,
  onHelp,
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      {/* Left — Title & Subtitle */}
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onHelp}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Help"
        >
          <HelpCircle size={20} />
        </button>

        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Toggle theme"
        >
          <Moon size={20} />
        </button>

        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          <User size={18} className="text-gray-500" />
        </div>

        <Button
          icon={Plus}
          iconSize={18}
          onClick={onAddNew}
          className="ml-1"
        >
          Add New Judgement
        </Button>
      </div>
    </header>
  )
}
