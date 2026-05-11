import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileLines } from '@fortawesome/free-regular-svg-icons'

const imageExtensionPattern = /\.(jpeg|jpg|gif|png)$/i

const isImageFile = (file) => {
  return (
    file?.type?.startsWith('image/') ||
    imageExtensionPattern.test(file?.name || '') ||
    imageExtensionPattern.test(file?.url || '')
  )
}

const FilePreview = ({ file, isMine }) => {
  const fileUrl = file.url || '#'

  if (isImageFile(file)) {
    return (
      <img
        src={fileUrl}
        alt={file.name || 'Archivo adjunto'}
        className="attachment-image mb-2"
      />
    )
  }

  return (
    <div className="file-card">
      <FontAwesomeIcon icon={faFileLines} />
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className={`truncate text-sm font-black underline underline-offset-4 ${
          isMine ? 'text-white' : 'text-[var(--color-primary-strong)]'
        }`}
      >
        {file.name || 'Archivo adjunto'}
      </a>
    </div>
  )
}

export default FilePreview
