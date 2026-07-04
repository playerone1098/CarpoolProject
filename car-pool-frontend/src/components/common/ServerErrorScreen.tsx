import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface ServerErrorScreenProps {
  retryConnection: () => Promise<void>;
}

export const ServerErrorScreen: React.FC<ServerErrorScreenProps> = ({ retryConnection }) => {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'var(--bg-primary)',
      padding: '20px',
    }}>
      <div style={{ position: 'absolute', width: '250px', height: '250px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '50%', filter: 'blur(80px)', top: '15%', left: '10%' }}></div>

      <div className="glass" style={{
        width: '100%',
        maxWidth: '420px',
        borderRadius: 'var(--radius-lg)',
        padding: '40px 32px',
        textAlign: 'center',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%', display: 'flex', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <ShieldAlert size={32} color="var(--error)" />
          </div>
        </div>

        <h1 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>
          {import.meta.env.DEV ? 'Server Connection Failed' : 'Connection Error'}
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.6 }}>
          {import.meta.env.DEV ? (
            <>
              Unable to reach the backend server. Please verify your NestJS API server is running and active at:
              <code style={{ display: 'block', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', marginTop: '8px', color: 'var(--accent-light)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                http://localhost:4000/v1
              </code>
            </>
          ) : (
            'We are unable to connect to the server right now. Please check your internet connection and try again.'
          )}
        </p>

        {import.meta.env.DEV && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Troubleshooting:</span>
            <div>• Start NestJS backend with <code style={{ color: '#ffffff' }}>npm run start:dev</code>.</div>
            <div>• Make sure Redis and MongoDB services are running.</div>
          </div>
        )}

        <button onClick={retryConnection} className="btn btn-primary" style={{ width: '100%' }}>
          Retry Connection
        </button>
      </div>
    </div>
  );
};
