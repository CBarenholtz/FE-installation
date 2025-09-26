
'use client';
import React from 'react';

const clearCookiesAndLocalStorage = () => {
  // Clear all cookies
  document.cookie.split(';').forEach((c) => {
    document.cookie = c
      .replace(/^ +/, '')
      .replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
  });
  // Clear local storage
  localStorage.clear();
};

export const PersistentHeader: React.FC = () => {
  const handleBack = () => {
    clearCookiesAndLocalStorage();
    window.location.href = '/'; // Change to your form route if different
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      background: '#fff',
      zIndex: 1000,
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span style={{ fontWeight: 'bold' }}>Application Header</span>
      <button
        onClick={handleBack}
        style={{
          background: '#0070f3',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
        }}
      >
        Back to Form
      </button>
    </header>
  );
};
