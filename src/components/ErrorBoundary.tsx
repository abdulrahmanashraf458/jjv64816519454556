import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retries: number;
  isDOMNodeError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retries: 0,
      isDOMNodeError: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Check if this is a DOM node manipulation error
    const isDOMNodeError = 
      error.message.includes('removeChild') || 
      error.message.includes('insertBefore') ||
      error.message.includes('appendChild') ||
      error.message.includes('is not a child of this node');
    
    return {
      hasError: true,
      error,
      isDOMNodeError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to server
    this.logErrorToServer(error, errorInfo);
    
    // For DOM node errors, try to recover automatically after a short delay
    if (this.isDOMNodeError(error.message) && this.state.retries < 3) {
      setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          retries: prevState.retries + 1
        }));
      }, 2000);
    }
  }

  isDOMNodeError(errorMessage: string): boolean {
    return (
      errorMessage.includes('removeChild') || 
      errorMessage.includes('insertBefore') ||
      errorMessage.includes('appendChild') ||
      errorMessage.includes('is not a child of this node')
    );
  }

  logErrorToServer(error: Error, errorInfo: ErrorInfo): void {
    // Send error to backend for logging
    try {
      fetch('/api/log/client-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: error.toString(),
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }),
      }).catch(e => console.error('Failed to send error to server:', e));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Special handling for DOM node errors
      if (this.state.isDOMNodeError) {
        return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg w-full border border-gray-700">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-yellow-900/30 p-4 rounded-full">
                  <AlertOctagon size={48} className="text-yellow-500" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-white text-center mb-4">
                UI Rendering Issue Detected
              </h1>
              
              <p className="text-gray-300 text-center mb-6">
                The application encountered a temporary rendering issue. Click the button below to continue. This error has been reported to our team.
              </p>

              <div className="flex justify-center space-x-4">
                <button 
                  onClick={this.handleRetry}
                  className="flex items-center bg-yellow-700 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Continue
                </button>
                <button 
                  onClick={this.handleReload}
                  className="flex items-center bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Default error UI for other errors
      return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-lg w-full border border-gray-700">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-red-900/30 p-4 rounded-full">
                <AlertTriangle size={48} className="text-red-500" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-white text-center mb-4">
              Application Error
            </h1>
            
            <p className="text-gray-300 text-center mb-6">
              We apologize for the inconvenience. The application has encountered an unexpected error. Our team has been notified and is working to fix the issue.
            </p>
            
            <div className="flex justify-center">
              <button 
                onClick={this.handleReload}
                className="flex items-center bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                <RefreshCw size={16} className="mr-2" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 