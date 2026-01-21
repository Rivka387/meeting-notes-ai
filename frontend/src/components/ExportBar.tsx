type ExportBarProps = {
  disabled: boolean
  onExport: () => void
}

export default function ExportBar({ disabled, onExport }: ExportBarProps) {
  return (
    <section className="panel export">
      <div>
        <h2>ייצוא לקובץ Word</h2>
        <p>תוכלו להוריד את הסיכום יחד עם התמלול המלא.</p>
      </div>
      <button className="btn primary" onClick={onExport} disabled={disabled}>
        הורדת קובץ Word
      </button>
    </section>
  )
}
