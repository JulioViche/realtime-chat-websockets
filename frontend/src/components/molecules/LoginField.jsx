import LoginInput from '../atoms/LoginInput'

const LoginField = ({ label, type, placeholder, value, onChange }) => {
  return (
    <div className="flex flex-col space-y-1 mb-4">
      <label className="text-sm font-medium text-gray-700 ml-1">{label}</label>
      <LoginInput
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

export default LoginField
