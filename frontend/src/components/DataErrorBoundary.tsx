'use client'

import { ReactNode, Component, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  section?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class DataErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ErrorBoundary] ${this.props.section || 'Data'} error:`,
      error,
      errorInfo
    )
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="card p-6 text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="font-bold text-gray-900 text-[14px]">
              {this.props.section || 'Data'} unavailable
            </p>
            <p className="text-gray-400 text-[12px] mt-2">
              We're working to restore this. Check back in a moment.
            </p>
          </div>
        )
      )
    }

    return this.props.children
  }
}
