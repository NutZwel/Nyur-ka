import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Global error handler for renderer
window.onerror = (msg, url, line, col, err) => {
  console.error('[Global Error]', msg, url, line, col, err)
  return false
}
window.onunhandledrejection = (event) => {
  console.error('[Unhandled Promise]', event.reason)
}

console.log('[Nyu\'rka] App starting')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
