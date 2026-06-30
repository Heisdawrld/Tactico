'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-surface-base p-4">
          <div className="max-w-md w-full">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                  Something went wrong
                </h1>
                <p className="text-muted-foreground text-sm">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  variant="ghost"
                >
                  Go to Dashboard
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs text-muted-foreground mt-4 text-left">
                  <summary>Error Details</summary>
                  <pre className="mt-2 p-2 bg-background rounded overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                  <pre className="mt-2 p-2 bg-background rounded overflow-auto">
                    {JSON.stringify(this.state.errorInfo, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component version
export function withErrorBoundary(
  Component: React.ComponentType<any>,
  fallback?: ReactNode
) {
  return class extends ErrorBoundary {
    render() {
      return (
        <ErrorBoundary fallback={fallback}>
          <Component {...this.props} />
        </ErrorBoundary>
      );
    }
  };
}
