import React, { useState, useEffect, useRef } from 'react';
import { useApp } from './context/AppContext';
import {
  LogOut,
  X
} from 'lucide-react';
import { LoadingScreen } from './components/common/LoadingScreen';
import { ServerErrorScreen } from './components/common/ServerErrorScreen';
import { AuthScreen } from './components/auth/AuthScreen';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { RidesTab } from './components/rides/RidesTab';
import { OfferRideTab } from './components/rides/OfferRideTab';
import { HistoryTab } from './components/rides/HistoryTab';
import { ProfileTab } from './components/profile/ProfileTab';
import { AddressModal } from './components/common/AddressModal';
import { NotificationToast } from './components/common/NotificationToast';
import { geocodeAddress } from './utils/distance';

const App: React.FC = () => {
  const {
    user,
    isAuthenticated,
    loading,
    logout,
    updateProfile,
    createRide,
    updateRide,
    serverError,
    retryConnection,
    toasts,
    dismissToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rides' | 'offer' | 'history' | 'profile'>('rides');
  const [showNotifications, setShowNotifications] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // --- Form Popup Modals ---
  const [showCreateRide, setShowCreateRide] = useState(false);

  // --- Create Ride Fields ---
  const [rideCarModel, setRideCarModel] = useState('');
  const [rideSeats, setRideSeats] = useState(3);
  const [ridePrice, setRidePrice] = useState('');
  const [ridePickup, setRidePickup] = useState('');
  const [rideDrop, setRideDrop] = useState('');
  const [rideTime, setRideTime] = useState('');
  const [ridePickupCoords, setRidePickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [rideDropCoords, setRideDropCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapSelectionMode, setMapSelectionMode] = useState<'pickup' | 'drop' | null>(null);

  // --- Profile Settings ---
  const [profileSubpage, setProfileSubpage] = useState<'menu' | 'details' | 'addresses' | 'bookmarks' | 'help' | 'car'>('menu');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // --- Edit Mode States ---
  const [editingRideId, setEditingRideId] = useState<string | null>(null);

  // --- Autocomplete Suggestions States ---
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);
  const [currentGeoCoords, setCurrentGeoCoords] = useState<{ lat: number; lng: number } | null>(null);

  // --- Distance Filtering States ---
  const [filterSourceAddr, setFilterSourceAddr] = useState('');
  const [filterDestAddr, setFilterDestAddr] = useState('');
  const [filterSourceCoords, setFilterSourceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filterDestCoords, setFilterDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filterSourceRadius, setFilterSourceRadius] = useState<number>(5);
  const [filterDestRadius, setFilterDestRadius] = useState<number>(5);

  const [hasSearchedRides, setHasSearchedRides] = useState(false);
  const [isFilterMinimized, setIsFilterMinimized] = useState(false);

  // --- Save Address Modal States ---
  const [showSaveAddressModal, setShowSaveAddressModal] = useState<{ type: 'home' | 'work'; field: string } | null>(null);
  const [modalAddressInput, setModalAddressInput] = useState('');
  const [modalAddressCoords, setModalAddressCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Expandable Map on Ride Card
  const [expandedRideMapId, setExpandedRideMapId] = useState<string | null>(null);

  const prevUserRef = useRef<any>(null);

  useEffect(() => {
    if (user && !prevUserRef.current) {
      // Reset navigation and L2 settings page states on login
      setActiveTab('rides');
      setProfileSubpage('menu');
    }
    prevUserRef.current = user;
  }, [user]);

  // Reset profile subpage when navigating tabs
  useEffect(() => {
    setProfileSubpage('menu');
  }, [activeTab]);

  // Alert Timers
  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(''), 4000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (activeTab === 'offer' && user?.carInfo?.model) {
      const carText = `${user.carInfo.model}${user.carInfo.color ? ' ' + user.carInfo.color : ''}`;
      if (!rideCarModel) {
        setRideCarModel(carText);
      }
    }
  }, [activeTab, user, rideCarModel]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentGeoCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation not allowed/available:', error.message);
        }
      );
    }
  }, []);

  const fetchSuggestions = async (query: string, field: string) => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setActiveSuggestionField(null);
      return;
    }
    try {
      let biasLat: number | null = null;
      let biasLng: number | null = null;

      if (currentGeoCoords) {
        biasLat = currentGeoCoords.lat;
        biasLng = currentGeoCoords.lng;
      } else if (user?.homeAddress?.coords) {
        biasLat = user.homeAddress.coords.lat;
        biasLng = user.homeAddress.coords.lng;
      }

      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
      if (biasLat !== null && biasLng !== null) {
        url += `&lat=${biasLat}&lon=${biasLng}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setActiveSuggestionField(field);
      }
    } catch (e) {
      console.error('Error fetching suggestions:', e);
    }
  };

  const handleAddressChange = (val: string, field: string, setValState: (v: string) => void) => {
    setValState(val);
    if ((window as any).geocodeTimeout) {
      clearTimeout((window as any).geocodeTimeout);
    }
    if (val.trim().length >= 3) {
      (window as any).geocodeTimeout = setTimeout(() => {
        fetchSuggestions(val, field);
      }, 400);
    } else {
      setSuggestions([]);
      setActiveSuggestionField(null);
    }
  };

  const handleSelectSuggestion = (item: any, field: string) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const coords = { lat, lng };
    const address = item.display_name;

    if (field === 'home') {
      // Handled inside ProfileTab locally or via props if passed
    } else if (field === 'work') {
      // Handled inside ProfileTab locally or via props if passed
    } else if (field === 'bookmark') {
      // Handled inside ProfileTab locally or via props if passed
    } else if (field === 'ridePickup') {
      setRidePickup(address);
      setRidePickupCoords(coords);
    } else if (field === 'rideDrop') {
      setRideDrop(address);
      setRideDropCoords(coords);
    } else if (field === 'filterSource') {
      setFilterSourceAddr(address);
      setFilterSourceCoords(coords);
    } else if (field === 'filterDest') {
      setFilterDestAddr(address);
      setFilterDestCoords(coords);
    } else if (field === 'modalAddress') {
      setModalAddressInput(address);
      setModalAddressCoords(coords);
    }

    setSuggestions([]);
    setActiveSuggestionField(null);
  };

  const handleSaveAndSelectAddress = async (type: 'home' | 'work', currentText: string, field: string) => {
    if (!currentText) {
      setErrorMessage(`Please type an address first to save as your ${type} location.`);
      return;
    }
    try {
      let coords = modalAddressCoords;
      if (!coords) {
        coords = await geocodeAddress(currentText);
      }
      if (!coords) {
        setErrorMessage(`Could not find coordinates for "${currentText}". Please enter a valid address.`);
        return;
      }

      if (type === 'home') {
        await updateProfile({
          homeAddress: { address: currentText, coords }
        });
        setSuccessMessage('Home address saved to profile!');

        if (field === 'filterSource') {
          setFilterSourceAddr(currentText);
          setFilterSourceCoords(coords);
        } else if (field === 'filterDest') {
          setFilterDestAddr(currentText);
          setFilterDestCoords(coords);
        }
      } else {
        await updateProfile({
          workAddress: { address: currentText, coords }
        });
        setSuccessMessage('Work address saved to profile!');

        if (field === 'filterSource') {
          setFilterSourceAddr(currentText);
          setFilterSourceCoords(coords);
        } else if (field === 'filterDest') {
          setFilterDestAddr(currentText);
          setFilterDestCoords(coords);
        }
      }

      setShowSaveAddressModal(null);
      setSuggestions([]);
      setActiveSuggestionField(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save address.');
    }
  };

  const handleGeocodeModalAddress = async () => {
    if (modalAddressInput) {
      const coords = await geocodeAddress(modalAddressInput);
      if (coords) setModalAddressCoords(coords);
    }
  };

  const handleAddressIconClick = (type: 'home' | 'work', field: string) => {
    const addressData = type === 'home' ? user?.homeAddress : user?.workAddress;
    if (addressData?.coords) {
      if (field === 'filterSource') {
        setFilterSourceAddr(addressData.address);
        setFilterSourceCoords(addressData.coords);
      } else if (field === 'filterDest') {
        setFilterDestAddr(addressData.address);
        setFilterDestCoords(addressData.coords);
      } else if (field === 'ridePickup') {
        setRidePickup(addressData.address);
        setRidePickupCoords(addressData.coords);
      } else if (field === 'rideDrop') {
        setRideDrop(addressData.address);
        setRideDropCoords(addressData.coords);
      }
      setSuccessMessage(`Loaded ${type} location!`);
    } else {
      setModalAddressInput('');
      setModalAddressCoords(null);
      setShowSaveAddressModal({ type, field });
    }
  };

  const handleCreateRideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rideCarModel || !ridePickup || !rideDrop || !rideTime) {
      setErrorMessage('Please fill out all fields');
      return;
    }
    if (new Date(rideTime) < new Date()) {
      setErrorMessage('Cannot create a ride in the past');
      return;
    }
    try {
      const payload = {
        carModel: rideCarModel,
        seatsAvailable: rideSeats,
        pickupLocation: ridePickup,
        dropLocation: rideDrop,
        rideTime: new Date(rideTime).toISOString(),
        pickupCoords: ridePickupCoords || undefined,
        dropCoords: rideDropCoords || undefined,
        price: ridePrice === '' ? 0 : Number(ridePrice),
      };

      if (editingRideId) {
        await updateRide(editingRideId, payload);
        setSuccessMessage('Ride updated successfully!');
      } else {
        await createRide(payload);
        setSuccessMessage('Ride offered successfully!');
      }

      setShowCreateRide(false);
      // Reset
      setRideCarModel('');
      setRidePickup('');
      setRideDrop('');
      setRideTime('');
      setRidePickupCoords(null);
      setRideDropCoords(null);
      setRidePrice('');
      setEditingRideId(null);
      setActiveTab('rides');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to post ride.');
    }
  };

  const handleStartEditRide = (ride: any) => {
    setEditingRideId(ride._id);
    setRideCarModel(ride.carModel);
    setRideSeats(ride.seatsAvailable);
    setRidePickup(ride.pickupLocation);
    setRideDrop(ride.dropLocation);
    setRideTime(new Date(ride.rideTime).toISOString().slice(0, 16));
    setRidePickupCoords(ride.pickupCoords || null);
    setRideDropCoords(ride.dropCoords || null);
    setRidePrice(ride.price ? String(ride.price) : '');
    setShowCreateRide(true);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (serverError) {
    return <ServerErrorScreen retryConnection={retryConnection} />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="app-container">

      {/* Real-time Push Notification Toasts */}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />

      {/* Global Banner Messages */}
      {successMessage && (
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 3000, background: 'var(--success-glow)', border: '1px solid var(--success)', color: '#ffffff', padding: '12px 20px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', backdropFilter: 'blur(8px)' }}>
          ✓ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 3000, background: 'rgba(239,68,68,0.15)', border: '1px solid var(--error)', color: '#ffffff', padding: '12px 20px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', backdropFilter: 'blur(8px)' }}>
          ⚠ {errorMessage}
        </div>
      )}

      {/* Mobile/Desktop Glass Navigation Bar */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="main-content">

        {/* HEADER BAR */}
        <Header
          activeTab={activeTab}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
        />

        {/* TAB VIEWS */}
        {activeTab === 'rides' && (
          <RidesTab
            filterSourceAddr={filterSourceAddr}
            setFilterSourceAddr={setFilterSourceAddr}
            filterDestAddr={filterDestAddr}
            setFilterDestAddr={setFilterDestAddr}
            filterSourceCoords={filterSourceCoords}
            setFilterSourceCoords={setFilterSourceCoords}
            filterDestCoords={filterDestCoords}
            setFilterDestCoords={setFilterDestCoords}
            filterSourceRadius={filterSourceRadius}
            setFilterSourceRadius={setFilterSourceRadius}
            filterDestRadius={filterDestRadius}
            setFilterDestRadius={setFilterDestRadius}
            hasSearchedRides={hasSearchedRides}
            setHasSearchedRides={setHasSearchedRides}
            isFilterMinimized={isFilterMinimized}
            setIsFilterMinimized={setIsFilterMinimized}
            expandedRideMapId={expandedRideMapId}
            setExpandedRideMapId={setExpandedRideMapId}
            handleAddressChange={handleAddressChange}
            activeSuggestionField={activeSuggestionField}
            setActiveSuggestionField={setActiveSuggestionField}
            suggestions={suggestions}
            handleSelectSuggestion={handleSelectSuggestion}
            handleAddressIconClick={handleAddressIconClick}
            handleStartEditRide={handleStartEditRide}
            setErrorMessage={setErrorMessage}
            setSuccessMessage={setSuccessMessage}
          />
        )}

        {activeTab === 'offer' && (
          <OfferRideTab
            rideCarModel={rideCarModel}
            setRideCarModel={setRideCarModel}
            rideSeats={rideSeats}
            setRideSeats={setRideSeats}
            ridePrice={ridePrice}
            setRidePrice={setRidePrice}
            ridePickup={ridePickup}
            setRidePickup={setRidePickup}
            rideDrop={rideDrop}
            setRideDrop={setRideDrop}
            rideTime={rideTime}
            setRideTime={setRideTime}
            ridePickupCoords={ridePickupCoords}
            setRidePickupCoords={setRidePickupCoords}
            rideDropCoords={rideDropCoords}
            setRideDropCoords={setRideDropCoords}
            mapSelectionMode={mapSelectionMode}
            setMapSelectionMode={setMapSelectionMode}
            editingRideId={editingRideId}
            handleAddressChange={handleAddressChange}
            activeSuggestionField={activeSuggestionField}
            setActiveSuggestionField={setActiveSuggestionField}
            suggestions={suggestions}
            handleSelectSuggestion={handleSelectSuggestion}
            handleAddressIconClick={handleAddressIconClick}
            handleCreateRideSubmit={handleCreateRideSubmit}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            expandedRideMapId={expandedRideMapId}
            setExpandedRideMapId={setExpandedRideMapId}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            profileSubpage={profileSubpage}
            setProfileSubpage={setProfileSubpage}
            setShowLogoutConfirm={setShowLogoutConfirm}
            setSuccessMessage={setSuccessMessage}
            setErrorMessage={setErrorMessage}
            handleAddressChange={handleAddressChange}
            activeSuggestionField={activeSuggestionField}
            setActiveSuggestionField={setActiveSuggestionField}
            suggestions={suggestions}
            handleSelectSuggestion={handleSelectSuggestion}
          />
        )}

      </main>

      {/* POPUP MODALS */}

      {/* 1. Create/Edit Ride Modal (used when editing a ride) */}
      {showCreateRide && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2500, padding: '16px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-lg)', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{editingRideId ? 'Edit Shared Ride Offer' : 'Offer a Shared Ride'}</h3>
              <button
                onClick={() => {
                  setShowCreateRide(false);
                  setMapSelectionMode(null);
                  setEditingRideId(null);
                  setRideCarModel('');
                  setRidePickup('');
                  setRideDrop('');
                  setRideTime('');
                  setRidePickupCoords(null);
                  setRideDropCoords(null);
                }}
                style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <OfferRideTab
              rideCarModel={rideCarModel}
              setRideCarModel={setRideCarModel}
              rideSeats={rideSeats}
              setRideSeats={setRideSeats}
              ridePrice={ridePrice}
              setRidePrice={setRidePrice}
              ridePickup={ridePickup}
              setRidePickup={setRidePickup}
              rideDrop={rideDrop}
              setRideDrop={setRideDrop}
              rideTime={rideTime}
              setRideTime={setRideTime}
              ridePickupCoords={ridePickupCoords}
              setRidePickupCoords={setRidePickupCoords}
              rideDropCoords={rideDropCoords}
              setRideDropCoords={setRideDropCoords}
              mapSelectionMode={mapSelectionMode}
              setMapSelectionMode={setMapSelectionMode}
              editingRideId={editingRideId}
              handleAddressChange={handleAddressChange}
              activeSuggestionField={activeSuggestionField}
              setActiveSuggestionField={setActiveSuggestionField}
              suggestions={suggestions}
              handleSelectSuggestion={handleSelectSuggestion}
              handleAddressIconClick={handleAddressIconClick}
              handleCreateRideSubmit={handleCreateRideSubmit}
            />
          </div>
        </div>
      )}

      {/* 2. Save Address Modal */}
      <AddressModal
        showSaveAddressModal={showSaveAddressModal}
        modalAddressInput={modalAddressInput}
        setModalAddressInput={setModalAddressInput}
        handleAddressChange={handleAddressChange}
        handleGeocodeModalAddress={handleGeocodeModalAddress}
        activeSuggestionField={activeSuggestionField}
        setActiveSuggestionField={setActiveSuggestionField}
        suggestions={suggestions}
        handleSelectSuggestion={handleSelectSuggestion}
        onClose={() => setShowSaveAddressModal(null)}
        onSave={handleSaveAndSelectAddress}
      />

      {/* 3. Sign Out Confirmation Modal */}
      {showLogoutConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, padding: '16px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-lg)', padding: '24px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <LogOut size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Sign Out Confirmation</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Are you sure you want to sign out of your account?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                  setSuccessMessage('Logged out successfully!');
                }}
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.85rem', background: 'var(--error)', borderColor: 'var(--error)', cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
