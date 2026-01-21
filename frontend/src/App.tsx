import { useEffect, useMemo, useState } from 'react'
import ActionItemsCard from './components/ActionItemsCard'
import DecisionsCard from './components/DecisionsCard'
import ExportBar from './components/ExportBar'
import Header from './components/Header'
import ParticipantsCard from './components/ParticipantsCard'
import ProgressStepper from './components/ProgressStepper'
import ResultsTabs from './components/ResultsTabs'
import SummaryCard from './components/SummaryCard'
import Toast from './components/Toast'
import TranscriptView from './components/TranscriptView'
import UploadPanel from './components/UploadPanel'
import { Language, SummaryPayload } from './types'

const defaultSummary: SummaryPayload = {
  summary: '',
  participants: [],
  decisions: [],
  actionItems: [],
  language: 'he',
}

const detectRtl = (language: Language) => (language === 'he' ? 'rtl' : 'ltr')

type ToastState = {
  message: string
  tone?: 'success' | 'error' | 'info'
} | null

export default function App() {
  const envApiBase = import.meta.env.VITE_API_BASE_URL as string | undefined
  const [apiBase, setApiBase] = useState(
    envApiBase ?? localStorage.getItem('apiBase') ?? 'http://localhost:8000'
  )
  const [file, setFile] = useState<File | null>(null)
  const [transcript, setTranscript] = useState('')
  const [language, setLanguage] = useState<Language>('he')
  const [summary, setSummary] = useState<SummaryPayload>(defaultSummary)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<'idle' | 'transcribing' | 'summarizing'>('idle')
  const [toast, setToast] = useState<ToastState>(null)
  const [actionChecks, setActionChecks] = useState<Record<number, boolean>>({})
  const [activeTab, setActiveTab] = useState('summary')
  const [searchQuery, setSearchQuery] = useState('')

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

  useEffect(() => {
    setActionChecks({})
  }, [summary.actionItems])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const progressSteps = ['העלאה', 'תמלול', 'סיכום', 'מוכן']
  const progressStep = useMemo(() => {
    if (loading) {
      return stage === 'transcribing' ? 1 : 2
    }
    if (hasSummary) return 3
    if (file) return 0
    return -1
  }, [file, hasSummary, loading, stage])

  const progressLabel = useMemo(() => {
    if (loading && stage === 'transcribing') return 'מתבצע תמלול'
    if (loading && stage === 'summarizing') return 'מתבצע סיכום'
    if (hasSummary) return 'מוכן לצפייה והורדה'
    if (file) return 'מוכן להתחלה'
    return 'ממתין לקובץ'
  }, [file, hasSummary, loading, stage])

  const escapeIcsText = (value: string) =>
    value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

  const persistApiBase = (value: string) => {
    setApiBase(value)
    localStorage.setItem('apiBase', value)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setToast(null)
    setStage('transcribing')
    setSummary(defaultSummary)
    setTranscript('')
    setActiveTab('summary')

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
      const message = err instanceof Error ? err.message : 'קרתה שגיאה לא צפויה. נסו שוב.'
      setToast({ message, tone: 'error' })
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
      setToast({ message: 'קובץ Word הורד בהצלחה.', tone: 'success' })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'לא הצלחנו לייצא לקובץ Word. נסו שוב.'
      setToast({ message, tone: 'error' })
    }
  }

  const toggleAction = (index: number) => {
    setActionChecks((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const handleCopyActions = async () => {
    if (!summary.actionItems.length) return
    const lines = summary.actionItems.map(
      (item, index) => `${actionChecks[index] ? '[x]' : '[ ]'} ${item}`
    )
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setToast({ message: 'המשימות הועתקו ללוח.', tone: 'success' })
    } catch {
      setToast({ message: 'לא הצלחנו להעתיק. בדקו הרשאות דפדפן.', tone: 'error' })
    }
  }

  const handleDownloadIcs = () => {
    if (!summary.actionItems.length) return
    const now = new Date()
    const formatDate = (value: Date) =>
      value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')

    const events = summary.actionItems
      .map((item, index) => {
        const start = new Date(now.getTime() + index * 60000)
        return [
          'BEGIN:VEVENT',
          `UID:action-${index}-${now.getTime()}@meeting-notes-ai`,
          `DTSTAMP:${formatDate(now)}`,
          `DTSTART:${formatDate(start)}`,
          'DURATION:PT30M',
          `SUMMARY:${escapeIcsText(item)}`,
          'END:VEVENT',
        ].join('\n')
      })
      .join('\n')

    const content = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Meeting Notes AI//EN',
      events,
      'END:VCALENDAR',
    ].join('\n')

    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'meeting-action-items.ics'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    setToast({ message: 'נוצר קובץ ICS למשימות.', tone: 'success' })
  }

  const tabs = [
    { id: 'summary', label: 'סיכום' },
    { id: 'actionItems', label: 'משימות', count: summary.actionItems.length },
    { id: 'decisions', label: 'החלטות', count: summary.decisions.length },
    { id: 'participants', label: 'משתתפים', count: summary.participants.length },
    { id: 'transcript', label: 'תמלול' },
  ]

  return (
    <div className="app" dir={detectRtl(language)}>
      <div className="bg-orb" aria-hidden="true" />
      <Header
        title="תמלול וסיכום פגישות בצורה חכמה"
        subtitle="מעלים הקלטה ומקבלים תמלול מלא, סיכום תמציתי, החלטות ומשימות לביצוע."
      />

      <div className="layout">
        <UploadPanel
          fileName={file?.name ?? null}
          apiBase={apiBase}
          loading={loading}
          stage={stage}
          onFileChange={setFile}
          onApiBaseChange={persistApiBase}
          onStart={handleUpload}
        />
        <ProgressStepper steps={progressSteps} activeIndex={progressStep} label={progressLabel} />
      </div>

      <section className="panel results">
        <div className="panel-header">
          <h2>תוצרים</h2>
          <span className="tag">{language === 'he' ? 'עברית' : 'English'}</span>
        </div>
        <ResultsTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="tab-panels">
          <div
            id="panel-summary"
            role="tabpanel"
            aria-labelledby="tab-summary"
            hidden={activeTab !== 'summary'}
          >
            <SummaryCard summary={summary.summary} isLoading={loading} />
          </div>
          <div
            id="panel-actionItems"
            role="tabpanel"
            aria-labelledby="tab-actionItems"
            hidden={activeTab !== 'actionItems'}
          >
            <ActionItemsCard
              items={summary.actionItems}
              checks={actionChecks}
              isLoading={loading}
              notice={null}
              onToggle={toggleAction}
              onCopy={handleCopyActions}
              onDownloadIcs={handleDownloadIcs}
            />
          </div>
          <div
            id="panel-decisions"
            role="tabpanel"
            aria-labelledby="tab-decisions"
            hidden={activeTab !== 'decisions'}
          >
            <DecisionsCard decisions={summary.decisions} isLoading={loading} />
          </div>
          <div
            id="panel-participants"
            role="tabpanel"
            aria-labelledby="tab-participants"
            hidden={activeTab !== 'participants'}
          >
            <ParticipantsCard participants={summary.participants} isLoading={loading} />
          </div>
          <div
            id="panel-transcript"
            role="tabpanel"
            aria-labelledby="tab-transcript"
            hidden={activeTab !== 'transcript'}
          >
            <TranscriptView
              transcript={transcript}
              query={searchQuery}
              isLoading={loading}
              onQueryChange={setSearchQuery}
            />
          </div>
        </div>
      </section>

      <ExportBar disabled={!hasSummary} onExport={handleDownload} />

      {toast && (
        <div className="toast-stack" aria-live="polite">
          <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
