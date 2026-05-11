const Link = ({ message, text, href }) => {
  return (
    <div className="mt-6 text-center text-sm text-[var(--color-muted)]">
      {message}{' '}
      <a href={href} className="text-link">
        {text}
      </a>
    </div>
  )
}

export default Link
