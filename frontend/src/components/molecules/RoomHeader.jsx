import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircle,
  faDoorOpen,
  faHashtag,
} from '@fortawesome/free-solid-svg-icons'
import Button from '../atoms/Button'
import ThemeToggle from '../atoms/ThemeToggle'

const RoomHeader = ({ roomName, pin, onlineCount, onLeave }) => {
  return (
    <header className="chat-header">
      <div className="chat-header-inner">
        <div>
          <h1 className="header-title">{roomName}</h1>
          <div className="pin-pill">
            <FontAwesomeIcon icon={faHashtag} />
            <span className="pin-code">{pin}</span>
            <span aria-hidden="true">|</span>
            <FontAwesomeIcon
              icon={faCircle}
              className="text-[0.55rem] text-[var(--color-success)]"
            />
            <span>{onlineCount}</span>
          </div>
        </div>

        <div className="nav-actions">
          <ThemeToggle />
          <Button
            text="Salir"
            icon={faDoorOpen}
            variant="ghost"
            customClass="!mt-0"
            onClick={onLeave}
          />
        </div>
      </div>
    </header>
  )
}

export default RoomHeader
