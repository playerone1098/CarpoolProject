import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MapComponent } from '../MapComponent';
import { BookMarked } from 'lucide-react';
import { SuggestionsDropdown } from '../common/SuggestionsDropdown';
import { geocodeAddress, reverseGeocode } from '../../utils/distance';

interface SubpageProps {
  setSuccessMessage: (msg: string) => void;
  setErrorMessage: (msg: string) => void;
  setProfileSubpage: (page: 'menu' | 'details' | 'addresses' | 'bookmarks' | 'help' | 'car') => void;

  handleAddressChange: (val: string, field: string, setValState: (v: string) => void) => void;
  activeSuggestionField: string | null;
  setActiveSuggestionField: (field: string | null) => void;
  suggestions: any[];
  handleSelectSuggestion: (item: any, field: string) => void;
}

export const ProfileDetails: React.FC<Pick<SubpageProps, 'setSuccessMessage' | 'setErrorMessage' | 'setProfileSubpage'>> = ({
  setSuccessMessage,
  setErrorMessage,
  setProfileSubpage,
}) => {
  const { user, updateProfile } = useApp();
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone);
      setProfilePhoto(user.profilePhoto || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name: profileName,
        phone: profilePhone,
        profilePhoto: profilePhoto || undefined,
      });
      setSuccessMessage('Profile saved successfully!');
      setProfileSubpage('menu');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save profile.');
    }
  };

  return (
    <form onSubmit={handleSaveProfile} className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Personal Profile Settings</h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img src={profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profileName)}`} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
      </div>

      <div className="input-group">
        <label>Name</label>
        <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="input-field" required />
      </div>

      <div className="input-group">
        <label>Phone Contact</label>
        <input type="text" value={profilePhone} readOnly className="input-field" style={{ opacity: 0.6 }} />
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
        <button type="submit" className="btn btn-primary" style={{ width: 'max-content' }}>Save Profile Details</button>
      </div>
    </form>
  );
};

export const ProfileAddresses: React.FC<Omit<SubpageProps, 'suggestions' | 'handleSelectSuggestion' | 'handleAddressChange'> & {
  homeAddrInput: string;
  setHomeAddrInput: (v: string) => void;
  workAddrInput: string;
  setWorkAddrInput: (v: string) => void;
  homeCoords: { lat: number; lng: number } | null;
  setHomeCoords: (c: { lat: number; lng: number } | null) => void;
  workCoords: { lat: number; lng: number } | null;
  setWorkCoords: (c: { lat: number; lng: number } | null) => void;
  profileMapSel: 'home' | 'work' | null;
  setProfileMapSel: (v: 'home' | 'work' | null) => void;

  handleAddressChange: (val: string, field: string, setValState: (v: string) => void) => void;
  activeSuggestionField: string | null;
  setActiveSuggestionField: (field: string | null) => void;
  suggestions: any[];
  handleSelectSuggestion: (item: any, field: string) => void;
}> = ({
  setSuccessMessage,
  setErrorMessage,
  setProfileSubpage,
  homeAddrInput,
  setHomeAddrInput,
  workAddrInput,
  setWorkAddrInput,
  homeCoords,
  setHomeCoords,
  workCoords,
  setWorkCoords,
  profileMapSel,
  setProfileMapSel,
  handleAddressChange,
  activeSuggestionField,
  setActiveSuggestionField,
  suggestions,
  handleSelectSuggestion,
}) => {
    const { updateProfile } = useApp();

    const handleGeocodeHome = async () => {
      if (homeAddrInput) {
        const coords = await geocodeAddress(homeAddrInput);
        if (coords) setHomeCoords(coords);
      }
    };

    const handleGeocodeWork = async () => {
      if (workAddrInput) {
        const coords = await geocodeAddress(workAddrInput);
        if (coords) setWorkCoords(coords);
      }
    };

    const handleProfileCoordsSelect = async (type: 'pickup' | 'drop', coords: { lat: number; lng: number }) => {
      if (type === 'pickup') {
        setHomeCoords(coords);
        const addr = await reverseGeocode(coords.lat, coords.lng);
        if (addr) setHomeAddrInput(addr);
      } else if (type === 'drop') {
        setWorkCoords(coords);
        const addr = await reverseGeocode(coords.lat, coords.lng);
        if (addr) setWorkAddrInput(addr);
      }
    };

    const handleSaveAddresses = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await updateProfile({
          homeAddress: homeAddrInput ? {
            address: homeAddrInput,
            coords: homeCoords || { lat: 28.6139, lng: 77.2090 }
          } : undefined,
          workAddress: workAddrInput ? {
            address: workAddrInput,
            coords: workCoords || { lat: 28.6139, lng: 77.2090 }
          } : undefined,
        });
        setSuccessMessage('Addresses saved successfully!');
        setProfileMapSel(null);
        setProfileSubpage('menu');
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to save addresses.');
      }
    };

    return (
      <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Address Locations</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Verify or set coordinates on OpenStreetMap</p>

        <form onSubmit={handleSaveAddresses} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="address-container">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="input-group">
              <label>Home Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Enter home address"
                  value={homeAddrInput}
                  onChange={(e) => handleAddressChange(e.target.value, 'home', setHomeAddrInput)}
                  onFocus={() => setActiveSuggestionField('home')}
                  onBlur={() => setTimeout(handleGeocodeHome, 200)}
                  className="input-field"
                />
                <SuggestionsDropdown
                  field="home"
                  activeSuggestionField={activeSuggestionField}
                  suggestions={suggestions}
                  onSelectSuggestion={handleSelectSuggestion}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                <button type="button" onClick={() => { setProfileMapSel('home'); setHomeCoords(homeCoords || { lat: 28.6139, lng: 77.2090 }); }} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                  🗺️ Select Coords on Map
                </button>
                {homeCoords && <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Locked! ({homeCoords.lat.toFixed(3)}, {homeCoords.lng.toFixed(3)})</span>}
              </div>
            </div>

            <div className="input-group">
              <label>Work Address</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Enter work address"
                  value={workAddrInput}
                  onChange={(e) => handleAddressChange(e.target.value, 'work', setWorkAddrInput)}
                  onFocus={() => setActiveSuggestionField('work')}
                  onBlur={() => setTimeout(handleGeocodeWork, 200)}
                  className="input-field"
                />
                <SuggestionsDropdown
                  field="work"
                  activeSuggestionField={activeSuggestionField}
                  suggestions={suggestions}
                  onSelectSuggestion={handleSelectSuggestion}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                <button type="button" onClick={() => { setProfileMapSel('work'); setWorkCoords(workCoords || { lat: 28.6139, lng: 77.2090 }); }} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                  🗺️ Select Coords on Map
                </button>
                {workCoords && <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Locked! ({workCoords.lat.toFixed(3)}, {workCoords.lng.toFixed(3)})</span>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: 'max-content', marginTop: '12px' }}>Save Coordinates</button>
          </div>

          <div style={{ minHeight: '280px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {profileMapSel === 'home' && homeCoords && (
              <MapComponent
                pickupCoords={homeCoords}
                onSelectCoords={(_, coords) => handleProfileCoordsSelect('pickup', coords)}
                selectionMode="pickup"
              />
            )}
            {profileMapSel === 'work' && workCoords && (
              <MapComponent
                pickupCoords={workCoords}
                onSelectCoords={(_, coords) => handleProfileCoordsSelect('drop', coords)}
                selectionMode="pickup"
              />
            )}
            {(!profileMapSel || (!homeCoords && !workCoords)) && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🗺️</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click "Select Coords on Map" above to display the interactive selector map</p>
              </div>
            )}
          </div>

          <style>{`
          @media (min-width: 769px) {
            .address-container { grid-template-columns: 1fr 1fr !important; }
          }
        `}</style>
        </form>
      </div>
    );
  };

export const ProfileBookmarks: React.FC<SubpageProps & {
  bookmarkName: string;
  setBookmarkName: (v: string) => void;
  bookmarkAddr: string;
  setBookmarkAddr: (v: string) => void;
  bookmarkCoords: { lat: number; lng: number } | null;
  setBookmarkCoords: (c: { lat: number; lng: number } | null) => void;
  bookmarkMapSel: boolean;
  setBookmarkMapSel: (v: boolean) => void;
}> = ({
  setSuccessMessage,
  setErrorMessage,
  bookmarkName,
  setBookmarkName,
  bookmarkAddr,
  setBookmarkAddr,
  bookmarkCoords,
  setBookmarkCoords,
  bookmarkMapSel,
  setBookmarkMapSel,
  handleAddressChange,
  activeSuggestionField,
  setActiveSuggestionField,
  suggestions,
  handleSelectSuggestion,
}) => {
    const { user, addBookmark, removeBookmark } = useApp();

    const handleGeocodeBookmark = async () => {
      if (bookmarkAddr) {
        const coords = await geocodeAddress(bookmarkAddr);
        if (coords) {
          setBookmarkCoords(coords);
          setBookmarkMapSel(true);
        }
      }
    };

    const handleBookmarkCoordsSelect = async (coords: { lat: number; lng: number }) => {
      setBookmarkCoords(coords);
      const addr = await reverseGeocode(coords.lat, coords.lng);
      if (addr) setBookmarkAddr(addr);
    };

    const handleAddBookmarkSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!bookmarkName || !bookmarkAddr || !bookmarkCoords) {
        setErrorMessage('Complete name and coordinates on the map');
        return;
      }
      try {
        await addBookmark({
          name: bookmarkName,
          address: bookmarkAddr,
          coords: bookmarkCoords,
        });
        setSuccessMessage('Location Bookmarked!');
        setBookmarkName('');
        setBookmarkAddr('');
        setBookmarkCoords(null);
        setBookmarkMapSel(false);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to add bookmark.');
      }
    };

    const handleRemoveBookmark = async (id: string) => {
      try {
        await removeBookmark(id);
        setSuccessMessage('Bookmark removed.');
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to remove bookmark.');
      }
    };

    return (
      <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Bookmarked Locations</h3>

        {/* Existing Bookmarks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {(user?.bookmarks || []).length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>No saved places.</p>
          ) : (
            user?.bookmarks?.map((b: any) => (
              <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div>
                  <h5 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><BookMarked size={14} color="var(--accent-light)" /> {b.name}</h5>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.address}</p>
                </div>
                <button onClick={() => handleRemoveBookmark(b._id)} style={{ color: 'var(--error)', fontSize: '0.75rem', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
              </div>
            ))
          )}
        </div>

        {/* Add Bookmark form & Map */}
        <form onSubmit={handleAddBookmarkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '0.9rem' }}>Add New Saved Place</h4>
          <div className="input-group">
            <label>Label / Title</label>
            <input type="text" placeholder="Gym / Coffee Shop" value={bookmarkName} onChange={(e) => setBookmarkName(e.target.value)} className="input-field" required />
          </div>
          <div className="input-group">
            <label>Full Address</label>
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="123 High Street" value={bookmarkAddr} onChange={(e) => handleAddressChange(e.target.value, 'bookmark', setBookmarkAddr)} onFocus={() => setActiveSuggestionField('bookmark')} onBlur={() => setTimeout(handleGeocodeBookmark, 200)} className="input-field" required />
              <SuggestionsDropdown
                field="bookmark"
                activeSuggestionField={activeSuggestionField}
                suggestions={suggestions}
                onSelectSuggestion={handleSelectSuggestion}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={() => { setBookmarkMapSel(true); setBookmarkCoords(bookmarkCoords || { lat: 28.6139, lng: 77.2090 }); }} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '10px' }}>
              📍 Pick on Map
            </button>
            {bookmarkCoords && (
              <span style={{ fontSize: '0.8rem', alignSelf: 'center', color: 'var(--success)' }}>
                Coords Locked! ({bookmarkCoords.lat.toFixed(4)}, {bookmarkCoords.lng.toFixed(4)})
              </span>
            )}
          </div>

          {bookmarkMapSel && bookmarkCoords && (
            <div style={{ height: '200px', marginTop: '8px' }}>
              <MapComponent
                pickupCoords={bookmarkCoords}
                onSelectCoords={(_, coords) => handleBookmarkCoordsSelect(coords)}
                selectionMode="pickup"
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: 'max-content', marginTop: '8px' }}>Add Bookmark</button>
        </form>
      </div>
    );
  };

export const ProfileHelp: React.FC = () => {
  return (
    <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>Help & Support</h3>

      {/* FAQs Container */}
      <div>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', fontWeight: 700, color: 'var(--accent-light)' }}>Frequently Asked Questions</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="glass" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>How do I book a shared ride?</h5>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Go to the Home (Commutes) page, enter your source and destination addresses, and click "Find Commuter Rides". From the list of matching commutes, choose your preferred driver and click "Book Seat".
            </p>
          </div>

          <div className="glass" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>How do I offer a shared ride?</h5>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              You can offer a commute by listing your route, available seats, timing, and vehicle details. Once published, co-commuters heading your way can discover and request seats.
            </p>
          </div>

          <div className="glass" style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
            <h5 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Are there any charges or fees?</h5>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              RideShare is entirely free to download and use. Any cost-sharing details for fuel are voluntarily split between drivers and riders directly.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Card */}
      <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', background: 'var(--accent-glow)' }}>
        <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', fontWeight: 700 }}>Need more assistance?</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Our dedicated help desk is available to resolve issues or field feature recommendations.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
          <div>✉️ <strong>Email support:</strong> <a href="mailto:support@example.com" style={{ color: 'var(--accent-light)', textDecoration: 'underline' }}>support@example.com</a></div>
          <div>📞 <strong>Phone assistance:</strong> <a href="tel:+18005550199" style={{ color: 'var(--accent-light)', textDecoration: 'underline' }}>+1 (800) 555-0199</a></div>
        </div>
      </div>
    </div>
  );
};

export const ProfileCar: React.FC<Pick<SubpageProps, 'setSuccessMessage' | 'setErrorMessage' | 'setProfileSubpage'>> = ({
  setSuccessMessage,
  setErrorMessage,
  setProfileSubpage,
}) => {
  const { user, updateProfile } = useApp();
  const [profileCarModel, setProfileCarModel] = useState('');
  const [profileCarColor, setProfileCarColor] = useState('');
  const [profileCarPlate, setProfileCarPlate] = useState('');

  useEffect(() => {
    if (user?.carInfo) {
      setProfileCarModel(user.carInfo.model || '');
      setProfileCarColor(user.carInfo.color || '');
      setProfileCarPlate(user.carInfo.plateNumber || '');
    }
  }, [user]);

  const handleSaveCarInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        carInfo: {
          model: profileCarModel,
          color: profileCarColor,
          plateNumber: profileCarPlate,
        }
      });
      setSuccessMessage('Car information saved successfully!');
      setProfileSubpage('menu');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save car info.');
    }
  };

  return (
    <form onSubmit={handleSaveCarInfo} className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '8px' }}>🚗 Car Information</h3>

      <div className="input-group">
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>Car Model</label>
        <input
          type="text"
          placeholder="Toyota Camry"
          value={profileCarModel}
          onChange={(e) => setProfileCarModel(e.target.value)}
          className="input-field"
          required
        />
      </div>

      <div className="input-group">
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>Color</label>
        <input
          type="text"
          placeholder="Black"
          value={profileCarColor}
          onChange={(e) => setProfileCarColor(e.target.value)}
          className="input-field"
          required
        />
      </div>

      <div className="input-group">
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px', display: 'block' }}>Plate Number / Vehicle Registration</label>
        <input
          type="text"
          placeholder="DL 3C AY 1234"
          value={profileCarPlate}
          onChange={(e) => setProfileCarPlate(e.target.value)}
          className="input-field"
        />
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: 'max-content', marginTop: '8px' }}>Save Car Info</button>
    </form>
  );
};
