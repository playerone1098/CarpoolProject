import React from 'react';
import { useApp } from '../../context/AppContext';
import { Car, Bell, X, PlusCircle, Clock, User, CheckCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'rides' | 'offer' | 'history' | 'profile';
  showNotifications: boolean;
  setShowNotifications: (val: boolean) => void;
}

const formatTimeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  showNotifications,
  setShowNotifications,
}) => {
  const { isMock, notifications, unreadCount, refreshNotifications, markNotifRead, markAllNotifRead } = useApp();

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '16px',
    }}>
      <div>
        {activeTab === 'rides' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent)',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Car size={22} color="var(--accent-light)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.1 }}>RideShare</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Daily Commutes</span>
            </div>
          </div>
        )}

        {activeTab === 'offer' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent)',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <PlusCircle size={22} color="var(--accent-light)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.1 }}>Offer a Ride</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Share your commute and split fuel cost</span>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent)',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={22} color="var(--accent-light)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.1 }}>Ride History</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Your past & scheduled commutes</span>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent)',
              borderRadius: '12px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <User size={22} color="var(--accent-light)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.1 }}>Profile Settings</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Manage account & addresses</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isMock && (
          <span className="glass" style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.2)' }}>
            Demo Server Mode
          </span>
        )}
        
        {/* Notification Bell with Unread Count Badge */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => {
            setShowNotifications(!showNotifications);
            if (!showNotifications) refreshNotifications();
          }} className="btn-icon" style={{ position: 'relative' }}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                minWidth: '18px',
                height: '18px',
                background: 'var(--error)',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#fff',
                padding: '0 4px',
                lineHeight: 1,
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
                animation: 'pulse 2s infinite',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Overlay Popover */}
          {showNotifications && (
            <div className="glass" style={{
              position: 'absolute',
              top: '48px',
              right: '0',
              width: '320px',
              borderRadius: 'var(--radius-md)',
              padding: '0',
              zIndex: 2000,
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '0.9rem', margin: 0 }}>Notifications</h4>
                  {unreadCount > 0 && (
                    <span style={{
                      background: 'var(--accent-glow)',
                      color: 'var(--accent-light)',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      border: '1px solid var(--accent)',
                    }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await markAllNotifRead();
                      }}
                      title="Mark all as read"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--accent-light)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.7rem',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-glow)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <CheckCheck size={14} />
                      Read all
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <Bell size={28} color="var(--text-muted)" style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No notifications yet</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0', opacity: 0.7 }}>You'll be notified when someone joins your ride</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id}
                      onClick={() => { if (!n.read) markNotifRead(n._id); }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-color)',
                        background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.06)',
                        cursor: n.read ? 'default' : 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        {!n.read && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            flexShrink: 0,
                            marginTop: '5px',
                            boxShadow: '0 0 6px var(--accent)',
                          }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                            <h5 style={{
                              fontSize: '0.8rem',
                              fontWeight: n.read ? 500 : 700,
                              margin: 0,
                              color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)',
                            }}>{n.title}</h5>
                            <span style={{
                              fontSize: '0.65rem',
                              color: 'var(--text-muted)',
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                            }}>
                              {n.createdAt ? formatTimeAgo(n.createdAt) : ''}
                            </span>
                          </div>
                          <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            margin: '4px 0 0',
                            lineHeight: 1.4,
                          }}>{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
