import React from 'react';
import { useApp } from '../../context/AppContext';
import { RideFilter } from './RideFilter';
import { RideCard } from './RideCard';
import { getHaversineDistance, geocodeAddress } from '../../utils/distance';
import { Map, Car } from 'lucide-react';

interface RidesTabProps {
  filterSourceAddr: string;
  setFilterSourceAddr: (v: string) => void;
  filterDestAddr: string;
  setFilterDestAddr: (v: string) => void;
  filterSourceCoords: { lat: number; lng: number } | null;
  setFilterSourceCoords: (c: { lat: number; lng: number } | null) => void;
  filterDestCoords: { lat: number; lng: number } | null;
  setFilterDestCoords: (c: { lat: number; lng: number } | null) => void;
  filterSourceRadius: number;
  setFilterSourceRadius: (r: number) => void;
  filterDestRadius: number;
  setFilterDestRadius: (r: number) => void;
  hasSearchedRides: boolean;
  setHasSearchedRides: (b: boolean) => void;
  isFilterMinimized: boolean;
  setIsFilterMinimized: (b: boolean) => void;
  expandedRideMapId: string | null;
  setExpandedRideMapId: (id: string | null) => void;
  
  handleAddressChange: (val: string, field: string, setValState: (v: string) => void) => void;
  activeSuggestionField: string | null;
  setActiveSuggestionField: (field: string | null) => void;
  suggestions: any[];
  handleSelectSuggestion: (item: any, field: string) => void;
  handleAddressIconClick: (type: 'home' | 'work', field: string) => void;
  handleStartEditRide: (ride: any) => void;
  
  setErrorMessage: (msg: string) => void;
  setSuccessMessage: (msg: string) => void;
}

export const RidesTab: React.FC<RidesTabProps> = ({
  filterSourceAddr,
  setFilterSourceAddr,
  filterDestAddr,
  setFilterDestAddr,
  filterSourceCoords,
  setFilterSourceCoords,
  filterDestCoords,
  setFilterDestCoords,
  filterSourceRadius,
  setFilterSourceRadius,
  filterDestRadius,
  setFilterDestRadius,
  hasSearchedRides,
  setHasSearchedRides,
  isFilterMinimized,
  setIsFilterMinimized,
  expandedRideMapId,
  setExpandedRideMapId,
  handleAddressChange,
  activeSuggestionField,
  setActiveSuggestionField,
  suggestions,
  handleSelectSuggestion,
  handleAddressIconClick,
  handleStartEditRide,
  setErrorMessage,
  setSuccessMessage,
}) => {
  const { rides, bookSeat, deleteRide } = useApp();

  const handleGeocodeFilterSource = async () => {
    if (filterSourceAddr) {
      try {
        const coords = await geocodeAddress(filterSourceAddr);
        if (coords) setFilterSourceCoords(coords);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleGeocodeFilterDest = async () => {
    if (filterDestAddr) {
      try {
        const coords = await geocodeAddress(filterDestAddr);
        if (coords) setFilterDestCoords(coords);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleBookSeat = async (rideId: string) => {
    try {
      await bookSeat(rideId);
      setSuccessMessage('Successfully joined the ride!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to join ride.');
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    if (window.confirm('Are you sure you want to delete this ride offer?')) {
      try {
        await deleteRide(rideId);
        setSuccessMessage('Ride offer deleted!');
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to delete ride.');
      }
    }
  };

  const filteredRides = rides.filter((ride: any) => {
    if (!filterSourceCoords || !filterDestCoords) return false;
    if (!ride.pickupCoords || !ride.dropCoords) return false;
    
    const srcDist = getHaversineDistance(ride.pickupCoords, filterSourceCoords);
    if (srcDist > filterSourceRadius) return false;
    
    const destDist = getHaversineDistance(ride.dropCoords, filterDestCoords);
    if (destDist > filterDestRadius) return false;
    
    return true;
  });

  return (
    <div>
      {!isFilterMinimized && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem' }}>Daily Shared Commutes</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hop into local active carpools</p>
        </div>
      )}

      {/* Search & Filter Panel */}
      <RideFilter 
        filterSourceAddr={filterSourceAddr}
        setFilterSourceAddr={setFilterSourceAddr}
        filterDestAddr={filterDestAddr}
        setFilterDestAddr={setFilterDestAddr}
        filterSourceCoords={filterSourceCoords}
        filterDestCoords={filterDestCoords}
        filterSourceRadius={filterSourceRadius}
        setFilterSourceRadius={setFilterSourceRadius}
        filterDestRadius={filterDestRadius}
        setFilterDestRadius={setFilterDestRadius}
        isFilterMinimized={isFilterMinimized}
        setIsFilterMinimized={setIsFilterMinimized}
        handleAddressChange={handleAddressChange}
        handleGeocodeFilterSource={handleGeocodeFilterSource}
        handleGeocodeFilterDest={handleGeocodeFilterDest}
        activeSuggestionField={activeSuggestionField}
        setActiveSuggestionField={setActiveSuggestionField}
        suggestions={suggestions}
        handleSelectSuggestion={handleSelectSuggestion}
        handleAddressIconClick={handleAddressIconClick}
        setErrorMessage={setErrorMessage}
        setHasSearchedRides={setHasSearchedRides}
      />

      {/* List of Rides */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {!hasSearchedRides || !isFilterMinimized ? (
          <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
            <Map size={32} color="var(--accent-light)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>Find a Carpool</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Enter your pickup and destination locations above to search for available rides near your route.</p>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
            <Car size={32} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No active rides matching your route within selected radius limits.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setIsFilterMinimized(false)} 
                className="btn btn-primary" 
                style={{ fontSize: '0.85rem', padding: '10px 16px', gap: '6px' }}
              >
                ✏️ Change Filters
              </button>
            </div>
          </div>
        ) : (
          filteredRides.map((ride: any) => (
            <RideCard 
              key={ride._id}
              ride={ride}
              isMapExpanded={expandedRideMapId === ride._id}
              onToggleMap={() => setExpandedRideMapId(expandedRideMapId === ride._id ? null : ride._id)}
              onStartEdit={handleStartEditRide}
              onDelete={handleDeleteRide}
              onBook={handleBookSeat}
            />
          ))
        )}
      </div>
    </div>
  );
};
