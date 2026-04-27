const LoginInput = ({ type, placeholder, value, onChange }) => {
  return (
    <input
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-700 placeholder-gray-400"
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  )
}

export default LoginInput
