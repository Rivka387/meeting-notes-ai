import { useMemo } from 'react'

type TranscriptViewProps = {
  transcript: string
  query: string
  isLoading: boolean
  onQueryChange: (value: string) => void
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default function TranscriptView({
  transcript,
  query,
  isLoading,
  onQueryChange,
}: TranscriptViewProps) {
  const highlighted = useMemo(() => {
    if (!query.trim()) return [transcript]
    const safeQuery = escapeRegExp(query.trim())
    const regex = new RegExp(`(${safeQuery})`, 'gi')
    return transcript.split(regex)
  }, [query, transcript])

  return (
    <div className="transcript">
      <div className="panel-header">
        <h3>תמלול מלא</h3>
        <div className="search">
          <input
            type="search"
            placeholder="חיפוש בתמלול"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-label="חיפוש בתמלול"
          />
        </div>
      </div>
      {isLoading ? (
        <div className="skeleton-block">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ) : transcript ? (
        <p className="transcript-text" aria-live="polite">
          {highlighted.map((part, index) =>
            query && part.toLowerCase() === query.toLowerCase() ? (
              <mark key={index}>{part}</mark>
            ) : (
              <span key={index}>{part}</span>
            )
          )}
        </p>
      ) : (
        <p className="muted">התמלול יופיע כאן לאחר העלאה.</p>
      )}
    </div>
  )
}
