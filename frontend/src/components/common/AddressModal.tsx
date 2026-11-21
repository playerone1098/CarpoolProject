import React from 'react';
import { SuggestionsDropdown } from './SuggestionsDropdown';

interface AddressModalProps {
  showSaveAddressModal: { type: 'home' | 'work'; field: string } | null;
  modalAddressInput: string;
  setModalAddressInput: (val: string) => void;
  handleAddressChange: (val: string, field: string, setValState: (v: string) => void) => void;
  handleGeocodeModalAddress: () => void;
  activeSuggestionField: string | null;
  setActiveSuggestionField: (field: string | null) => void;
  suggestions: any[];
  handleSelectSuggestion: (item: any, field: string) => void;
  onClose: () => void;
  onSave: (type: 'home' | 'work', currentText: string, field: string) => Promise<void>;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  showSaveAddressModal,
  modalAddressInput,
  setModalAddressInput,
  handleAddressChange,
  handleGeocodeModalAddress,
  activeSuggestionField,
  setActiveSuggestionField,
  suggestions,
  handleSelectSuggestion,
  onClose,
  onSave,
}) => {
  if (!showSaveAddressModal) return null;

  return (
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
            <SuggestionsDropdown 
              field="modalAddress"
              activeSuggestionField={activeSuggestionField}
              suggestions={suggestions}
              onSelectSuggestion={handleSelectSuggestion}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={() => onSave(showSaveAddressModal.type, modalAddressInput, showSaveAddressModal.field)} 
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            Save & Select
          </button>
        </div>
      </div>
    </div>
  );
};
