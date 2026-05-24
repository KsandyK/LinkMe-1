import { Component, ReactNode } from 'react'
interface Props { children: ReactNode }
interface State { hasError: boolean }
export default class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return <div className="text-white p-8">Something went wrong.</div>
    return this.props.children
  }
}
