type HeaderProps = {
  title: string
  subtitle: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Meeting Notes AI</p>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
    </header>
  )
}
