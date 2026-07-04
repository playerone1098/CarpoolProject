import React from 'react';
import { Car } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)', gap: '16px' }}>
      <Car size={48} color="var(--accent-light)" className="skeleton" style={{ borderRadius: '50%', padding: '8px' }} />
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Initializing RideShare...</h2>
    </div>
  );
};
