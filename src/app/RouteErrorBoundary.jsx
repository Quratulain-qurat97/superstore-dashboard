
import { Component } from 'react';

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            color: '#334155',
          }}
        >
          <h2>Something went wrong</h2>
          <p>
            This page couldn't be displayed. Please refresh the page and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '6px',
              background: '#2563EB',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            Refresh page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
