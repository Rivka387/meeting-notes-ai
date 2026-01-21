import { KeyboardEvent } from 'react'

export type TabItem = {
  id: string
  label: string
  count?: number
}

type ResultsTabsProps = {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (id: string) => void
}

export default function ResultsTabs({ tabs, activeTab, onTabChange }: ResultsTabsProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab)
    if (currentIndex === -1) return
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length
    onTabChange(tabs[nextIndex].id)
  }

  return (
    <div className="tabs" role="tablist" aria-label="תוצאות פגישה" onKeyDown={handleKeyDown}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            className={`tab ${isActive ? 'is-active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className="tab-count" aria-hidden="true">
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
