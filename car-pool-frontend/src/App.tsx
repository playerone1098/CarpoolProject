import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { MapComponent } from './components/MapComponent';
import { 
  Car, 
  Bell, 
  LogOut, 
  Check, 
  Map, 
  BookMarked, 
  ShieldAlert, 
  X,
  User,
  Clock
} from 'lucide-react';

const App: React.FC = () => {
  const {
    user,
    isAuthenticated,
    loading,
    isMock,
    rides,
    historyRides,
    notifications,
    emailRegister,
    emailLogin,
    logout,
    updateProfile,
    addBookmark,
    removeBookmark,
    createRide,
    bookSeat,
    updateRide,
    deleteRide,
    markNotifRead,
    serverError,
    retryConnection
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rides' | 'history' | 'profile'>('rides');
  const [showNotifications, setShowNotifications] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // --- Auth Screen States ---
  const [authMethod, setAuthMethod] = useState<'email' | null>('email');
  const [isRegister, setIsRegister] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  // --- Form Popup Modals ---
  const [showCreateRide, setShowCreateRide] = useState(false);

  // --- Create Ride Fields ---
  const [rideCarModel, setRideCarModel] = useState('');
  const [rideSeats, setRideSeats] = useState(3);
  const [ridePickup, setRidePickup] = useState('');
  const [rideDrop, setRideDrop] = useState('');
  const [rideTime, setRideTime] = useState('');
  const [ridePickupCoords, setRidePickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [rideDropCoords, setRideDropCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapSelectionMode, setMapSelectionMode] = useState<'pickup' | 'drop' | null>(null);



  // --- Bookmark Form ---
  const [bookmarkName, setBookmarkName] = useState('');
  const [bookmarkAddr, setBookmarkAddr] = useState('');
  const [bookmarkCoords, setBookmarkCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [bookmarkMapSel, setBookmarkMapSel] = useState<boolean>(false);

  // --- Profile Settings ---
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileMode, setProfileMode] = useState<'free' | 'pro'>('free');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [homeAddrInput, setHomeAddrInput] = useState('');
  const [workAddrInput, setWorkAddrInput] = useState('');
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [workCoords, setWorkCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [profileMapSel, setProfileMapSel] = useState<'home' | 'work' | null>(null);
  const [profileSubpage, setProfileSubpage] = useState<'menu' | 'details' | 'addresses' | 'bookmarks' | 'help'>('menu');
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

  // Active state flags for quick action buttons
  const isSourceHomeActive = !!(filterSourceCoords && user?.homeAddress?.coords && filterSourceCoords.lat === user.homeAddress.coords.lat && filterSourceCoords.lng === user.homeAddress.coords.lng);
  const isSourceWorkActive = !!(filterSourceCoords && user?.workAddress?.coords && filterSourceCoords.lat === user.workAddress.coords.lat && filterSourceCoords.lng === user.workAddress.coords.lng);
  const isDestHomeActive = !!(filterDestCoords && user?.homeAddress?.coords && filterDestCoords.lat === user.homeAddress.coords.lat && filterDestCoords.lng === user.homeAddress.coords.lng);
  const isDestWorkActive = !!(filterDestCoords && user?.workAddress?.coords && filterDestCoords.lat === user.workAddress.coords.lat && filterDestCoords.lng === user.workAddress.coords.lng);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone);
      setProfileMode(user.mode);
      setProfilePhoto(user.profilePhoto || '');
      setHomeAddrInput(user.homeAddress?.address || '');
      setWorkAddrInput(user.workAddress?.address || '');
      setHomeCoords(user.homeAddress?.coords || null);
      setWorkCoords(user.workAddress?.coords || null);
      
      // Reset navigation and L2 settings page states on login
      setActiveTab('rides');
      setProfileSubpage('menu');
    } else {
      // Reset auth method to show login form fields upon logout
      setAuthMethod('email');
    }
  }, [user]);

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

  // --- Geocoding Utilities ---
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!address || address.trim().length < 3) return null;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      if (!response.ok) return null;
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.display_name || null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
    return null;
  };

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
      setHomeAddrInput(address);
      setHomeCoords(coords);
    } else if (field === 'work') {
      setWorkAddrInput(address);
      setWorkCoords(coords);
    } else if (field === 'bookmark') {
      setBookmarkAddr(address);
      setBookmarkCoords(coords);
      setBookmarkMapSel(true);
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

  const renderSuggestionsDropdown = (field: string) => {
    if (activeSuggestionField !== field || suggestions.length === 0) return null;
    return (
      <div style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#18181b',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        maxHeight: '200px',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        marginTop: '4px',
      }}>
        {suggestions.map((item, idx) => (
          <div 
            key={idx}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSelectSuggestion(item, field);
            }}
            style={{
              padding: '10px 14px',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
              background: 'transparent',
              transition: 'background 0.2s',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            📍 {item.display_name}
          </div>
        ))}
      </div>
    );
  };

  const handleGeocodeBookmark = async () => {
    if (bookmarkAddr) {
      const coords = await geocodeAddress(bookmarkAddr);
      if (coords) {
        setBookmarkCoords(coords);
        setBookmarkMapSel(true);
      }
    }
  };

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

  const handleGeocodeFilterSource = async () => {
    if (filterSourceAddr) {
      const coords = await geocodeAddress(filterSourceAddr);
      if (coords) setFilterSourceCoords(coords);
    }
  };

  const handleGeocodeFilterDest = async () => {
    if (filterDestAddr) {
      const coords = await geocodeAddress(filterDestAddr);
      if (coords) setFilterDestCoords(coords);
    }
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
      }
      setSuccessMessage(`Loaded ${type} location!`);
    } else {
      setModalAddressInput('');
      setModalAddressCoords(null);
      setShowSaveAddressModal({ type, field });
    }
  };

  const getHaversineDistance = (coords1: { lat: number; lng: number }, coords2: { lat: number; lng: number }): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth's radius in km

    const dLat = toRad(coords2.lat - coords1.lat);
    const dLng = toRad(coords2.lng - coords1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coords1.lat)) *
        Math.cos(toRad(coords2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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

  const handleBookmarkCoordsSelect = async (coords: { lat: number; lng: number }) => {
    setBookmarkCoords(coords);
    const addr = await reverseGeocode(coords.lat, coords.lng);
    if (addr) setBookmarkAddr(addr);
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setErrorMessage('Email and password are required');
      return;
    }
    try {
      if (isRegister) {
        if (!nameInput || !phoneInput) {
          setErrorMessage('Name and phone number are required to register');
          return;
        }
        await emailRegister(nameInput, emailInput, passwordInput, phoneInput);
        setSuccessMessage('Successfully registered and logged in!');
      } else {
        await emailLogin(emailInput, passwordInput);
        setSuccessMessage('Logged in successfully!');
      }
      setAuthMethod(null);
      setEmailInput('');
      setPasswordInput('');
      setNameInput('');
      setPhoneInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    }
  };


  const handleCreateRideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rideCarModel || !ridePickup || !rideDrop || !rideTime) {
      setErrorMessage('Please fill out all fields');
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
      setEditingRideId(null);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };



  const handleDeleteRide = async (rideId: string) => {
    if (window.confirm('Are you sure you want to delete this ride offer?')) {
      try {
        await deleteRide(rideId);
        setSuccessMessage('Ride offer deleted!');
      } catch (err: any) {
        setErrorMessage(err.message);
      }
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
    setShowCreateRide(true);
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
      setErrorMessage(err.message);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        name: profileName,
        phone: profilePhone,
        mode: profileMode,
        profilePhoto: profilePhoto || undefined,
      });
      setSuccessMessage('Profile saved successfully!');
    } catch (err: any) {
      setErrorMessage(err.message);
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
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)', gap: '16px' }}>
        <Car size={48} color="var(--accent-light)" className="skeleton" style={{ borderRadius: '50%', padding: '8px' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500 }}>Initializing RideShare...</h2>
      </div>
    );
  }

  if (serverError) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-primary)',
        padding: '20px',
      }}>
        <div style={{ position: 'absolute', width: '250px', height: '250px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '50%', filter: 'blur(80px)', top: '15%', left: '10%' }}></div>

        <div className="glass" style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 32px',
          textAlign: 'center',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%', display: 'flex', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <ShieldAlert size={32} color="var(--error)" />
            </div>
          </div>

          <h1 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Server Connection Failed</h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.6 }}>
            Unable to reach the backend server. Please verify your NestJS API server is running and active at:
            <code style={{ display: 'block', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', marginTop: '8px', color: 'var(--accent-light)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
              http://localhost:4000/v1
            </code>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Troubleshooting:</span>
            <div>• Start NestJS backend with <code style={{ color: '#ffffff' }}>npm run start:dev</code>.</div>
            <div>• Make sure Redis and MongoDB services are running.</div>
          </div>

          <button onClick={retryConnection} className="btn btn-primary" style={{ width: '100%' }}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // --- UNAUTHENTICATED LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-primary)',
        padding: '20px',
      }}>
        {/* Glow Effects */}
        <div style={{ position: 'absolute', width: '250px', height: '250px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '50%', filter: 'blur(80px)', top: '15%', left: '10%' }}></div>
        <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '50%', filter: 'blur(100px)', bottom: '15%', right: '10%' }}></div>

        <div className="glass" style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 32px',
          textAlign: 'center',
          zIndex: 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'var(--accent-glow)', padding: '12px', borderRadius: '50%', display: 'flex' }}>
              <Car size={32} color="var(--accent-light)" />
            </div>
          </div>

          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>RideShare</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>
            Smart modern carpooling for daily commuters
          </p>

          {isMock && (
            <div className="glass" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.1)',
              borderColor: 'rgba(245, 158, 11, 0.2)',
              color: 'var(--warning)',
              fontSize: '0.8rem',
              marginBottom: '20px',
              textAlign: 'left',
            }}>
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Offline Mock Mode</strong>: The local backend server is not active. Using localStorage database.
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="glass" style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.2)',
              color: 'var(--error)',
              fontSize: '0.8rem',
              marginBottom: '20px',
              textAlign: 'left',
            }}>
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="glass" style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'rgba(16, 185, 129, 0.2)',
              color: 'var(--success)',
              fontSize: '0.8rem',
              marginBottom: '20px',
              textAlign: 'left',
            }}>
              {successMessage}
            </div>
          )}

          {/* EMAIL LOGIN & REGISTER FLOW */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>
                {isRegister ? 'Create an Account' : 'Sign In'}
              </h3>
              
              {isRegister && (
                <>
                  <div className="input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+919876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                </>
              )}

              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                {isRegister ? 'Register & Log In' : 'Sign In'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  {isRegister ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    );
  }

  // --- AUTHENTICATED APP VIEW ---
  return (
    <div className="app-container">

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
      <nav className="mobile-nav glass">
        {/* Sliding Indicator (Only on Mobile layouts, auto-hidden on desktop) */}
        <div 
          className="nav-indicator"
          style={{
            left: activeTab === 'rides' ? '8px' : activeTab === 'history' ? 'calc(33.333% + 5px)' : 'calc(66.666% + 2px)',
            width: 'calc(33.333% - 10px)',
          }}
        />

        <button 
          onClick={() => setActiveTab('rides')} 
          className={`nav-item ${activeTab === 'rides' ? 'active' : ''}`}
          style={{ zIndex: 1, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <Car size={20} />
          <span>Commutes</span>
        </button>

        <button 
          onClick={() => setActiveTab('history')} 
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          style={{ zIndex: 1, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <Clock size={20} />
          <span>History</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')} 
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          style={{ zIndex: 1, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <User size={20} />
          <span>Profile</span>
        </button>
      </nav>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="main-content">
        
        {/* HEADER BAR FOR WEB APP */}
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
            
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifications(!showNotifications)} className="btn-icon">
                <Bell size={18} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: 'var(--error)', borderRadius: '50%' }}></span>
                )}
              </button>

              {/* Notification Overlay Popover */}
              {showNotifications && (
                <div className="glass" style={{
                  position: 'absolute',
                  top: '48px',
                  right: '0',
                  width: '280px',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  zIndex: 2000,
                  boxShadow: 'var(--shadow-lg)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '0.9rem' }}>Notifications</h4>
                    <button onClick={() => setShowNotifications(false)} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} onClick={() => markNotifRead(n._id)} style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                          borderLeft: n.read ? 'none' : '3px solid var(--accent)',
                          cursor: 'pointer',
                        }}>
                          <h5 style={{ fontSize: '0.8rem', fontWeight: n.read ? 500 : 700 }}>{n.title}</h5>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>


          </div>
        </header>

        {/* ======================================= */}
        {/* TAB VIEW 1: RIDES TAB */}
        {/* ======================================= */}
        {activeTab === 'rides' && (
          <div>
              {!isFilterMinimized && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>Daily Shared Commutes</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hop into local active carpools</p>
                </div>
              )}

              {/* Search & Filter Panel */}
              {isFilterMinimized ? (
                /* Minimized Panel */
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
              ) : (
                /* Expanded Panel */
                <div className="glass" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      🔍 Search Rides by Route
                    </h4>
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
                            {renderSuggestionsDropdown('filterSource')}
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
                            {renderSuggestionsDropdown('filterDest')}
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

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div className="input-group" style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Source radius limit</label>
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
                      onClick={() => {
                        if (!filterSourceAddr || !filterDestAddr) {
                          setErrorMessage('Please enter both source and destination addresses.');
                          return;
                        }
                        setHasSearchedRides(true);
                        setIsFilterMinimized(true);
                      }}
                      className="btn btn-primary"
                      style={{ marginTop: '4px', width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', justifyContent: 'center', gap: '8px' }}
                    >
                      🔍 Find Commuter Rides
                    </button>
                  </div>
                </div>
              )}

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
                  filteredRides.map((ride: any) => {
                  const driverPhoto = ride.driver.profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${ride.driver.name}`;
                  const isDriver = ride.driver._id === user?._id;
                  const isPassenger = ride.passengers.some((p: any) => p._id === user?._id);
                  const isMapExpanded = expandedRideMapId === ride._id;
                  
                  return (
                    <div key={ride._id} className="glass-interactive" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
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
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Group</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{ride.groupId.name || 'Direct Commute'}</span>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Seats Left</span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-light)' }}>
                                {ride.seatsAvailable - ride.passengers.length} / {ride.seatsAvailable}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => setExpandedRideMapId(isMapExpanded ? null : ride._id)} 
                              className="btn btn-secondary" 
                              style={{ padding: '8px 12px' }}
                              title="Show route map"
                            >
                              <Map size={16} />
                            </button>

                            {isDriver ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button 
                                  onClick={() => handleStartEditRide(ride)} 
                                  className="btn btn-secondary" 
                                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteRide(ride._id)} 
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
                                onClick={() => bookSeat(ride._id)} 
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
                })
              )}
            </div>
          </div>
        )}


        {/* ======================================= */}
        {/* TAB VIEW 2: HISTORY TAB */}
        {/* ======================================= */}
        {activeTab === 'history' && (() => {
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
                              🚗 {ride.carModel} • {ride.seatsAvailable} seats left
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
                              🚗 {ride.carModel} • Shared with {ride.passengers?.length || 0} co-commuters
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
        })()}

        {/* ======================================= */}
        {/* TAB VIEW 3: PROFILE TAB */}
        {/* ======================================= */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {profileSubpage !== 'menu' && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => setProfileSubpage('menu')} 
                  className="glass-interactive" 
                  style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', gap: '6px', fontSize: '0.85rem', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center' }}
                >
                  ← Back to Settings Menu
                </button>
              </div>
            )}

            {/* ======================================= */}
            {/* L2 SUBPAGE 0: MAIN SETTINGS MENU */}
            {/* ======================================= */}
            {profileSubpage === 'menu' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* User Summary Card */}
                <div className="glass" style={{ padding: '20px', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${profileName}`} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
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
                    style={{ width: '100%', maxWidth: '280px', gap: '8px', padding: '12px 20px', borderRadius: 'var(--radius-md)', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* L2 SUBPAGE 1: PERSONAL DETAILS */}
            {/* ======================================= */}
            {profileSubpage === 'details' && (
              <form onSubmit={handleSaveProfile} className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Personal Profile Settings</h3>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={profilePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${profileName}`} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
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
            )}

            {/* ======================================= */}
            {/* L2 SUBPAGE 2: COMMUTE ADDRESSES */}
            {/* ======================================= */}
            {profileSubpage === 'addresses' && (
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
                          onBlur={() => setTimeout(handleGeocodeHome, 200)}
                          className="input-field" 
                        />
                        {renderSuggestionsDropdown('home')}
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
                          onBlur={() => setTimeout(handleGeocodeWork, 200)}
                          className="input-field" 
                        />
                        {renderSuggestionsDropdown('work')}
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
            )}

            {/* ======================================= */}
            {/* L2 SUBPAGE 3: BOOKMARKS */}
            {/* ======================================= */}
            {profileSubpage === 'bookmarks' && (
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
                        <button onClick={() => removeBookmark(b._id)} style={{ color: 'var(--error)', fontSize: '0.75rem', padding: '4px' }}>Delete</button>
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
                      <input type="text" placeholder="123 High Street" value={bookmarkAddr} onChange={(e) => handleAddressChange(e.target.value, 'bookmark', setBookmarkAddr)} onBlur={() => setTimeout(handleGeocodeBookmark, 200)} className="input-field" required />
                      {renderSuggestionsDropdown('bookmark')}
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
            )}

            {/* ======================================= */}
            {/* L2 SUBPAGE 4: HELP & SUPPORT */}
            {/* ======================================= */}
            {profileSubpage === 'help' && (
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
                    <div>✉️ <strong>Email support:</strong> <a href="mailto:ridesahre.playerone@gmail.com" style={{ color: 'var(--accent-light)', textDecoration: 'underline' }}>ridesahre.playerone@gmail.com</a></div>
                    <div>📞 <strong>Phone assistance:</strong> <a href="tel:+918875760063" style={{ color: 'var(--accent-light)', textDecoration: 'underline' }}>+918875760063</a></div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* ======================================= */}
      {/* POPUP MODALS */}
      {/* ======================================= */}

      {/* 1. Create Ride Modal */}
      {showCreateRide && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2500, padding: '16px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-lg)', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem' }}>{editingRideId ? 'Edit Shared Ride Offer' : 'Offer a Shared Ride'}</h3>
              <button onClick={() => { setShowCreateRide(false); setMapSelectionMode(null); setEditingRideId(null); setRideCarModel(''); setRidePickup(''); setRideDrop(''); setRideTime(''); setRidePickupCoords(null); setRideDropCoords(null); }} style={{ color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateRideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>


              <div className="input-group">
                <label>Car Model & Color</label>
                <input type="text" placeholder="Toyota Camry Black" value={rideCarModel} onChange={(e) => setRideCarModel(e.target.value)} className="input-field" required />
              </div>

              <div className="input-group">
                <label>Seats Available</label>
                <input type="number" min={1} max={7} value={rideSeats} onChange={(e) => setRideSeats(Number(e.target.value))} className="input-field" required />
              </div>

              <div className="input-group">
                <label>Pickup Location Address</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="Tech Park Entrance" value={ridePickup} onChange={(e) => handleAddressChange(e.target.value, 'ridePickup', setRidePickup)} onBlur={() => setTimeout(handleGeocodeRidePickup, 200)} className="input-field" required />
                  {renderSuggestionsDropdown('ridePickup')}
                </div>
              </div>

              <div className="input-group">
                <label>Destination Location Address</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="Vasant Kunj Mall" value={rideDrop} onChange={(e) => handleAddressChange(e.target.value, 'rideDrop', setRideDrop)} onBlur={() => setTimeout(handleGeocodeRideDrop, 200)} className="input-field" required />
                  {renderSuggestionsDropdown('rideDrop')}
                </div>
              </div>

              <div className="input-group">
                <label>Departure Date & Time</label>
                <input type="datetime-local" value={rideTime} onChange={(e) => setRideTime(e.target.value)} className="input-field" required />
              </div>

              {/* Map Coordinates Picker */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setMapSelectionMode('pickup')} className={`btn ${mapSelectionMode === 'pickup' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.8rem', padding: '8px 12px' }}>
                  📍 Set Pickup on Map
                </button>
                <button type="button" onClick={() => setMapSelectionMode('drop')} className={`btn ${mapSelectionMode === 'drop' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.8rem', padding: '8px 12px' }}>
                  📍 Set Drop on Map
                </button>
              </div>

              {(ridePickupCoords || rideDropCoords) && (
                <div style={{ height: '220px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <MapComponent 
                    pickupCoords={ridePickupCoords}
                    dropCoords={rideDropCoords}
                    selectionMode={mapSelectionMode}
                    onSelectCoords={(type, coords) => handleRideCoordsSelect(type, coords)}
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                {editingRideId ? 'Update Ride Offer' : 'Post Ride'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Save Address Modal */}
      {showSaveAddressModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(9, 9, 11, 0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
        }}>
          <div className="glass" style={{ width: 'calc(100% - 32px)', maxWidth: '420px', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {showSaveAddressModal.type === 'home' ? '🏠 Set Home Location' : '💼 Set Work Location'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              You don't have a {showSaveAddressModal.type} location set. Please enter an address below to save it.
            </p>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Address</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={modalAddressInput} 
                  onChange={(e) => handleAddressChange(e.target.value, 'modalAddress', setModalAddressInput)} 
                  onFocus={() => setActiveSuggestionField('modalAddress')}
                  onBlur={() => setTimeout(handleGeocodeModalAddress, 200)}
                  placeholder="Type location address..."
                  className="input-field" 
                  style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                />
                {renderSuggestionsDropdown('modalAddress')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setShowSaveAddressModal(null)} 
                className="btn btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => handleSaveAndSelectAddress(showSaveAddressModal.type, modalAddressInput, showSaveAddressModal.field)} 
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
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
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.85rem' }}
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
                style={{ flex: 1, padding: '10px 16px', fontSize: '0.85rem', background: 'var(--error)', borderColor: 'var(--error)' }}
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
