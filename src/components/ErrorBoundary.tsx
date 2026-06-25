import React from 'react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 20,
          background: '#1E293B',
          color: '#F8FAFC',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'monospace',
          gap: 12,
        }}>
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#EF4444' }}>
            JavaScript Error
          </div>
          <pre style={{
            background: '#0F172A',
            padding: 16,
            borderRadius: 8,
            fontSize: 11,
            maxWidth: '90%',
            overflow: 'auto',
            color: '#F87171',
            whiteSpace: 'pre-wrap',
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 24px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
