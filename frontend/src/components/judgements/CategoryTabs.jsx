import CategoryChip from './CategoryChip'

/**
 * CategoryTabs — horizontal scrollable tab list.
 *
 * Props:
 *   tabs      {Array<{ label: string, count?: number }>}
 *   activeTab {string}
 *   onChange  {(label: string) => void}
 */
export default function CategoryTabs({ tabs = [], activeTab, onChange }) {
  return (
    <div className="jd-tabs" role="tablist" aria-label="Case categories">
      {tabs.map((tab) => (
        <CategoryChip
          key={tab.label}
          label={tab.label}
          count={tab.count}
          active={activeTab === tab.label}
          onClick={() => onChange?.(tab.label)}
        />
      ))}
    </div>
  )
}
