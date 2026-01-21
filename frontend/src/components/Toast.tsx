type ToastProps = {
  message: string
  tone?: 'success' | 'error' | 'info'
  onClose: () => void
}

export default function Toast({ message, tone = 'info', onClose }: ToastProps) {
  const toneClass = `toast ${tone}`
  return (
    <div className={toneClass} role={tone === 'error' ? 'alert' : 'status'}>
      <div className="toast-dot" />
      <div className="toast-body">{message}</div>
      <button className="toast-close" onClick={onClose} aria-label="סגור הודעה">
        ✕
      </button>
    </div>
  )
}
