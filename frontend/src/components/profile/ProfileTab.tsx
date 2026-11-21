import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LogOut } from 'lucide-react';
import {
  ProfileDetails,
  ProfileAddresses,
  ProfileBookmarks,
  ProfileCar,
  ProfileHelp
} from './ProfileSubpages';

interface ProfileTabProps {
  profileSubpage: 'menu' | 'details' | 'addresses' | 'bookmarks' | 'help' | 'car';
  setProfileSubpage: (page: 'menu' | 'details' | 'addresses' | 'bookmarks' | 'help' | 'car') => void;
  setShowLogoutConfirm: (val: boolean) => void;

  setSuccessMessage: (msg: string) => void;
  setErrorMessage: (msg: string) => void;

  handleAddressChange: (val: string, field: string, setValState: (v: string) => void) => void;
  activeSuggestionField: string | null;
  setActiveSuggestionField: (field: string | null) => void;
  suggestions: any[];
  handleSelectSuggestion: (item: any, field: string) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profileSubpage,
  setProfileSubpage,
  setShowLogoutConfirm,
  setSuccessMessage,
  setErrorMessage,
  handleAddressChange,
  activeSuggestionField,
  setActiveSuggestionField,
  suggestions,
  handleSelectSuggestion,
}) => {
  const { user } = useApp();

  // States for Address fields
  const [homeAddrInput, setHomeAddrInput] = useState('');
  const [workAddrInput, setWorkAddrInput] = useState('');
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [workCoords, setWorkCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [profileMapSel, setProfileMapSel] = useState<'home' | 'work' | null>(null);

  // States for Bookmark fields
  const [bookmarkName, setBookmarkName] = useState('');
  const [bookmarkAddr, setBookmarkAddr] = useState('');
  const [bookmarkCoords, setBookmarkCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [bookmarkMapSel, setBookmarkMapSel] = useState<boolean>(false);

  // Sync inputs with user data
  useEffect(() => {
    if (user) {
      setHomeAddrInput(user.homeAddress?.address || '');
      setWorkAddrInput(user.workAddress?.address || '');
      setHomeCoords(user.homeAddress?.coords || null);
      setWorkCoords(user.workAddress?.coords || null);
    }
  }, [user]);

  const localHandleSelectSuggestion = (item: any, field: string) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const coords = { lat, lng };
    const address = item.display_name;

    if (field === 'home') {
      setHomeAddrInput(address);
      setHomeCoords(coords);
    } else if (field === 'work') {
      setWorkAddrInput(address);
      setWorkCoords(coords);
    } else if (field === 'bookmark') {
      setBookmarkAddr(address);
      setBookmarkCoords(coords);
    }

    handleSelectSuggestion(item, field);
  };

  const profilePhoto = user?.profilePhoto || '';
  const profileName = user?.name || '';
  const profilePhone = user?.phone || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {profileSubpage !== 'menu' && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setProfileSubpage('menu')}
            className="glass-interactive"
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              gap: '6px',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              background: 'transparent'
            }}
          >
            ← Back to Settings Menu
          </button>
        </div>
      )}

      {/* L2 SUBPAGE 0: MAIN SETTINGS MENU */}
      {profileSubpage === 'menu' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* User Summary Card */}
          <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src={profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profileName)}`} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{profileName}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>📞 {profilePhone}</p>
            </div>
          </div>

          {/* Settings Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              onClick={() => setProfileSubpage('details')}
              className="glass-interactive"
              style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>👤 Personal Details</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Update your name and profile avatar</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>&rarr;</span>
            </div>

            <div
              onClick={() => setProfileSubpage('addresses')}
              className="glass-interactive"
              style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>🏠 Commute Addresses</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Configure home and work destination coordinates</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>&rarr;</span>
            </div>

            <div
              onClick={() => setProfileSubpage('bookmarks')}
              className="glass-interactive"
              style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>🔖 Saved Bookmarks</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage frequently visited stop coordinates</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>&rarr;</span>
            </div>

            <div
              onClick={() => setProfileSubpage('car')}
              className="glass-interactive"
              style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>🚗 Car Information</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Manage vehicle details for shared rides</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>&rarr;</span>
            </div>

            <div
              onClick={() => setProfileSubpage('help')}
              className="glass-interactive"
              style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>❓ Help & Support</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Frequently Asked Questions, guidelines, and contact support</p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>&rarr;</span>
            </div>
          </div>

          {/* Centered Sign Out Action */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="glass-interactive"
              style={{
                width: '100%',
                maxWidth: '280px',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--error)',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                background: 'rgba(239, 68, 68, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {profileSubpage === 'details' && (
        <ProfileDetails
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
          setProfileSubpage={setProfileSubpage}
        />
      )}

      {profileSubpage === 'addresses' && (
        <ProfileAddresses
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
          setProfileSubpage={setProfileSubpage}
          homeAddrInput={homeAddrInput}
          setHomeAddrInput={setHomeAddrInput}
          workAddrInput={workAddrInput}
          setWorkAddrInput={setWorkAddrInput}
          homeCoords={homeCoords}
          setHomeCoords={setHomeCoords}
          workCoords={workCoords}
          setWorkCoords={setWorkCoords}
          profileMapSel={profileMapSel}
          setProfileMapSel={setProfileMapSel}
          handleAddressChange={handleAddressChange}
          activeSuggestionField={activeSuggestionField}
          setActiveSuggestionField={setActiveSuggestionField}
          suggestions={suggestions}
          handleSelectSuggestion={localHandleSelectSuggestion}
        />
      )}

      {profileSubpage === 'bookmarks' && (
        <ProfileBookmarks
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
          setProfileSubpage={setProfileSubpage}
          bookmarkName={bookmarkName}
          setBookmarkName={setBookmarkName}
          bookmarkAddr={bookmarkAddr}
          setBookmarkAddr={setBookmarkAddr}
          bookmarkCoords={bookmarkCoords}
          setBookmarkCoords={setBookmarkCoords}
          bookmarkMapSel={bookmarkMapSel}
          setBookmarkMapSel={setBookmarkMapSel}
          handleAddressChange={handleAddressChange}
          activeSuggestionField={activeSuggestionField}
          setActiveSuggestionField={setActiveSuggestionField}
          suggestions={suggestions}
          handleSelectSuggestion={localHandleSelectSuggestion}
        />
      )}

      {profileSubpage === 'car' && (
        <ProfileCar
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
          setProfileSubpage={setProfileSubpage}
        />
      )}

      {profileSubpage === 'help' && <ProfileHelp />}

    </div>
  );
};
