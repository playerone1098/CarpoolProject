import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapComponent } from '../MapComponent';

interface HistoryTabProps {
  expandedRideMapId: string | null;
  setExpandedRideMapId: (id: string | null) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  expandedRideMapId,
  setExpandedRideMapId,
}) => {
  const { historyRides, user } = useApp();

  const sortedHistory = [...historyRides].sort(
    (a, b) => new Date(b.rideTime).getTime() - new Date(a.rideTime).getTime()
  );

  const curTime = new Date();
  const upcomingHistory = sortedHistory.filter(r => new Date(r.rideTime) >= curTime);
  const pastHistory = sortedHistory.filter(r => new Date(r.rideTime) < curTime);

  const offeredCount = historyRides.filter(r => r.driver?._id === user?._id).length;
  const bookedCount = historyRides.filter(r => r.passengers?.some((p: any) => p._id === user?._id)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
        <div className="glass" style={{ padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Trips</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--accent-light)' }}>
            {historyRides.length}
          </h3>
        </div>
        <div className="glass" style={{ padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Offered (Driver)</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--success)' }}>
            {offeredCount}
          </h3>
        </div>
        <div className="glass" style={{ padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Booked (Rider)</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--warning)' }}>
            {bookedCount}
          </h3>
        </div>
      </div>

      {/* Upcoming Rides */}
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🕒 Upcoming Shared Rides ({upcomingHistory.length})
        </h4>
        {upcomingHistory.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 16px' }} className="glass">
            No upcoming scheduled rides.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingHistory.map((ride: any) => {
              const isDr = ride.driver?._id === user?._id;
              return (
                <div key={ride._id} className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        background: isDr ? 'var(--accent-glow)' : 'rgba(16, 185, 129, 0.1)', 
                        color: isDr ? 'var(--accent-light)' : 'var(--success)', 
                        border: isDr ? '1px solid var(--accent)' : '1px solid var(--success)' 
                      }}>
                        {isDr ? 'DRIVER' : 'RIDER'}
                      </span>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        Upcoming
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(ride.rideTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--success)' }}>🟢</span>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{ride.pickupLocation}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--error)' }}>🔴</span>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{ride.dropLocation}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      🚗 {ride.carModel} • {ride.seatsAvailable} seats left • {ride.price && ride.price > 0 ? `₹${ride.price}` : 'Free'}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setExpandedRideMapId(expandedRideMapId === ride._id ? null : ride._id)} 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      🗺️ {expandedRideMapId === ride._id ? 'Close Map' : 'View Route'}
                    </button>
                  </div>

                  {expandedRideMapId === ride._id && (
                    <div style={{ height: '200px', marginTop: '12px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <MapComponent 
                        pickupCoords={ride.pickupCoords || { lat: 28.6, lng: 77.2 }}
                        dropCoords={ride.dropCoords || { lat: 28.7, lng: 77.3 }}
                        readonly={true}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Rides */}
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✓ Completed Shared Rides ({pastHistory.length})
        </h4>
        {pastHistory.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 16px' }} className="glass">
            No past rides found in your history.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pastHistory.map((ride: any) => {
              const isDr = ride.driver?._id === user?._id;
              return (
                <div key={ride._id} className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', opacity: 0.85 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '10px', 
                        background: isDr ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)', 
                        color: isDr ? 'var(--accent-light)' : 'var(--text-secondary)',
                        border: '1px solid var(--border-color)' 
                      }}>
                        {isDr ? 'DRIVER' : 'RIDER'}
                      </span>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.05)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                        Completed
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(ride.rideTime).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                      <span style={{ color: 'var(--text-muted)' }}>🟢</span>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{ride.pickupLocation}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                      <span style={{ color: 'var(--text-muted)' }}>🔴</span>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{ride.dropLocation}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      🚗 {ride.carModel} • Shared with {ride.passengers?.length || 0} co-commuters • {ride.price && ride.price > 0 ? `₹${ride.price}` : 'Free'}
                    </span>
                    <button 
                      type="button"
                      onClick={() => setExpandedRideMapId(expandedRideMapId === ride._id ? null : ride._id)} 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      🗺️ {expandedRideMapId === ride._id ? 'Close Map' : 'View Route'}
                    </button>
                  </div>

                  {expandedRideMapId === ride._id && (
                    <div style={{ height: '200px', marginTop: '12px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <MapComponent 
                        pickupCoords={ride.pickupCoords || { lat: 28.6, lng: 77.2 }}
                        dropCoords={ride.dropCoords || { lat: 28.7, lng: 77.3 }}
                        readonly={true}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
