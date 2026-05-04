import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/index.css'
import JoinRoom from './components/organisms/JoinRoom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <JoinRoom />
  </StrictMode>,
)
