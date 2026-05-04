const MessageBubble = ({ msg }) => {
  // Función sencilla para deducir si es una imagen
  const isImage =
    msg.file &&
    (msg.file.type?.startsWith('image/') ||
      (typeof msg.file.name === 'string' &&
        msg.file.name.match(/\.(jpeg|jpg|gif|png)$/i)) ||
      (typeof msg.file.url === 'string' &&
        msg.file.url.match(/\.(jpeg|jpg|gif|png)$/i)))

  return (
    <div
      className={`flex flex-col ${msg.isMine ? 'items-end' : 'items-start'}`}
    >
      {!msg.isMine && (
        <span className="text-xs text-gray-500 ml-1 mb-1 font-medium">
          {msg.nickname}
        </span>
      )}
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
          msg.isMine
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        {/* Previsualización de Archivo Adjunto */}
        {msg.file && (
          <div
            className={`mb-2 rounded-lg overflow-hidden ${msg.isMine ? 'bg-blue-700' : 'bg-gray-100'} p-1`}
          >
            {isImage ? (
              <img
                src={msg.file.url || URL.createObjectURL(msg.file)}
                alt="adjunto"
                className="max-h-48 max-w-full object-cover rounded-md"
              />
            ) : (
              <div className="flex items-center p-2">
                <svg
                  className="w-6 h-6 mr-2 opacity-80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <a
                  href={msg.file.url || '#'}
                  className={`text-sm font-medium underline truncate ${msg.isMine ? 'text-blue-100' : 'text-blue-600'}`}
                >
                  {msg.file.name}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Texto del mensaje */}
        {msg.content && (
          <p className="text-sm md:text-base wrap-break-word">{msg.content}</p>
        )}
      </div>
      <span className="text-[10px] text-gray-400 mt-1">{msg.time}</span>
    </div>
  )
}

export default MessageBubble
