import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SuggestionsDropdown } from '../common/SuggestionsDropdown';
import { Loader2 } from 'lucide-react';

interface RideFilterProps {
  filterSourceAddr: string;
  setFilterSourceAddr: (v: string) => void;
  filterDestAddr: string;
  setFilterDestAddr: (v: string) => void;
  filterSourceCoords: { lat: number; lng: number } | null;
  filterDestCoords: { lat: number; lng: number } | null;
  filterSourceRadius: number;
  setFilterSourceRadius: (r: number) => void;
  filterDestRadius: number;
  setFilterDestRadius: (r: number) => void;
  isFilterMinimized: boolean;
  setIsFilterMinimized: (b: boolean) => void;
  handleAddressChange: (val: string, field: string, setValState: (v: string) => void) => void;
  handleGeocodeFilterSource: () => void;
  handleGeocodeFilterDest: () => void;
  activeSuggestionField: string | null;
  setActiveSuggestionField: (field: string | null) => void;
  suggestions: any[];
  handleSelectSuggestion: (item: any, field: string) => void;
  handleAddressIconClick: (type: 'home' | 'work', field: string) => void;
  setErrorMessage: (msg: string) => void;
  setHasSearchedRides: (b: boolean) => void;
}

export const RideFilter: React.FC<RideFilterProps> = ({
  filterSourceAddr,
  setFilterSourceAddr,
  filterDestAddr,
  setFilterDestAddr,
  filterSourceCoords,
  filterDestCoords,
  filterSourceRadius,
  setFilterSourceRadius,
  filterDestRadius,
  setFilterDestRadius,
  isFilterMinimized,
  setIsFilterMinimized,
  handleAddressChange,
  handleGeocodeFilterSource,
  handleGeocodeFilterDest,
  activeSuggestionField,
  setActiveSuggestionField,
  suggestions,
  handleSelectSuggestion,
  handleAddressIconClick,
  setErrorMessage,
  setHasSearchedRides,
}) => {
  const { user, refreshRides } = useApp();
  const [isSearching, setIsSearching] = useState(false);

  const isSourceHomeActive = !!(filterSourceCoords && user?.homeAddress?.coords && filterSourceCoords.lat === user.homeAddress.coords.lat && filterSourceCoords.lng === user.homeAddress.coords.lng);
  const isSourceWorkActive = !!(filterSourceCoords && user?.workAddress?.coords && filterSourceCoords.lat === user.workAddress.coords.lat && filterSourceCoords.lng === user.workAddress.coords.lng);
  const isDestHomeActive = !!(filterDestCoords && user?.homeAddress?.coords && filterDestCoords.lat === user.homeAddress.coords.lat && filterDestCoords.lng === user.homeAddress.coords.lng);
  const isDestWorkActive = !!(filterDestCoords && user?.workAddress?.coords && filterDestCoords.lat === user.workAddress.coords.lat && filterDestCoords.lng === user.workAddress.coords.lng);

  if (isFilterMinimized) {
    return (
      <div 
        className="glass-interactive" 
        onClick={() => setIsFilterMinimized(false)}
        style={{ 
          padding: '12px 16px', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px', 
          cursor: 'pointer',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)'
        }}
        title="Click to edit locations"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-light)' }}>🔍 Search Route</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Tap to edit</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--success)' }}>🟢</span>
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
              {filterSourceAddr || 'Not selected'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--error)' }}>🔴</span>
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
              {filterDestAddr || 'Not selected'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          🔍 Search Rides by Route
        </h4>
        <button 
          onClick={() => setIsFilterMinimized(true)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Minimize Panel
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }} className="filter-inputs-grid">
          <div className="input-group">
            <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Where from? (Source)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  value={filterSourceAddr} 
                  onChange={(e) => handleAddressChange(e.target.value, 'filterSource', setFilterSourceAddr)} 
                  onFocus={() => setActiveSuggestionField('filterSource')}
                  onBlur={() => setTimeout(handleGeocodeFilterSource, 200)}
                  placeholder="Enter pickup address"
                  className="input-field" 
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                />
                <SuggestionsDropdown 
                  field="filterSource"
                  activeSuggestionField={activeSuggestionField}
                  suggestions={suggestions}
                  onSelectSuggestion={handleSelectSuggestion}
                />
              </div>
              <button 
                type="button" 
                onClick={() => handleAddressIconClick('home', 'filterSource')}
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
                  background: isSourceHomeActive ? 'var(--accent-glow)' : 'var(--bg-card)',
                  borderColor: isSourceHomeActive ? 'var(--accent)' : 'var(--border-color)',
                  boxShadow: isSourceHomeActive ? 'var(--shadow-glow)' : 'none'
                }}
                title={user?.homeAddress?.coords ? "Use Home Location" : "Set Home Location"}
              >
                🏠
              </button>
              <button 
                type="button" 
                onClick={() => handleAddressIconClick('work', 'filterSource')}
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
                  background: isSourceWorkActive ? 'var(--accent-glow)' : 'var(--bg-card)',
                  borderColor: isSourceWorkActive ? 'var(--accent)' : 'var(--border-color)',
                  boxShadow: isSourceWorkActive ? 'var(--shadow-glow)' : 'none'
                }}
                title={user?.workAddress?.coords ? "Use Work Location" : "Set Work Location"}
              >
                💼
              </button>
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>Where to? (Destination)</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  value={filterDestAddr} 
                  onChange={(e) => handleAddressChange(e.target.value, 'filterDest', setFilterDestAddr)} 
                  onFocus={() => setActiveSuggestionField('filterDest')}
                  onBlur={() => setTimeout(handleGeocodeFilterDest, 200)}
                  placeholder="Enter destination address"
                  className="input-field" 
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                />
                <SuggestionsDropdown 
                  field="filterDest"
                  activeSuggestionField={activeSuggestionField}
                  suggestions={suggestions}
                  onSelectSuggestion={handleSelectSuggestion}
                />
              </div>
              <button 
                type="button" 
                onClick={() => handleAddressIconClick('home', 'filterDest')}
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
                  background: isDestHomeActive ? 'var(--accent-glow)' : 'var(--bg-card)',
                  borderColor: isDestHomeActive ? 'var(--accent)' : 'var(--border-color)',
                  boxShadow: isDestHomeActive ? 'var(--shadow-glow)' : 'none'
                }}
                title={user?.homeAddress?.coords ? "Use Home Location" : "Set Home Location"}
              >
                🏠
              </button>
              <button 
                type="button" 
                onClick={() => handleAddressIconClick('work', 'filterDest')}
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
                  background: isDestWorkActive ? 'var(--accent-glow)' : 'var(--bg-card)',
                  borderColor: isDestWorkActive ? 'var(--accent)' : 'var(--border-color)',
                  boxShadow: isDestWorkActive ? 'var(--shadow-glow)' : 'none'
                }}
                title={user?.workAddress?.coords ? "Use Work Location" : "Set Work Location"}
              >
                💼
              </button>
            </div>
          </div>
        </div>

        {/* Radius selection dropdowns */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Pickup radius limit</label>
            <select 
              value={filterSourceRadius} 
              onChange={(e) => setFilterSourceRadius(Number(e.target.value))} 
              className="input-field"
              style={{ padding: '8px 12px', fontSize: '0.8rem', background: '#121214' }}
            >
              <option value={1}>Within 1 km</option>
              <option value={2}>Within 2 km</option>
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={20}>Within 20 km</option>
            </select>
          </div>

          <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Destination radius limit</label>
            <select 
              value={filterDestRadius} 
              onChange={(e) => setFilterDestRadius(Number(e.target.value))} 
              className="input-field"
              style={{ padding: '8px 12px', fontSize: '0.8rem', background: '#121214' }}
            >
              <option value={1}>Within 1 km</option>
              <option value={2}>Within 2 km</option>
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={20}>Within 20 km</option>
            </select>
          </div>
        </div>

        {/* Find Rides Button */}
        <button
          type="button"
          onClick={async () => {
            if (!filterSourceAddr || !filterDestAddr) {
              setErrorMessage('Please enter both source and destination addresses.');
              return;
            }
            setIsSearching(true);
            try {
              await refreshRides();
              setHasSearchedRides(true);
              setIsFilterMinimized(true);
            } catch (err: any) {
              setErrorMessage(err.message || 'Failed to refresh rides.');
            } finally {
              setIsSearching(false);
            }
          }}
          disabled={isSearching}
          className="btn btn-primary"
          style={{ marginTop: '4px', width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '8px', opacity: isSearching ? 0.7 : 1 }}
        >
          {isSearching ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Searching Rides...
            </>
          ) : (
            <>🔍 Find Commuter Rides</>
          )}
        </button>
      </div>
    </div>
  );
};
