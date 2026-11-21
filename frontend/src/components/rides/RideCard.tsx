import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapComponent } from '../MapComponent';
import { Map, Check } from 'lucide-react';

interface RideCardProps {
  ride: any;
  isMapExpanded: boolean;
  onToggleMap: () => void;
  onStartEdit: (ride: any) => void;
  onDelete: (rideId: string) => void;
  onBook: (rideId: string) => void;
}

export const RideCard: React.FC<RideCardProps> = ({
  ride,
  isMapExpanded,
  onToggleMap,
  onStartEdit,
  onDelete,
  onBook,
}) => {
  const { user } = useApp();
  
  const driverPhoto = ride.driver.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ride.driver.name)}`;
  const isDriver = ride.driver._id === user?._id;
  const isPassenger = ride.passengers.some((p: any) => p._id === user?._id);

  return (
    <div className="glass-interactive" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div style={{ padding: '20px' }}>
        {/* Driver Profile row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={driverPhoto} alt="Driver" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem' }}>{ride.driver.name}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>🚗 {ride.carModel}</p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-light)', display: 'block' }}>
              {new Date(ride.rideTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {new Date(ride.rideTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Location Details Route */}
        <div style={{ position: 'relative', paddingLeft: '24px', marginBottom: '20px' }}>
          <div style={{ position: 'absolute', top: '4px', left: '6px', bottom: '4px', width: '2px', background: 'dashed rgba(255,255,255,0.1)', borderLeft: '2px dashed var(--border-color)' }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ position: 'absolute', left: '2px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }}></div>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{ride.pickupLocation}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'absolute', left: '2px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ride.dropLocation}</span>
          </div>
        </div>

        {/* Ride stats and button row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Seats Left</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-light)' }}>
                {ride.seatsAvailable - ride.passengers.length} / {ride.seatsAvailable}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Price / Seat</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)' }}>
                {ride.price && ride.price > 0 ? `₹${ride.price}` : 'Free'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={onToggleMap} 
              className="btn btn-secondary" 
              style={{ padding: '8px 12px' }}
              title="Show route map"
            >
              <Map size={16} />
            </button>

            {isDriver ? (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => onStartEdit(ride)} 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(ride._id)} 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 12px', fontSize: '0.85rem', color: 'var(--error)' }}
                >
                  Delete
                </button>
              </div>
            ) : isPassenger ? (
              <button className="btn btn-secondary" style={{ color: 'var(--success)', pointerEvents: 'none' }}>
                <Check size={16} /> Booked
              </button>
            ) : (
              <button 
                onClick={() => onBook(ride._id)} 
                className="btn btn-primary" 
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                disabled={ride.seatsAvailable <= ride.passengers.length}
              >
                {ride.seatsAvailable <= ride.passengers.length ? 'Full' : 'Join'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Map Container */}
      {isMapExpanded && (
        <div style={{ height: '220px', borderTop: '1px solid var(--border-color)' }}>
          <MapComponent 
            pickupCoords={ride.pickupCoords || { lat: 28.6139 + (Math.random() - 0.5) * 0.1, lng: 77.2090 + (Math.random() - 0.5) * 0.1 }}
            dropCoords={ride.dropCoords || { lat: 28.6139 + (Math.random() - 0.5) * 0.1, lng: 77.2090 + (Math.random() - 0.5) * 0.1 }}
            readonly={true}
          />
        </div>
      )}
    </div>
  );
};
