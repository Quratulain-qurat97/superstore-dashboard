
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main
      style={{
        display: 'flex',
        minHeight: '70vh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
        color: '#334155',
      }}
    >
      <h1 style={{ fontSize: '64px', margin: 0 }}>
        404
      </h1>

      <h2 style={{ margin: '12px 0' }}>
        Page Not Found
      </h2>

      <p style={{ color: '#64748B', marginBottom: '24px' }}>
        The page you're looking for doesn't exist or may have been moved.
      </p>

      <Link
        to="/"
        style={{
          padding: '10px 20px',
          borderRadius: '6px',
          background: '#2563EB',
          color: '#FFFFFF',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Return to Dashboard
      </Link>
    </main>
  );
}
