import { useEffect, useMemo, useRef, useState } from 'react'

import barChartIcon from '../assets/icons8/bar-chart.svg'
import calendarIcon from '../assets/icons8/calendar.svg'
import checkIcon from '../assets/icons8/check.svg'
import chevronRightIcon from '../assets/icons8/chevron-right.svg'
import clipboardIcon from '../assets/icons8/clipboard.svg'
import closeIcon from '../assets/icons8/close.svg'
import courthouseIcon from '../assets/icons8/courthouse.svg'
import documentIcon from '../assets/icons8/document.svg'
import gavelIcon from '../assets/icons8/gavel.svg'
import helpIcon from '../assets/icons8/help.svg'
import infoIcon from '../assets/icons8/info.svg'
import lightbulbIcon from '../assets/icons8/lightbulb.svg'
import moonIcon from '../assets/icons8/moon.svg'
import paperclipIcon from '../assets/icons8/paperclip.svg'
import paragraphIcon from '../assets/icons8/paragraph.svg'
import rotateIcon from '../assets/icons8/rotate.svg'
import sparkleIcon from '../assets/icons8/sparkle.svg'
import userIcon from '../assets/icons8/user.svg'

const DRAFT_TYPES = [
  { id: 'legal-notice', label: 'Legal Notice', sub: 'Draft a legal notice', icon: documentIcon },
  { id: 'petition', label: 'Petition', sub: 'Draft a petition for filing', icon: courthouseIcon },
  { id: 'counter-reply', label: 'Counter / Reply', sub: 'Draft a counter or reply', icon: rotateIcon },
  { id: 'proof-affidavit', label: 'Proof Affidavit', sub: 'Draft a proof affidavit', icon: clipboardIcon },
  { id: 'arguments', label: 'Arguments', sub: 'Draft written arguments', icon: barChartIcon },
  { id: 'other', label: 'Other', sub: 'Other types of drafting', icon: paragraphIcon },
]

const initialCaseDetails = {
  petitioner: { name: '', age: '', gender: '', occupation: '', address: '', phone: '', email: '' },
  respondent: { name: '', age: '', gender: '', occupation: '', address: '', phone: '', email: '' },
  marriage: { date: '', place: '', type: '' },
  jurisdiction: { courtName: '', courtType: '', city: '', state: '' },
  relief: { selected: [] },
  facts: '',
  previousCase: { hasPreviousCase: '', caseNumber: '', court: '', year: '', status: '' },
  other: '',
}

const sectionMeta = {
  petitioner: { label: 'Petitioner', icon: userIcon },
  respondent: { label: 'Respondent', icon: userIcon },
  marriage: { label: 'Marriage', icon: calendarIcon },
  jurisdiction: { label: 'Jurisdiction', icon: courthouseIcon },
  relief: { label: 'Relief', icon: documentIcon },
  facts: { label: 'Facts', icon: paragraphIcon },
  previousCase: { label: 'Previous Case', icon: gavelIcon },
  other: { label: 'Other Relevant Information', icon: infoIcon, optional: true },
}

const requiredFieldLabels = {
  petitioner: [
    ['name', 'Name'],
    ['age', 'Age'],
    ['gender', 'Gender'],
    ['occupation', 'Occupation'],
    ['address', 'Address'],
  ],
  respondent: [
    ['name', 'Name'],
    ['age', 'Age'],
    ['gender', 'Gender'],
    ['occupation', 'Occupation'],
    ['address', 'Address'],
  ],
  marriage: [
    ['date', 'Date'],
    ['place', 'Place'],
    ['type', 'Marriage Type'],
  ],
  jurisdiction: [
    ['courtName', 'Court Name'],
    ['courtType', 'Court Type'],
    ['city', 'City'],
    ['state', 'State'],
  ],
}

const marriageTypes = [
  'Hindu Marriage Act',
  'Special Marriage Act',
  'Muslim Marriage',
  'Christian Marriage',
  'Other',
]

const reliefOptions = [
  'Divorce',
  'Judicial Separation',
  'Maintenance',
  'Child Custody',
  'Domestic Violence',
  'Property',
  'Other',
]

function hasValue(value) {
  return String(value || '').trim().length > 0
}

function getMissingFields(caseDetails) {
  const missing = Object.entries(requiredFieldLabels)
    .map(([id, fields]) => ({
      id,
      label: sectionMeta[id].label,
      icon: sectionMeta[id].icon,
      missing: fields
        .filter(([key]) => !hasValue(caseDetails[id]?.[key]))
        .map(([, label]) => label),
    }))
    .filter(section => section.missing.length > 0)

  if (!caseDetails.relief.selected.length) {
    missing.push({
      id: 'relief',
      label: sectionMeta.relief.label,
      icon: sectionMeta.relief.icon,
      missing: ['Type'],
    })
  }

  if (!hasValue(caseDetails.facts)) {
    missing.push({
      id: 'facts',
      label: sectionMeta.facts.label,
      icon: sectionMeta.facts.icon,
      missing: ['Detailed Description'],
    })
  }

  const previousCaseMissing = []
  if (!hasValue(caseDetails.previousCase.hasPreviousCase)) {
    previousCaseMissing.push('Previous Case Status')
  } else if (caseDetails.previousCase.hasPreviousCase === 'yes') {
    ;[
      ['caseNumber', 'Case Number'],
      ['court', 'Court'],
      ['year', 'Year'],
      ['status', 'Status'],
    ].forEach(([key, label]) => {
      if (!hasValue(caseDetails.previousCase[key])) previousCaseMissing.push(label)
    })
  }

  if (previousCaseMissing.length) {
    missing.push({
      id: 'previousCase',
      label: sectionMeta.previousCase.label,
      icon: sectionMeta.previousCase.icon,
      missing: previousCaseMissing,
    })
  }

  return missing
}

function getDisplaySections(caseDetails) {
  const missing = getMissingFields(caseDetails)

  if (!hasValue(caseDetails.other)) {
    missing.push({
      id: 'other',
      label: sectionMeta.other.label,
      icon: sectionMeta.other.icon,
      missing: [],
      optional: true,
    })
  }

  return missing
}

function Icon({ src, size = 20, className = '' }) {
  return <img src={src} alt="" aria-hidden="true" className={className} style={{ width: size, height: size }} />
}

function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm">
      <div className="w-[520px] overflow-hidden rounded-[18px] bg-white shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between border-b border-[#EFEFEF] px-7 pb-4 pt-6">
          <h3 className="text-[22px] font-semibold leading-7 text-[#111111]">Help</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help modal"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F3F3F3]"
          >
            <Icon src={closeIcon} size={20} />
          </button>
        </div>

        <div className="space-y-5 px-7 py-5 text-[13px] leading-5 text-[#555555]">
          <div>
            <h4 className="mb-2 text-[15px] font-semibold text-[#111111]">How to use AI Drafter</h4>
            <div className="space-y-2">
              <p><span className="font-semibold text-[#111111]">Step 1</span> Write your case in simple language.</p>
              <p><span className="font-semibold text-[#111111]">Step 2</span> Choose draft type.</p>
              <p><span className="font-semibold text-[#111111]">Step 3</span> Attach document (optional).</p>
              <p><span className="font-semibold text-[#111111]">Step 4</span> Click Generate Draft.</p>
              <p><span className="font-semibold text-[#111111]">Step 5</span> Fill missing details if requested.</p>
              <p><span className="font-semibold text-[#111111]">Step 6</span> Generate the final legal draft.</p>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-[15px] font-semibold text-[#111111]">Supported draft types</h4>
            <div className="grid grid-cols-2 gap-2">
              {['Legal Notice', 'Petition', 'Counter / Reply', 'Proof Affidavit', 'Arguments', 'Other'].map(type => (
                <div key={type} className="rounded-md border border-[#E5E5E5] px-3 py-2 text-[#111111]">
                  {type}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#EFEFEF] px-7 py-5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-[10px] bg-[#111111] px-7 text-[14px] font-semibold text-white hover:bg-[#000000]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function ProfileModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm">
      <div className="w-[420px] overflow-hidden rounded-[18px] bg-white shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between border-b border-[#EFEFEF] px-7 pb-4 pt-6">
          <div>
            <h3 className="text-[22px] font-semibold leading-7 text-[#111111]">My Profile</h3>
            <p className="mt-1 text-[13px] text-[#666666]">Your LegalOne account details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F3F3F3]"
          >
            <Icon src={closeIcon} size={20} />
          </button>
        </div>

        <div className="px-7 py-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111111]">
              <img src={userIcon} alt="" aria-hidden="true" className="h-6 w-6 invert" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#111111]">LegalOne User</p>
              <p className="text-[13px] text-[#666666]">user@legalone.app</p>
            </div>
          </div>

          <div className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between rounded-md border border-[#E5E5E5] px-3 py-2">
              <span className="font-medium text-[#666666]">Role</span>
              <span className="font-semibold text-[#111111]">Advocate</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-[#E5E5E5] px-3 py-2">
              <span className="font-medium text-[#666666]">Plan</span>
              <span className="font-semibold text-[#111111]">Free</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-[#E5E5E5] px-3 py-2">
              <span className="font-medium text-[#666666]">Status</span>
              <span className="font-semibold text-[#111111]">Active</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#EFEFEF] px-7 py-5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-[10px] bg-[#111111] px-7 text-[14px] font-semibold text-white hover:bg-[#000000]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function TextInput({ label, value, onChange, type = 'text', optional = false }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-[#111111]">
        {label} {optional && <span className="font-normal text-[#777777]">(Optional)</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-10 rounded-md border border-[#DADADA] bg-white px-3 text-[13px] text-[#111111] outline-none focus:border-[#111111]"
      />
    </label>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-[#111111]">{label}</span>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        className="min-h-[132px] resize-none rounded-md border border-[#DADADA] bg-white px-3 py-2 text-[13px] text-[#111111] outline-none focus:border-[#111111]"
      />
    </label>
  )
}

function PersonForm({ value, onChange }) {
  const update = (key, nextValue) => onChange({ ...value, [key]: nextValue })

  return (
    <div className="grid grid-cols-2 gap-3">
      <TextInput label="Name" value={value.name} onChange={next => update('name', next)} />
      <TextInput label="Age" type="number" value={value.age} onChange={next => update('age', next)} />
      <TextInput label="Gender" value={value.gender} onChange={next => update('gender', next)} />
      <TextInput label="Occupation" value={value.occupation} onChange={next => update('occupation', next)} />
      <div className="col-span-2">
        <TextInput label="Address" value={value.address} onChange={next => update('address', next)} />
      </div>
      <TextInput label="Phone" value={value.phone} onChange={next => update('phone', next)} optional />
      <TextInput label="Email" type="email" value={value.email} onChange={next => update('email', next)} optional />
    </div>
  )
}

function MissingDetailsForm({ sectionId, caseDetails, setCaseDetails, errors }) {
  const updateSection = (section, value) => setCaseDetails(prev => ({ ...prev, [section]: value }))

  if (sectionId === 'petitioner' || sectionId === 'respondent') {
    return (
      <PersonForm
        value={caseDetails[sectionId]}
        onChange={value => updateSection(sectionId, value)}
      />
    )
  }

  if (sectionId === 'marriage') {
    const update = (key, value) => updateSection('marriage', { ...caseDetails.marriage, [key]: value })
    return (
      <div className="grid grid-cols-2 gap-3">
        <TextInput label="Marriage Date" type="date" value={caseDetails.marriage.date} onChange={value => update('date', value)} />
        <TextInput label="Marriage Place" value={caseDetails.marriage.place} onChange={value => update('place', value)} />
        <label className="col-span-2 flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-[#111111]">Marriage Type</span>
          <select
            value={caseDetails.marriage.type}
            onChange={e => update('type', e.target.value)}
            className="h-10 rounded-md border border-[#DADADA] bg-white px-3 text-[13px] text-[#111111] outline-none focus:border-[#111111]"
          >
            <option value="">Select marriage type</option>
            {marriageTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
      </div>
    )
  }

  if (sectionId === 'jurisdiction') {
    const update = (key, value) => updateSection('jurisdiction', { ...caseDetails.jurisdiction, [key]: value })
    return (
      <div className="grid grid-cols-2 gap-3">
        <TextInput label="Court Name" value={caseDetails.jurisdiction.courtName} onChange={value => update('courtName', value)} />
        <TextInput label="Court Type" value={caseDetails.jurisdiction.courtType} onChange={value => update('courtType', value)} />
        <TextInput label="City" value={caseDetails.jurisdiction.city} onChange={value => update('city', value)} />
        <TextInput label="State" value={caseDetails.jurisdiction.state} onChange={value => update('state', value)} />
      </div>
    )
  }

  if (sectionId === 'relief') {
    const selected = caseDetails.relief.selected
    const toggle = option => {
      const nextSelected = selected.includes(option)
        ? selected.filter(item => item !== option)
        : [...selected, option]
      updateSection('relief', { selected: nextSelected })
    }

    return (
      <div className="grid grid-cols-2 gap-2">
        {reliefOptions.map(option => (
          <label key={option} className="flex h-10 items-center gap-2 rounded-md border border-[#DADADA] px-3 text-[13px] font-medium text-[#111111]">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggle(option)}
              className="h-4 w-4 accent-[#111111]"
            />
            {option}
          </label>
        ))}
      </div>
    )
  }

  if (sectionId === 'facts') {
    return <TextArea label="Detailed Facts" value={caseDetails.facts} onChange={value => updateSection('facts', value)} />
  }

  if (sectionId === 'previousCase') {
    const update = (key, value) => updateSection('previousCase', { ...caseDetails.previousCase, [key]: value })

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-5">
          {['yes', 'no'].map(option => (
            <label key={option} className="flex items-center gap-2 text-[13px] font-medium text-[#111111]">
              <input
                type="radio"
                name="previousCase"
                checked={caseDetails.previousCase.hasPreviousCase === option}
                onChange={() => updateSection('previousCase', { ...initialCaseDetails.previousCase, hasPreviousCase: option })}
                className="h-4 w-4 accent-[#111111]"
              />
              {option === 'yes' ? 'Yes' : 'No'}
            </label>
          ))}
        </div>

        {caseDetails.previousCase.hasPreviousCase === 'yes' && (
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Case Number" value={caseDetails.previousCase.caseNumber} onChange={value => update('caseNumber', value)} />
            <TextInput label="Court" value={caseDetails.previousCase.court} onChange={value => update('court', value)} />
            <TextInput label="Year" type="number" value={caseDetails.previousCase.year} onChange={value => update('year', value)} />
            <TextInput label="Status" value={caseDetails.previousCase.status} onChange={value => update('status', value)} />
          </div>
        )}
      </div>
    )
  }

  if (sectionId === 'other') {
    return <TextArea label="Other Relevant Information" value={caseDetails.other} onChange={value => updateSection('other', value)} />
  }

  return errors.length ? null : null
}

function MissingDetailsModal({
  activeSection,
  caseDetails,
  displaySections,
  errors,
  onCancel,
  onOpenSection,
  onProvideDetails,
  onSave,
  setCaseDetails,
}) {
  const activeMeta = activeSection ? sectionMeta[activeSection] : null
  const visibleErrors = activeSection ? errors.filter(error => error.id === activeSection) : []

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm">
      <div className="h-[560px] w-[520px] overflow-hidden rounded-[18px] bg-white shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between px-7 pb-4 pt-6">
            <div>
              <h3 className="text-[22px] font-semibold leading-7 text-[#111111]">Missing Details</h3>
              <p className="mt-2 max-w-[390px] text-[13px] font-normal leading-5 text-[#666666]">
                To generate an accurate draft, please provide the following missing details.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close missing details modal"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#F3F3F3]"
            >
              <Icon src={closeIcon} size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-5">
            {!activeSection ? (
              <div className="space-y-1">
                {displaySections.map(section => {
                  const completed = !section.optional && section.missing.length === 0
                  const label = section.missing.length
                    ? `${section.label} (${section.missing.join(', ')})`
                    : section.label

                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => onOpenSection(section.id)}
                      className="flex h-[50px] w-full cursor-pointer items-center gap-4 rounded-[10px] px-3 text-left transition-colors hover:bg-[#F5F5F5]"
                    >
                      <Icon src={completed ? checkIcon : section.icon} size={20} className={completed ? '[filter:invert(42%)_sepia(83%)_saturate(529%)_hue-rotate(94deg)_brightness(92%)_contrast(89%)]' : ''} />
                      <span className="min-w-0 flex-1 truncate text-[15px] font-medium leading-5 text-[#111111]">
                        {label}
                      </span>
                      <Icon src={chevronRightIcon} size={16} />
                    </button>
                  )
                })}
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => onOpenSection(null)}
                  className="mb-4 flex h-[38px] items-center gap-2 rounded-md px-2 text-[13px] font-medium text-[#111111] hover:bg-[#F5F5F5]"
                >
                  <Icon src={chevronRightIcon} size={14} className="rotate-180" />
                  Missing Details
                </button>

                <div className="mb-4 flex items-center gap-3">
                  <Icon src={activeMeta.icon} size={20} />
                  <h4 className="text-[16px] font-semibold text-[#111111]">{activeMeta.label}</h4>
                </div>

                <MissingDetailsForm
                  sectionId={activeSection}
                  caseDetails={caseDetails}
                  setCaseDetails={setCaseDetails}
                  errors={visibleErrors}
                />

                {visibleErrors.length > 0 && (
                  <p className="mt-3 text-[12px] font-medium text-[#B42318]">
                    Please complete: {visibleErrors[0].missing.join(', ')}.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#EFEFEF] px-7 py-5">
            <button
              type="button"
              onClick={onCancel}
              className="h-11 rounded-[10px] border border-[#D9D9D9] bg-white px-6 text-[14px] font-semibold text-[#111111] hover:bg-[#F6F6F6]"
            >
              Cancel
            </button>
            {!activeSection ? (
              <button
                type="button"
                onClick={onProvideDetails}
                className="h-11 rounded-[10px] bg-[#111111] px-6 text-[14px] font-semibold text-white hover:bg-[#000000]"
              >
                Provide Details
              </button>
            ) : (
              <button
                type="button"
                onClick={onSave}
                className="h-11 rounded-[10px] bg-[#111111] px-7 text-[14px] font-semibold text-white hover:bg-[#000000]"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DraftPage() {
  const [selectedDraft, setSelectedDraft] = useState('legal-notice')
  const [text, setText] = useState('')
  const [showMissingPopup, setShowMissingPopup] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('legalone-theme') || 'light')
  const [activeSection, setActiveSection] = useState(null)
  const [caseDetails, setCaseDetails] = useState(initialCaseDetails)
  const [validationErrors, setValidationErrors] = useState([])
  const [attachedFile, setAttachedFile] = useState(null)
  const profileMenuRef = useRef(null)

  const MAX = 5000
  const isDarkTheme = theme === 'dark'
  const requiredMissingFields = useMemo(() => getMissingFields(caseDetails), [caseDetails])
  const displaySections = useMemo(() => getDisplaySections(caseDetails), [caseDetails])

  useEffect(() => {
    localStorage.setItem('legalone-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTextChange = (e) => {
    if (e.target.value.length <= MAX) setText(e.target.value)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) setAttachedFile(file)
  }

  const handleThemeToggle = () => {
    setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  const handleProfileAction = (action) => {
    console.log(action)
    setShowProfileMenu(false)
    if (action === 'Profile') setShowProfileModal(true)
  }

  const generateDraft = () => {
    console.log('Continue AI draft generation', { selectedDraft, text, caseDetails })
  }

  const continueOrOpenMissingDetails = () => {
    const missing = getMissingFields(caseDetails)
    setValidationErrors(missing)

    if (missing.length > 0) {
      setActiveSection(null)
      setShowMissingPopup(true)
      return
    }

    setShowMissingPopup(false)
    setActiveSection(null)
    generateDraft()
  }

  const handleProvideDetails = () => {
    const firstIncomplete = requiredMissingFields[0] || displaySections[0]
    if (firstIncomplete) setActiveSection(firstIncomplete.id)
  }

  const handleSave = () => {
    const latestMissing = getMissingFields(caseDetails)
    setValidationErrors(latestMissing)

    const currentMissing = latestMissing.find(section => section.id === activeSection)
    if (currentMissing) return

    if (latestMissing.length === 0) {
      setShowMissingPopup(false)
      setActiveSection(null)
      generateDraft()
      return
    }

    setActiveSection(null)
  }

  return (
    <div className={`flex min-h-screen w-full flex-col ${isDarkTheme ? 'bg-black' : 'bg-[#F8F9FB]'}`}>
      <div className={`flex flex-shrink-0 items-center justify-between border-b px-7 py-4 ${isDarkTheme ? 'border-white/20 bg-black' : 'border-gray-200 bg-white'}`}>
        <div>
          <h1 className={`text-base font-bold uppercase tracking-widest ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            AI DRAFTER
          </h1>
          <p className={`mt-0.5 text-xs ${isDarkTheme ? 'text-gray-300' : 'text-gray-500'}`}>
            Describe your case in simple words and let AI create your legal draft.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            aria-label="Open help"
            className={`flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors ${isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <Icon src={helpIcon} size={18} className={isDarkTheme ? 'invert' : ''} />
          </button>
          <button
            type="button"
            onClick={handleThemeToggle}
            aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors ${isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <Icon src={moonIcon} size={17} className={isDarkTheme ? 'invert' : ''} />
          </button>
          <div ref={profileMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(isOpen => !isOpen)}
              aria-label="Open profile menu"
              className={`flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors ${isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Icon src={userIcon} size={17} className={isDarkTheme ? 'invert' : ''} />
            </button>

            {showProfileMenu && (
              <div className={`absolute right-0 top-10 z-[90] w-44 overflow-hidden rounded-lg border py-1 shadow-[0_14px_30px_rgba(0,0,0,0.14)] ${isDarkTheme ? 'border-white/20 bg-black' : 'border-gray-200 bg-white'}`}>
                {[
                  ['My Profile', userIcon, 'Profile'],
                  ['Settings', gavelIcon, 'Settings'],
                  ['My Drafts', documentIcon, 'My Drafts'],
                  ['Logout', rotateIcon, 'Logout'],
                ].map(([label, icon, action]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleProfileAction(action)}
                    className={`flex h-10 w-full items-center gap-3 px-3 text-left text-xs font-semibold transition-colors ${isDarkTheme ? 'text-gray-100 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Icon src={icon} size={16} className={isDarkTheme ? 'invert' : ''} />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-7 py-5">
        <div className={`overflow-hidden rounded-xl border ${isDarkTheme ? 'border-white/20 bg-black' : 'border-gray-200 bg-white'}`}>
          <div className="relative">
            <textarea
              value={text}
              onChange={handleTextChange}
              placeholder="Start typing your case details in simple words..."
              className={`min-h-[60px] w-full resize-none border-none bg-transparent px-5 pb-2 pt-4 text-sm leading-relaxed outline-none placeholder-gray-400 ${isDarkTheme ? 'text-white' : 'text-gray-700'}`}
              rows={3}
            />
            <div className="px-5 pb-5">
              <p className={`mb-1 text-xs ${isDarkTheme ? 'text-gray-300' : 'text-gray-500'}`}>For example:</p>
              <p className={`text-xs italic leading-6 ${isDarkTheme ? 'text-gray-300' : 'text-gray-500'}`}>
                "I want to file a divorce petition on the ground of cruelty.<br />
                We were married on 15 June 2015 at Delhi.<br />
                We are residing at 123, Green Park, New Delhi..."
              </p>
            </div>
          </div>

          <div className={`flex items-center justify-between border-t px-5 py-3 ${isDarkTheme ? 'border-white/20' : 'border-gray-200'}`}>
            <label className={`flex cursor-pointer items-center gap-2 rounded-md pr-3 transition-colors ${isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="sr-only"
              />
              <Icon src={paperclipIcon} size={14} className={isDarkTheme ? 'invert' : ''} />
              <div className="flex flex-col">
                <span className={`text-xs font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-700'}`}>
                  Attach Document <span className="font-normal">(Optional)</span>
                </span>
                <span className={`max-w-[260px] truncate text-[10px] ${isDarkTheme ? 'text-gray-300' : 'text-gray-400'}`}>
                  {attachedFile ? attachedFile.name : 'PDF, DOC, DOCX (Max 10MB)'}
                </span>
              </div>
            </label>

            <div className="flex items-center gap-3">
              <Icon src={lightbulbIcon} size={15} className={isDarkTheme ? 'invert' : ''} />
              <span className={`text-xs ${isDarkTheme ? 'text-gray-300' : 'text-gray-400'}`}>
                {text.length} / {MAX} characters
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 className={`mb-3 text-sm font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
            1. Select type of drafting
          </h2>
          <div className="grid grid-cols-6 gap-3">
            {DRAFT_TYPES.map(({ id, label, sub, icon }) => {
              const isActive = selectedDraft === id
              return (
                <button
                  key={id}
                  onClick={() => setSelectedDraft(id)}
                  className={[
                    'relative flex flex-col items-center justify-center gap-2 rounded-xl px-2 py-5 text-center transition-all',
                    isActive
                      ? isDarkTheme ? 'border-2 border-white bg-black' : 'border-2 border-gray-900 bg-white'
                      : isDarkTheme ? 'border border-white/20 bg-black hover:border-white' : 'border border-gray-200 bg-white hover:border-gray-400',
                  ].join(' ')}
                >
                  {isActive && (
                    <span className={`absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full ${isDarkTheme ? 'bg-white' : 'bg-gray-900'}`}>
                      <img src={checkIcon} alt="" aria-hidden="true" className={`h-3 w-3 ${isDarkTheme ? '' : 'invert'}`} />
                    </span>
                  )}
                  <Icon src={icon} size={26} className={isDarkTheme ? 'invert' : ''} />
                  <span className={`text-xs font-semibold leading-tight ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                    {label}
                  </span>
                  <span className={`text-[10px] leading-tight ${isDarkTheme ? 'text-gray-300' : 'text-gray-500'}`}>{sub}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${isDarkTheme ? 'border-white/20 bg-black' : 'border-gray-200 bg-white'}`}>
          <div className="flex flex-1 items-start gap-2.5">
            <Icon src={infoIcon} size={15} className={`mt-0.5 flex-shrink-0 ${isDarkTheme ? 'invert' : ''}`} />
            <div>
              <p className={`mb-1 text-xs font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>How it works?</p>
              <p className={`text-xs leading-relaxed ${isDarkTheme ? 'text-gray-300' : 'text-gray-500'}`}>
                Just type or paste the facts of your case in simple words. Our AI will understand the
                details, ask for any missing information, and generate a complete legal draft including
                all necessary clauses like verification, affidavit, etc.
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-col items-center gap-1.5">
            <button
              onClick={continueOrOpenMissingDetails}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${isDarkTheme ? 'bg-white text-black hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
            >
              <img src={sparkleIcon} alt="" aria-hidden="true" className={`h-[15px] w-[15px] ${isDarkTheme ? '' : 'invert'}`} />
              Generate Draft
            </button>
            <p className={`text-center text-[10px] ${isDarkTheme ? 'text-gray-300' : 'text-gray-400'}`}>
              AI drafts can make mistakes. Please review before use.
            </p>
          </div>
        </div>
      </div>

      {showMissingPopup && displaySections.length > 0 && (
        <MissingDetailsModal
          activeSection={activeSection}
          caseDetails={caseDetails}
          displaySections={displaySections}
          errors={validationErrors}
          onCancel={() => {
            setShowMissingPopup(false)
            setActiveSection(null)
          }}
          onOpenSection={setActiveSection}
          onProvideDetails={handleProvideDetails}
          onSave={handleSave}
          setCaseDetails={setCaseDetails}
        />
      )}

      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} />
      )}

      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  )
}
