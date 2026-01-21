type DecisionsCardProps = {
  decisions: string[]
  isLoading: boolean
}

export default function DecisionsCard({ decisions, isLoading }: DecisionsCardProps) {
  return (
    <div className="card">
      <h3>החלטות</h3>
      {isLoading ? (
        <div className="skeleton-block">
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ) : decisions.length ? (
        <ul>
          {decisions.map((decision, index) => (
            <li key={index}>{decision}</li>
          ))}
        </ul>
      ) : (
        <p>—</p>
      )}
    </div>
  )
}
