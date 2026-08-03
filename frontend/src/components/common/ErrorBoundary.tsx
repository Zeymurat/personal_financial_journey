import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

/**
 * Render crash'lerinde beyaz ekran yerine kurtarma UI.
 * (Network hataları toast ile; burası React render hataları için.)
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Beklenmeyen bir hata oluştu',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7] p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Bir şeyler ters gitti</h1>
          <p className="text-sm text-slate-600 mb-6 break-words">{this.state.message}</p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Tekrar dene
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded-xl bg-[#0F2744] text-white text-sm font-semibold hover:opacity-90"
            >
              Sayfayı yenile
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
