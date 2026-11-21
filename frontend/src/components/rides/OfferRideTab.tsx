import React from 'react';
import { useApp } from '../../context/AppContext';
import { MapComponent } from '../MapComponent';
import { SuggestionsDropdown } from '../common/SuggestionsDropdown';
import { geocodeAddress, reverseGeocode } from '../../utils/distance';

interface OfferRideTabProps {
  rideCarModel: string;
  setRideCarModel: (v: string) => void;
  rideSeats: number;
  setRideSeats: (v: number) => void;
  ridePrice: string;
  setRidePrice: (v: string) => void;
  ridePickup: string;
  setRidePickup: (v: string) => void;
  rideDrop: string;
  setRideDrop: (v: string) => void;
  rideTime: string;
  setRideTime: (v: string) => void;
  ridePickupCoords: { lat: number; lng: number } | null;
  setRidePickupCoords: (c: { lat: number; lng: number } | null) => void;
  rideDropCoords: { lat: number; lng: number } | null;
  setRideDropCoords: (c: { lat: number; lng: number } | null) => void;
  mapSelectionMode: 'pickup' | 'drop' | null;
  setMapSelectionMode: (v: 'pickup' | 'drop' | null) => void;
  editingRideId: string | null;
  
  handleAddressChange: (val: string, field: string, setValState: (v: string) => void) => void;
  activeSuggestionField: string | null;
  setActiveSuggestionField: (field: string | null) => void;
  suggestions: any[];
  handleSelectSuggestion: (item: any, field: string) => void;
  handleAddressIconClick: (type: 'home' | 'work', field: string) => void;
  handleCreateRideSubmit: (e: React.FormEvent) => void;
}

export const OfferRideTab: React.FC<OfferRideTabProps> = ({
  rideCarModel,
  setRideCarModel,
  rideSeats,
  setRideSeats,
  ridePrice,
  setRidePrice,
  ridePickup,
  setRidePickup,
  rideDrop,
  setRideDrop,
  rideTime,
  setRideTime,
  ridePickupCoords,
  setRidePickupCoords,
  rideDropCoords,
  setRideDropCoords,
  mapSelectionMode,
  setMapSelectionMode,
  editingRideId,
  handleAddressChange,
  activeSuggestionField,
  setActiveSuggestionField,
  suggestions,
  handleSelectSuggestion,
  handleAddressIconClick,
  handleCreateRideSubmit,
}) => {
  const { user } = useApp();

  const isRidePickupHomeActive = !!(ridePickupCoords && user?.homeAddress?.coords && ridePickupCoords.lat === user.homeAddress.coords.lat && ridePickupCoords.lng === user.homeAddress.coords.lng);
  const isRidePickupWorkActive = !!(ridePickupCoords && user?.workAddress?.coords && ridePickupCoords.lat === user.workAddress.coords.lat && ridePickupCoords.lng === user.workAddress.coords.lng);
  const isRideDropHomeActive = !!(rideDropCoords && user?.homeAddress?.coords && rideDropCoords.lat === user.homeAddress.coords.lat && rideDropCoords.lng === user.homeAddress.coords.lng);
  const isRideDropWorkActive = !!(rideDropCoords && user?.workAddress?.coords && rideDropCoords.lat === user.workAddress.coords.lat && rideDropCoords.lng === user.workAddress.coords.lng);

  const handleGeocodeRidePickup = async () => {
    if (ridePickup) {
      const coords = await geocodeAddress(ridePickup);
      if (coords) setRidePickupCoords(coords);
    }
  };

  const handleGeocodeRideDrop = async () => {
    if (rideDrop) {
      const coords = await geocodeAddress(rideDrop);
      if (coords) setRideDropCoords(coords);
    }
  };

  const handleRideCoordsSelect = async (type: 'pickup' | 'drop', coords: { lat: number; lng: number }) => {
    if (type === 'pickup') {
      setRidePickupCoords(coords);
      const addr = await reverseGeocode(coords.lat, coords.lng);
      if (addr) setRidePickup(addr);
    } else if (type === 'drop') {
      setRideDropCoords(coords);
      const addr = await reverseGeocode(coords.lat, coords.lng);
      if (addr) setRideDrop(addr);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          {editingRideId ? 'Edit Shared Ride Offer' : 'Offer a Shared Ride'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {editingRideId 
            ? 'Update your ride offer details below.' 
            : 'Fill out the details below to publish your ride offer so passengers can find and book seats with you.'
          }
        </p>
      </div>

      <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <form onSubmit={handleCreateRideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>Car Model & Color</label>
            <input 
              type="text" 
              placeholder="Toyota Camry Black" 
              value={rideCarModel} 
              onChange={(e) => setRideCarModel(e.target.value)} 
              className="input-field" 
              required 
            />
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>Seats Available</label>
            <input 
              type="number" 
              min={1} 
              max={7} 
              value={rideSeats} 
              onChange={(e) => setRideSeats(Number(e.target.value))} 
              className="input-field" 
              required 
            />
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>Price per Seat (₹)</label>
            <input 
              type="number" 
              min={0} 
              value={ridePrice} 
              onChange={(e) => setRidePrice(e.target.value)} 
              className="input-field" 
              placeholder="0"
            />
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>Pickup Location Address</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  placeholder="Tech Park Entrance" 
                  value={ridePickup} 
                  onChange={(e) => handleAddressChange(e.target.value, 'ridePickup', setRidePickup)} 
                  onFocus={() => setActiveSuggestionField('ridePickup')}
                  onBlur={() => setTimeout(handleGeocodeRidePickup, 200)} 
                  className="input-field" 
                  required 
                />
                <SuggestionsDropdown 
                  field="ridePickup"
                  activeSuggestionField={activeSuggestionField}
                  suggestions={suggestions}
                  onSelectSuggestion={handleSelectSuggestion}
                />
              </div>
              <button 
                type="button" 
                onClick={() => handleAddressIconClick('home', 'ridePickup')}
                className="glass-interactive"
                style={{ 
                  padding: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: 'var(--radius-md)', 
                  height: '40px', 
                  width: '40px', 
                  fontSize: '1.1rem', 
                  flexShrink: 0,
                  background: isRidePickupHomeActive ? 'var(--accent-glow)' : 'var(--bg-card)',
                  borderColor: isRidePickupHomeActive ? 'var(--accent)' : 'var(--border-color)',
                  boxShadow: isRidePickupHomeActive ? 'var(--shadow-glow)' : 'none'
                }}
                title={user?.homeAddress?.coords ? "Use Home Location" : "Set Home Location"}
              >
                🏠
              </button>
              <button 
                type="button" 
                onClick={() => handleAddressIconClick('work', 'ridePickup')}
                className="glass-interactive"
                style={{ 
                  padding: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: 'var(--radius-md)', 
                  height: '40px', 
                  width: '40px', 
                  fontSize: '1.1rem', 
                  flexShrink: 0,
                  background: isRidePickupWorkActive ? 'var(--accent-glow)' : 'var(--bg-card)',
                  borderColor: isRidePickupWorkActive ? 'var(--accent)' : 'var(--border-color)',
                  boxShadow: isRidePickupWorkActive ? 'var(--shadow-glow)' : 'none'
                }}
                title={user?.workAddress?.coords ? "Use Work Location" : "Set Work Location"}
              >
                💼
              </button>
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>Destination Location Address</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  placeholder="Vasant Kunj Mall" 
                  value={rideDrop} 
                  onChange={(e) => handleAddressChange(e.target.value, 'rideDrop', setRideDrop)} 
                  onFocus={() => setActiveSuggestionField('rideDrop')}
                  onBlur={() => setTimeout(handleGeocodeRideDrop, 200)} 
                  className="input-field" 
                  required 
                />
                <SuggestionsDropdown 
                  field="rideDrop"
                  activeSuggestionField={activeSuggestionField}
                  suggestions={suggestions}
                  onSelectSuggestion={handleSelectSuggestion}
                />
              </div>
              <button 
                type="button" 
                onClick={() => handleAddressIconClick('home', 'rideDrop')}
                className="glass-interactive"
                style={{ 
                  padding: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: 'var(--radius-md)', 
                  height: '40px', 
                  width: '40px', 
                  fontSize: '1.1rem', 
                  flexShrink: 0,
                  background: isRideDropHomeActive ? 'var(--accent-glow)' : 'var(--bg-card)',
                  borderColor: isRideDropHomeActive ? 'var(--accent)' : 'var(--border-color)',
                  boxShadow: isRideDropHomeActive ? 'var(--shadow-glow)' : 'none'
                }}
                title={user?.homeAddress?.coords ? "Use Home Location" : "Set Home Location"}
              >
                🏠
              </button>
              <button 
                type="button" 
                onClick={() => handleAddressIconClick('work', 'rideDrop')}
                className="glass-interactive"
                style={{ 
                  padding: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: 'var(--radius-md)', 
                  height: '40px', 
                  width: '40px', 
                  fontSize: '1.1rem', 
                  flexShrink: 0,
                  background: isRideDropWorkActive ? 'var(--accent-glow)' : 'var(--bg-card)',
                  borderColor: isRideDropWorkActive ? 'var(--accent)' : 'var(--border-color)',
                  boxShadow: isRideDropWorkActive ? 'var(--shadow-glow)' : 'none'
                }}
                title={user?.workAddress?.coords ? "Use Work Location" : "Set Work Location"}
              >
                💼
              </button>
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>Departure Date & Time</label>
            <input 
              type="datetime-local" 
              value={rideTime} 
              onChange={(e) => setRideTime(e.target.value)} 
              className="input-field" 
              max="9999-12-31T23:59"
              required 
            />
          </div>

          {/* Map Coordinates Picker */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
            <button 
              type="button" 
              onClick={() => setMapSelectionMode(mapSelectionMode === 'pickup' ? null : 'pickup')} 
              className={`btn ${mapSelectionMode === 'pickup' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📍 Set Pickup on Map
            </button>
            <button 
              type="button" 
              onClick={() => setMapSelectionMode(mapSelectionMode === 'drop' ? null : 'drop')} 
              className={`btn ${mapSelectionMode === 'drop' ? 'btn-primary' : 'btn-secondary'}`} 
              style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              📍 Set Drop on Map
            </button>
          </div>

          {(ridePickupCoords || rideDropCoords) && (
            <div style={{ height: '260px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', marginTop: '8px' }}>
              <MapComponent 
                pickupCoords={ridePickupCoords}
                dropCoords={rideDropCoords}
                selectionMode={mapSelectionMode}
                onSelectCoords={(type, coords) => handleRideCoordsSelect(type, coords)}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '12px', fontSize: '0.95rem', fontWeight: 600 }}>
            {editingRideId ? 'Save Changes' : 'Post Ride Offer'}
          </button>
        </form>
      </div>
    </div>
  );
};
