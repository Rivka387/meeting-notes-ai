type UploadPanelProps = {
  fileName: string | null
  apiBase: string
  mockMode: boolean
  mockModeLabel: string
  mockModeHint: string
  loading: boolean
  stage: 'idle' | 'transcribing' | 'summarizing'
  onFileChange: (file: File | null) => void
  onApiBaseChange: (value: string) => void
  onMockModeChange: (value: boolean) => void
  onStart: () => void
}

export default function UploadPanel({
  fileName,
  apiBase,
  mockMode,
  mockModeLabel,
  mockModeHint,
  loading,
  stage,
  onFileChange,
  onApiBaseChange,
  onMockModeChange,
  onStart,
}: UploadPanelProps) {
  const buttonLabel = loading
    ? stage === 'transcribing'
      ? 'מתמלל...'
      : 'מסכם...'
    : 'התחל תהליך'

  return (
    <section className="panel upload-panel">
      <div className="panel-header">
        <h2>התחלת תהליך</h2>
        <span className="tag">שלב 1</span>
      </div>
      <p className="panel-hint">בחרו קובץ אודיו והגדירו כתובת API פעילה.</p>
      <label className="file-drop">
        <input
          type="file"
          accept="audio/*"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <span>{fileName ?? 'בחירת קובץ (wav/mp3)'}</span>
      </label>
      <label className="field">
        API Base URL
        <input
          type="text"
          value={apiBase}
          onChange={(event) => onApiBaseChange(event.target.value)}
          placeholder="http://localhost:8000"
        />
      </label>
      <div className="mode-toggle">
        <div className="mode-copy">
          <span className="mode-title">{mockModeLabel}</span>
          <span className="mode-hint">{mockModeHint}</span>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={mockMode}
            onChange={(event) => onMockModeChange(event.target.checked)}
          />
          <span className="switch-track" aria-hidden="true" />
        </label>
      </div>
      <button className="btn primary" onClick={onStart} disabled={loading || !fileName}>
        {buttonLabel}
      </button>
    </section>
  )
}
