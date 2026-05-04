const RoomHeader = ({ roomName, pin, onlineCount, onLeave }) => {
  return (
    <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-gray-200">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{roomName}</h1>
        <p className="text-sm text-gray-500">
          PIN: <span className="font-mono bg-gray-100 px-1 rounded">{pin}</span>{' '}
          • <span className="text-green-500">{onlineCount} en línea</span>
        </p>
      </div>
      <button
        onClick={onLeave}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm"
      >
        Salir de la Sala
      </button>
    </header>
  )
}

export default RoomHeader
