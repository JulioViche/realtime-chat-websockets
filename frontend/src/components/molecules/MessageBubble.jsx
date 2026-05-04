const MessageBubble = ({ msg }) => {
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
        <p className="text-sm md:text-base wrap-break-word">{msg.content}</p>
      </div>
      <span className="text-[10px] text-gray-400 mt-1">{msg.time}</span>
    </div>
  )
}

export default MessageBubble
