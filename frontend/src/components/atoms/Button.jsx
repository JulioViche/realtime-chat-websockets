const Button = ({ text, onClick }) => {
  return (
    <button
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg active:transform active:scale-95 mt-4"
      onClick={onClick}
    >
      {text}
    </button>
  )
}

export default Button
