import { useMemo, useState } from 'react'

type Language = 'he' | 'en'

type SummaryPayload = {
  summary: string
  participants: string[]
  decisions: string[]
  actionItems: string[]
  language: Language
}

const defaultSummary: SummaryPayload = {
  summary: '',
  participants: [],
  decisions: [],
  actionItems: [],
  language: 'he',
}

const toTitle = (text: string) => (text.length ? text : '—')

const detectRtl = (language: Language) => (language === 'he' ? 'rtl' : 'ltr')

export default function App() {
  const [apiBase, setApiBase] = useState(
    localStorage.getItem('apiBase') ?? 'http://localhost:8000'
  )
  const [file, setFile] = useState<File | null>(null)
  const [transcript, setTranscript] = useState('')
  const [language, setLanguage] = useState<Language>('he')
  const [summary, setSummary] = useState<SummaryPayload>(defaultSummary)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<'idle' | 'transcribing' | 'summarizing'>('idle')
  const [error, setError] = useState<string | null>(null)

  const hasSummary = useMemo(
    () =>
      Boolean(
        summary.summary ||
          summary.participants.length ||
          summary.decisions.length ||
          summary.actionItems.length
      ),
    [summary]
  )

  const persistApiBase = (value: string) => {
    setApiBase(value)
    localStorage.setItem('apiBase', value)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setStage('transcribing')
    setSummary(defaultSummary)
    setTranscript('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const transcribeRes = await fetch(`${apiBase}/api/transcribe`, {
        method: 'POST',
        body: formData,
      })

      if (!transcribeRes.ok) {
        const message = await transcribeRes.json().catch(() => null)
        throw new Error(message?.detail || 'Transcription failed')
      }

      const transcribeData = await transcribeRes.json()
      setTranscript(transcribeData.transcript || '')
      setLanguage(transcribeData.language || 'he')
      setStage('summarizing')

      const summarizeRes = await fetch(`${apiBase}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcribeData.transcript,
          language: transcribeData.language,
        }),
      })

      if (!summarizeRes.ok) {
        const message = await summarizeRes.json().catch(() => null)
        throw new Error(message?.detail || 'Summarization failed')
      }

      const summaryData = await summarizeRes.json()
      setSummary(summaryData)
      setLanguage(summaryData.language || transcribeData.language || 'he')
      setStage('idle')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'משהו השתבש בתהליך. בדקי שהשרת רץ ונסי שוב.'
      setError(message)
      setStage('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!hasSummary) return
    try {
      const res = await fetch(`${apiBase}/api/export/docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          summary: summary.summary,
          participants: summary.participants,
          decisions: summary.decisions,
          actionItems: summary.actionItems,
          language: summary.language || language,
        }),
      })

      if (!res.ok) {
        const message = await res.json().catch(() => null)
        throw new Error(message?.detail || 'Export failed')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'meeting-summary.docx'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'לא ניתן להוריד את קובץ ה-Word. נסי שוב.'
      setError(message)
    }
  }

  return (
    <div className="app" dir={detectRtl(language)}>
      <div className="glow" aria-hidden="true" />
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow">Meeting Notes AI</p>
          <h1>תמלול וסיכום פגישות ברמה של מוצר</h1>
          <p className="subtitle">
            העלי הקלטה וקבלי תמלול מלא, החלטות, משימות וסיכום חד ומקצועי.
          </p>
        </div>
        <div className="hero-card">
          <h2>התחלה מהירה</h2>
          <p>בחרי קובץ אודיו והגדירי כתובת API.</p>
          <label className="file-drop">
            <input
              type="file"
              accept="audio/*"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <span>{file ? file.name : 'בחרי קובץ אודיו (wav/mp3)'}</span>
          </label>
          <label className="field">
            API Base URL
            <input
              type="text"
              value={apiBase}
              onChange={(event) => persistApiBase(event.target.value)}
              placeholder="http://localhost:8000"
            />
          </label>
          <button className="primary" onClick={handleUpload} disabled={loading || !file}>
            {loading
              ? stage === 'transcribing'
                ? 'מתמללת...'
                : 'מסכמת...'
              : 'התחילי תהליך'}
          </button>
          {error && (
            <div className="toast" role="alert">
              <div className="toast-dot" />
              <div>
                <div className="toast-title">יש לנו עדכון חשוב</div>
                <div className="toast-body">{error}</div>
              </div>
              <button className="toast-close" onClick={() => setError(null)} aria-label="סגירה">
                ✕
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>תמלול מלא</h2>
          <span className="tag">{language === 'he' ? 'עברית' : 'English'}</span>
        </div>
        <textarea value={transcript} readOnly placeholder="כאן יופיע התמלול המלא." />
      </section>

      <section className="grid">
        <div className="card">
          <h3>סיכום</h3>
          <p>{toTitle(summary.summary)}</p>
        </div>
        <div className="card">
          <h3>משתתפים</h3>
          {summary.participants.length ? (
            summary.participants.map((participant, index) => (
              <span className="chip" key={index}>
                {participant}
              </span>
            ))
          ) : (
            <p>—</p>
          )}
        </div>
        <div className="card">
          <h3>החלטות</h3>
          {summary.decisions.length ? (
            <ul>
              {summary.decisions.map((decision, index) => (
                <li key={index}>{decision}</li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}
        </div>
        <div className="card">
          <h3>משימות לביצוע</h3>
          {summary.actionItems.length ? (
            <ul>
              {summary.actionItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>—</p>
          )}
        </div>
      </section>

      <section className="panel export">
        <div>
          <h2>ייצוא לקובץ Word</h2>
          <p>תוכלי לשמור את הסיכום יחד עם התמלול המלא.</p>
        </div>
        <button className="primary" onClick={handleDownload} disabled={!hasSummary}>
          הורדת קובץ Word
        </button>
      </section>
    </div>
  )
}
