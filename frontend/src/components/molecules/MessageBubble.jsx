import Nickname from '../atoms/Nickname'
import Message from '../atoms/Message'
import Timestamp from '../atoms/Timestamp'
import FilePreview from './FilePreview'

const MessageBubble = ({ msg }) => {
  const { isMine, file, nickname, content, time } = msg

  return (
    <div className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
      {!isMine && <Nickname nickname={nickname} />}

      <div className="message-bubble">
        {file && <FilePreview file={file} isMine={isMine} />}
        {content && <Message text={content} />}
      </div>

      <Timestamp time={time} />
    </div>
  )
}

export default MessageBubble
