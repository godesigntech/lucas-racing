import { Component, type ReactNode } from 'react';

/** Keeps one broken view from blanking the whole site. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  componentDidCatch(error: Error) { console.error('View crashed:', error); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="wrap page">
        <div className="empty">
          <div className="h4">Something went wrong on this page</div>
          <p className="small">{this.state.error.message}</p>
          <button className="btn btn-dark" style={{ marginTop: 12 }} onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      </div>
    );
  }
}
