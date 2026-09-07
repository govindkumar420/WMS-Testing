import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WmsDataProvider } from './context/WmsDataContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WmsDataProvider>
      <App />
    </WmsDataProvider>
  </StrictMode>,
)
