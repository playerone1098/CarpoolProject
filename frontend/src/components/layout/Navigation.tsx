import React from 'react';
import { Car, PlusCircle, Clock, User } from 'lucide-react';

interface NavigationProps {
  activeTab: 'rides' | 'offer' | 'history' | 'profile';
  setActiveTab: (tab: 'rides' | 'offer' | 'history' | 'profile') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="mobile-nav glass">
      {/* Sliding Indicator (Only on Mobile layouts, auto-hidden on desktop) */}
      <div 
        className="nav-indicator"
        style={{
          left: activeTab === 'rides' ? '8px' : activeTab === 'offer' ? 'calc(25% + 4px)' : activeTab === 'history' ? 'calc(50% + 2px)' : 'calc(75% + 0px)',
          width: 'calc(25% - 10px)',
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
        onClick={() => setActiveTab('offer')} 
        className={`nav-item ${activeTab === 'offer' ? 'active' : ''}`}
        style={{ zIndex: 1, background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <PlusCircle size={20} />
        <span>Offer Ride</span>
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
  );
};
