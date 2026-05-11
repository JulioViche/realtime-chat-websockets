import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBolt,
  faComments,
  faLock,
  faPaperclip,
  faWifi,
} from '@fortawesome/free-solid-svg-icons'
import ThemeToggle from '../atoms/ThemeToggle'

const metrics = [
  { icon: faLock, value: 'PIN', label: 'acceso privado' },
  { icon: faBolt, value: '30m', label: 'sesiones activas' },
  { icon: faPaperclip, value: '10MB', label: 'multimedia segura' },
]

const features = [
  { icon: faWifi, label: 'Tiempo real' },
  { icon: faLock, label: 'Salas con PIN' },
  { icon: faPaperclip, label: 'Multimedia' },
]

const roomPreview = ['Soporte', 'Clase', 'Memes']

const SignalRail = () => (
  <div className="signal-rail" aria-hidden="true">
    {metrics.map((metric) => (
      <div className="signal-item" key={metric.label}>
        <span className="signal-icon">
          <FontAwesomeIcon icon={metric.icon} />
        </span>
        <span>
          <strong>{metric.value}</strong>
          <small>{metric.label}</small>
        </span>
      </div>
    ))}
  </div>
)

const ProductPreview = () => (
  <div className="showcase-stage" aria-hidden="true">
    <div className="product-preview">
      <div className="preview-toolbar">
        <div className="window-dots">
          <span />
          <span />
          <span />
        </div>
        <span className="text-sm font-black">Sala 123456</span>
      </div>

      <div className="preview-body">
        <div className="preview-sidebar">
          {roomPreview.map((room, index) => (
            <div
              className={`room-chip ${index === 0 ? 'active' : ''}`}
              key={room}
            >
              <FontAwesomeIcon icon={faComments} />
              <span>{room}</span>
            </div>
          ))}
        </div>

        <div className="preview-chat">
          <div className="preview-message">Listo, ya estoy en la sala.</div>
          <div className="preview-message mine">
            Perfecto, seguimos por acá.
          </div>
          <div className="preview-message">Adjunto el PDF de la reunión.</div>
        </div>
      </div>
    </div>
  </div>
)

const FormTemplate = ({
  title,
  subtitle,
  kicker = 'Acceso rápido',
  variant = 'user',
  children,
}) => {
  const isAdmin = variant === 'admin'
  const navHref = isAdmin ? '/' : '/admin'
  const navLabel = isAdmin ? 'Entrar como usuario' : 'Panel admin'

  return (
    <main className="page-shell page-grid">
      <div className="content-wrap">
        <nav className="top-nav" aria-label="Navegación principal">
          <a className="brand-lockup" href="/">
            <span className="brand-mark">
              <FontAwesomeIcon icon={faComments} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base">Realtime Chat</span>
              <span className="block truncate text-xs font-black uppercase text-[var(--color-muted)]">
                WebSockets
              </span>
            </span>
          </a>

          <div className="nav-actions">
            <a className="btn btn-secondary !w-auto" href={navHref}>
              {navLabel}
            </a>
            <ThemeToggle />
          </div>
        </nav>

        <section className="landing-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <FontAwesomeIcon icon={faBolt} />
              Chat en vivo para salas privadas
            </div>
            <h1 className="hero-title">Realtime Chat</h1>
            <p className="hero-lede">
              Conversaciones por PIN, usuarios en línea y envío de archivos en
              una experiencia clara, rápida y pensada para escritorio y móvil.
            </p>

            <SignalRail />

            <ProductPreview />
          </div>

          <aside className="access-panel">
            <p className="panel-kicker">{kicker}</p>
            <h2 className="panel-title">{title}</h2>
            <p className="panel-subtitle">{subtitle}</p>

            {children}

            <div className="feature-row" aria-hidden="true">
              {features.map((feature) => (
                <div className="feature-card" key={feature.label}>
                  <FontAwesomeIcon icon={feature.icon} />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default FormTemplate
