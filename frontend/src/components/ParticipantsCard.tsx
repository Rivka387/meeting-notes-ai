type ParticipantsCardProps = {
  participants: string[]
  isLoading: boolean
}

export default function ParticipantsCard({ participants, isLoading }: ParticipantsCardProps) {
  return (
    <div className="card">
      <h3>משתתפים</h3>
      {isLoading ? (
        <div className="skeleton-row">
          <div className="skeleton-pill" />
          <div className="skeleton-pill" />
        </div>
      ) : participants.length ? (
        <div className="chip-row">
          {participants.map((participant, index) => (
            <span className="chip" key={index}>
              {participant}
            </span>
          ))}
        </div>
      ) : (
        <p>—</p>
      )}
    </div>
  )
}
