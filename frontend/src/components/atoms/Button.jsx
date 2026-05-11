import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
}

const Button = ({
  text,
  children,
  icon,
  onClick,
  type = 'button',
  variant = 'primary',
  customClass = 'mt-4',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`btn ${VARIANT_CLASS[variant] || VARIANT_CLASS.primary} ${customClass}`}
      onClick={onClick}
      {...props}
    >
      {icon && <FontAwesomeIcon icon={icon} />}
      <span>{children || text}</span>
    </button>
  )
}

export default Button
