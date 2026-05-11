const Input = ({
  type,
  placeholder,
  value,
  onChange,
  className = '',
  ...props
}) => {
  return (
    <input
      className={`input-field ${className}`}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  )
}

export default Input
