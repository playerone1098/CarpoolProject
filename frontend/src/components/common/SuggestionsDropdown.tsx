import React from 'react';

interface SuggestionsDropdownProps {
  field: string;
  activeSuggestionField: string | null;
  suggestions: any[];
  onSelectSuggestion: (item: any, field: string) => void;
}

export const SuggestionsDropdown: React.FC<SuggestionsDropdownProps> = ({
  field,
  activeSuggestionField,
  suggestions,
  onSelectSuggestion,
}) => {
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
            onSelectSuggestion(item, field);
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
