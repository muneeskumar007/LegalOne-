import { useState } from 'react'
import {
  HelpCircle,
  Moon,
  User,
  Paperclip,
  Lightbulb,
  FileEdit,
  Landmark,
  RotateCcw,
  ClipboardList,
  BarChart2,
  MoreHorizontal,
  Info,
  Sparkles,
} from 'lucide-react'

/* ─── Draft type definitions ──────────────────────────────────────────────── */
const DRAFT_TYPES = [
  {
    id: 'legal-notice',
    label: 'Legal Notice',
    sub: 'Draft a legal notice',
    Icon: FileEdit,
  },
  {
    id: 'petition',
    label: 'Petition',
    sub: 'Draft a petition for filing',
    Icon: Landmark,
  },
  {
    id: 'counter-reply',
    label: 'Counter / Reply',
    sub: 'Draft a counter or reply',
    Icon: RotateCcw,
  },
  {
    id: 'proof-affidavit',
    label: 'Proof Affidavit',
    sub: 'Draft a proof affidavit',
    Icon: ClipboardList,
  },
  {
    id: 'arguments',
    label: 'Arguments',
    sub: 'Draft written arguments',
    Icon: BarChart2,
  },
  {
    id: 'other',
    label: 'Other',
    sub: 'Other types of drafting',
    Icon: MoreHorizontal,
  },
]

/* ─── Main component ──────────────────────────────────────────────────────── */
export default function DraftPage() {
  const [selectedDraft, setSelectedDraft] = useState('legal-notice')
  const [text, setText] = useState('')

  const MAX = 5000

  const handleTextChange = (e) => {
    if (e.target.value.length <= MAX) setText(e.target.value)
  }

  const handleGenerate = () => {
    console.log(selectedDraft)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">

      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-7 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-widest uppercase">
            AI DRAFTER
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Describe your case in simple words and let AI create your legal draft.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <HelpCircle size={18} strokeWidth={1.5} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <Moon size={18} strokeWidth={1.5} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <User size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ── Main scrollable body ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-7 py-5 flex flex-col gap-5">

        {/* ── Textarea Card ────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Textarea */}
          <div className="relative">
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Start typing your case details in simple words..."
              className="w-full resize-none border-none outline-none px-5 pt-4 pb-2 text-sm text-gray-700 placeholder-gray-400 min-h-[60px] bg-transparent leading-relaxed"
              rows={3}
            />
            {/* Example text — always visible below placeholder area */}
            <div className="px-5 pb-5">
              <p className="text-xs text-gray-500 mb-1">For example:</p>
              <p className="text-xs text-gray-500 italic leading-6">
                "I want to file a divorce petition on the ground of cruelty.<br />
                We were married on 15 June 2015 at Delhi.<br />
                We are residing at 123, Green Park, New Delhi..."
              </p>
            </div>
          </div>

          {/* Card Footer */}
          <div className="border-t border-gray-200 px-5 py-3 flex items-center justify-between">
            {/* Attach Document */}
            <div className="flex items-center gap-2 cursor-pointer">
              <Paperclip size={14} strokeWidth={1.5} className="text-gray-500" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-700">
                  Attach Document <span className="font-normal">(Optional)</span>
                </span>
                <span className="text-[10px] text-gray-400">PDF, DOC, DOCX (Max 10MB)</span>
              </div>
            </div>

            {/* Right: bulb + counter */}
            <div className="flex items-center gap-3">
              <Lightbulb size={15} strokeWidth={1.5} className="text-gray-400" />
              <span className="text-xs text-gray-400">
                {text.length} / {MAX} characters
              </span>
            </div>
          </div>
        </div>

        {/* ── Draft Type Section ───────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            1. Select type of drafting
          </h2>
          <div className="grid grid-cols-6 gap-3">
            {DRAFT_TYPES.map(({ id, label, sub, Icon }) => {
              const isActive = selectedDraft === id
              return (
                <button
                  key={id}
                  onClick={() => setSelectedDraft(id)}
                  className={[
                    'relative flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-xl bg-white text-center transition-all',
                    isActive
                      ? 'border-2 border-gray-900'
                      : 'border border-gray-200 hover:border-gray-400',
                  ].join(' ')}
                >
                  {/* Check badge */}
                  {isActive && (
                    <span className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M2 5l2.5 2.5 3.5-4"
                          stroke="#fff"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                  <Icon size={26} strokeWidth={1.5} className="text-gray-700" />
                  <span className="text-xs font-semibold text-gray-900 leading-tight">
                    {label}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-tight">{sub}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Bottom Section ───────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4">
          {/* Info Box */}
          <div className="flex items-start gap-2.5 flex-1">
            <Info size={15} strokeWidth={1.5} className="text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">How it works?</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Just type or paste the facts of your case in simple words. Our AI will understand the
                details, ask for any missing information, and generate a complete legal draft including
                all necessary clauses like verification, affidavit, etc.
              </p>
            </div>
          </div>

          {/* Generate Section */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
            >
              <Sparkles size={15} strokeWidth={1.5} />
              Generate Draft
            </button>
            <p className="text-[10px] text-gray-400 text-center">
              AI drafts can make mistakes. Please review before use.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}