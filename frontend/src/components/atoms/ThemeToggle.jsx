import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { useTheme } from '../../context/useTheme'

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme()
  const label = isDark ? 'Activar modo claro' : 'Activar modo oscuro'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      <FontAwesomeIcon icon={isDark ? faSun : faMoon} />
    </button>
  )
}

export default ThemeToggle
