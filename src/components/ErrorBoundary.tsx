"use client";

import React, { ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays fallback UI
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
              <div className="card border-red-500 border-2 bg-red-950">
                <h1 className="text-3xl font-bold text-red-400 mb-4">
                  ⚠️ Something went wrong
                </h1>
                <p className="text-red-300 mb-4">
                  An unexpected error occurred while loading the dashboard.
                </p>
                <div className="bg-red-900 rounded p-4 mb-4 text-sm font-mono text-red-200 overflow-auto">
                  <p className="break-words">
                    {this.state.error?.message || "Unknown error"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-bold transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
