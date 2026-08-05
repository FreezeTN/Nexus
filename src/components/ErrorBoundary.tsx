import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleClearStorage = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error('Failed to clear localStorage', e);
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border border-red-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-serif font-bold text-2xl text-amber-200">
                Something Went Wrong
              </h2>
              <p className="text-stone-300 text-sm leading-relaxed">
                An unexpected interface error occurred. You can attempt to reload or clear local cached data.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 bg-stone-950 border border-stone-800 rounded-xl font-mono text-xs text-red-400 text-left overflow-x-auto max-h-32">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" /> Try Reloading View
              </button>

              <button
                onClick={this.handleClearStorage}
                className="w-full sm:w-auto px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-400" /> Reset App Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this.props as Props).children;
  }
}
