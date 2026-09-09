import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WmsDataProvider } from './context/WmsDataContext.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('WMS Runtime Error Boundary Caught:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-zinc-400 mb-6">
              The application encountered an unexpected runtime issue. You can reload or reset the local cache.
            </p>
            {this.state.error && (
              <pre className="text-left bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 text-xs text-rose-300 font-mono mb-6 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
              >
                Reset Data & Restart
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <WmsDataProvider>
        <App />
      </WmsDataProvider>
    </ErrorBoundary>
  </StrictMode>,
)

