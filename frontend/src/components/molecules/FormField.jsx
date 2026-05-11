import Input from '../atoms/Input'

const FormField = ({
  label,
  type,
  placeholder,
  value,
  onChange,
  ...inputProps
}) => {
  return (
    <div className="form-field">
      <label className="field-label">{label}</label>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...inputProps}
      />
    </div>
  )
}

export default FormField
