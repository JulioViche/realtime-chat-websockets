const Button = ({ text, onClick, type = 'button', customClass = 'mt-4' }) => {
  return (
    <button
      type={type}
      className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg active:transform active:scale-95 ${customClass}`}
      onClick={onClick}
    >
      {text}
    </button>
  )
}

export default Button
