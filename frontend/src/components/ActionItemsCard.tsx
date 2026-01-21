type ActionItemsCardProps = {
  items: string[]
  checks: Record<number, boolean>
  isLoading: boolean
  notice: string | null
  onToggle: (index: number) => void
  onCopy: () => void
  onDownloadIcs: () => void
}

export default function ActionItemsCard({
  items,
  checks,
  isLoading,
  notice,
  onToggle,
  onCopy,
  onDownloadIcs,
}: ActionItemsCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>משימות לביצוע</h3>
        <div className="action-tools">
          <button className="btn ghost" onClick={onCopy} disabled={!items.length}>
            העתק
          </button>
          <button className="btn ghost" onClick={onDownloadIcs} disabled={!items.length}>
            הורד ICS
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="skeleton-block">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ) : items.length ? (
        <ul className="action-list">
          {items.map((item, index) => (
            <li key={index}>
              <label className={`action-item ${checks[index] ? 'is-done' : ''}`}>
                <input
                  type="checkbox"
                  checked={Boolean(checks[index])}
                  onChange={() => onToggle(index)}
                />
                <span>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p>—</p>
      )}
      {notice && <p className="action-note">{notice}</p>}
    </div>
  )
}
