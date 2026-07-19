import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            backgroundColor: '#050505',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 420 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '1px solid rgba(201,168,76,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              <span style={{ color: '#C9A84C', fontSize: 20 }}>!</span>
            </div>
            <h1
              style={{
                color: '#F9F9F9',
                fontSize: '1.25rem',
                fontWeight: 300,
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
              }}
            >
              Something went wrong
            </h1>
            <p style={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              The page encountered an error. Please refresh to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.5)',
                color: '#C9A84C',
                padding: '0.6rem 1.5rem',
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
