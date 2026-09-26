import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

if (typeof window !== 'undefined' && typeof global === 'undefined') {
  window.global = window
}

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <App />,
)
