import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Car, ShieldAlert } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { isMock, emailRegister, emailLogin } = useApp();
  
  const [isRegister, setIsRegister] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      setEmailInput('');
      setPasswordInput('');
      setNameInput('');
      setPhoneInput('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed');
    }
  };

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

        {/* EMAIL LOGIN & REGISTER FORM */}
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
      </div>
    </div>
  );
};
