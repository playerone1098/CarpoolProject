import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  timestamp: number;
}

interface NotificationToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 5000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      width: '100%',
      maxWidth: '400px',
      padding: '0 16px',
      pointerEvents: 'none',
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastNotification; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onDismiss(toast.id), 400);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(toast.id), 400);
  };

  return (
    <div
      style={{
        background: 'rgba(15, 15, 25, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(99, 102, 241, 0.15)',
        pointerEvents: 'auto',
        transform: isLeaving 
          ? 'translateY(-20px) scale(0.95)' 
          : isVisible 
            ? 'translateY(0) scale(1)' 
            : 'translateY(-20px) scale(0.95)',
        opacity: isLeaving ? 0 : isVisible ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'default',
      }}
    >
      {/* Icon */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Bell size={16} color="var(--accent-light)" />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h5 style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          margin: 0,
          color: '#fff',
          lineHeight: 1.3,
        }}>{toast.title}</h5>
        <p style={{
          fontSize: '0.78rem',
          color: 'rgba(255, 255, 255, 0.7)',
          margin: '4px 0 0',
          lineHeight: 1.4,
        }}>{toast.message}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'rgba(255, 255, 255, 0.4)',
          padding: '2px',
          flexShrink: 0,
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)')}
      >
        <X size={14} />
      </button>
    </div>
  );
};
