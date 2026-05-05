const Link = ({ message, text, href }) => {
  return (
    <div className="mt-6 text-center text-sm text-gray-600">
      {message}{' '}
      <a href={href} className="text-blue-600 hover:underline font-medium">
        {text}
      </a>
    </div>
  )
}

export default Link
