const FilePreview = ({ file, isMine }) => {
  // Función sencilla para deducir si es una imagen
  const isImage =
    file &&
    (file.type?.startsWith('image/') ||
      (typeof file.name === 'string' &&
        file.name.match(/\.(jpeg|jpg|gif|png)$/i)) ||
      (typeof file.url === 'string' &&
        file.url.match(/\.(jpeg|jpg|gif|png)$/i)))

  return (
    <div
      className={`mb-2 rounded-lg overflow-hidden ${isMine ? 'bg-blue-700' : 'bg-gray-100'} p-1`}
    >
      {isImage ? (
        <img
          src={file.url || URL.createObjectURL(file)}
          alt="adjunto"
          className="max-h-48 max-w-full object-cover rounded-md"
        />
      ) : (
        <div className="flex items-center p-2">
          <FontAwesomeIcon icon={faFileLines} className="mr-2" />
          <a
            href={file.url || '#'}
            className={`text-sm font-medium underline truncate ${isMine ? 'text-blue-100' : 'text-blue-600'}`}
          >
            {file.name}
          </a>
        </div>
      )}
    </div>
  )
}

export default FilePreview
