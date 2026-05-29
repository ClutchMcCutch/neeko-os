import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  message: string;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    message: '',
  };

  static getDerivedStateFromError(error: Error) {
    return {
      message: error.message || 'The dashboard hit an unexpected error.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Neeko EventOS crashed', error, info);
  }

  render() {
    if (!this.state.message) {
      return this.props.children;
    }

    return (
      <main className="grid min-h-screen place-items-center px-4 py-10">
        <section className="max-w-xl rounded-lg border border-neeko-rose/30 bg-ink-900/90 p-6 text-stone-200 shadow-premium">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-neeko-rose/30 bg-neeko-rose/10 text-neeko-rose">
              <AlertTriangle size={20} />
            </span>
            <div>
              <p className="label text-neeko-rose">Neeko EventOS</p>
              <h1 className="mt-1 text-2xl font-semibold text-stone-50">Dashboard could not finish loading</h1>
              <p className="mt-3 text-sm leading-6 text-stone-400">{this.state.message}</p>
            </div>
          </div>
          <button className="btn-primary mt-5" type="button" onClick={() => window.location.reload()}>
            <RotateCcw size={16} />
            Reload
          </button>
        </section>
      </main>
    );
  }
}
