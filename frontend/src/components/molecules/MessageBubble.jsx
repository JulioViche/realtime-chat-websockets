import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileLines } from '@fortawesome/free-regular-svg-icons'
import Nickname from '../atoms/Nickname'
import Message from '../atoms/Message'
import Timestamp from '../atoms/Timestamp'
import FilePreview from './FilePreview'

const MessageBubble = ({ msg }) => {
  const { isMine, file, nickname, content, time } = msg

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      {!isMine && <Nickname nickname={nickname} />}

      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
          isMine
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        {/* Previsualización de Archivo Adjunto */}
        {file && <FilePreview file={file} isMine={isMine} />}

        {/* Texto del mensaje */}
        {content && <Message text={content} />}
      </div>

      <Timestamp time={time} />
    </div>
  )
}

export default MessageBubble
