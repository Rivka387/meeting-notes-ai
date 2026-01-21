type SummaryCardProps = {
  summary: string
  isLoading: boolean
}

export default function SummaryCard({ summary, isLoading }: SummaryCardProps) {
  return (
    <div className="card">
      <h3>סיכום</h3>
      {isLoading ? (
        <div className="skeleton-block">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ) : (
        <p>{summary || '—'}</p>
      )}
    </div>
  )
}
