type ProgressStepperProps = {
  steps: string[]
  activeIndex: number
  label: string
}

export default function ProgressStepper({ steps, activeIndex, label }: ProgressStepperProps) {
  return (
    <section className="panel progress">
      <div className="panel-header">
        <h2>סטטוס תהליך</h2>
        <span className="tag">{label}</span>
      </div>
      <div className="progress-steps" role="list">
        {steps.map((step, index) => {
          const isActive = activeIndex === index
          const isLast = index === steps.length - 1
          const isDone = activeIndex > index || (isLast && activeIndex === index)
          return (
            <div
              key={step}
              className={`progress-step ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
              role="listitem"
            >
              <div className="progress-row">
                <span className="progress-label">{step}</span>
                <span className="progress-status" aria-hidden="true">
                  {isDone ? '✓' : isActive ? '•' : ''}
                </span>
              </div>
              <div className="progress-track">
                <span className="progress-fill" />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
