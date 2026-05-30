import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineIdentification,
  HiOutlineCheckBadge
} from 'react-icons/hi2';
import { formatImageUrl } from '../utils/imageUtils';
import './adminLogin.css';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rfid'); // 'rfid' or 'credentials'

  // Credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // RFID state
  const [rfidValue, setRfidValue] = useState('');
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, error
  const inputRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Welcome screen state
  const [showWelcome, setShowWelcome] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  // Check for existing admin lockout on load
  useEffect(() => {
    const lockoutUntil = localStorage.getItem('admin_lockout_until');
    if (lockoutUntil) {
      const remaining = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutTimeLeft(remaining);
      } else {
        localStorage.removeItem('admin_lockout_until');
        localStorage.removeItem('admin_failed_attempts');
      }
    }
  }, []);

  // Handle admin lockout countdown timer
  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem('admin_lockout_until');
          localStorage.removeItem('admin_failed_attempts');
          setErrorMsg('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  // Auto-focus hidden input on RFID tab
  useEffect(() => {
    if (activeTab === 'rfid' && lockoutTimeLeft <= 0) {
      const focusInput = () => { if (inputRef.current) inputRef.current.focus(); };
      focusInput();
      document.addEventListener('click', focusInput);
      return () => document.removeEventListener('click', focusInput);
    }
  }, [activeTab, lockoutTimeLeft]);

  // Countdown & redirect after welcome screen
  useEffect(() => {
    if (!showWelcome) return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/admin/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showWelcome, navigate]);

  const handleRfidChange = async (e) => {
    if (lockoutTimeLeft > 0) {
      setErrorMsg(`Too many failed attempts. Locked out for ${lockoutTimeLeft} seconds.`);
      return;
    }

    const value = e.target.value;
    setRfidValue(value);

    if (value.length > 0) {
      setScanStatus('scanning');
      setErrorMsg('');

      // Clear the previous timeout if it exists
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      // Auto-submit after a brief delay to allow scanner to complete input
      scanTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await api.post('/api/admins/login-rfid', { rfid_uid: value.trim() });

          if (response.data.success) {
            setScanStatus('success');
            localStorage.removeItem('admin_failed_attempts');
            localStorage.removeItem('admin_lockout_until');
            localStorage.setItem('votex_session_role', response.data.user.role);
            localStorage.setItem('votex_admin_id', response.data.user.id);
            setAdminUser(response.data.user);
            setTimeout(() => setShowWelcome(true), 800);
          }
        } catch (error) {
          setScanStatus('error');
          setRfidValue('');
          if (error.response && error.response.data) {
            setErrorMsg(error.response.data.message);
          } else {
            setErrorMsg('Failed to connect to the server.');
          }
          setTimeout(() => { setScanStatus('idle'); setErrorMsg(''); }, 3000);
        }
      }, 300); // 300ms debounce
    }
  };

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (lockoutTimeLeft > 0) {
      setErrorMsg(`Too many failed attempts. Locked out for ${lockoutTimeLeft} seconds.`);
      return;
    }

    if (!username || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/admins/login', { username, password });

      if (response.data.success) {
        localStorage.removeItem('admin_failed_attempts');
        localStorage.removeItem('admin_lockout_until');
        localStorage.setItem('votex_session_role', response.data.user.role);
        localStorage.setItem('votex_admin_id', response.data.user.id);
        setAdminUser(response.data.user);
        setTimeout(() => setShowWelcome(true), 300);
      }
    } catch (error) {
      const failedAttempts = parseInt(localStorage.getItem('admin_failed_attempts') || '0') + 1;
      localStorage.setItem('admin_failed_attempts', failedAttempts.toString());

      if (failedAttempts >= 3) {
        const lockoutUntil = Date.now() + 30000; // 30 seconds lockout
        localStorage.setItem('admin_lockout_until', lockoutUntil.toString());
        setLockoutTimeLeft(30);
        setPassword('');
        setErrorMsg('Too many failed login attempts. You are locked out for 30 seconds.');
      } else {
        const attemptsLeft = 3 - failedAttempts;
        const msg = error.response?.data?.message || 'Invalid username or password.';
        setErrorMsg(msg + ` (Attempt ${failedAttempts}/3. ${attemptsLeft} attempts remaining)`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── WELCOME / IDENTITY CONFIRMATION SCREEN ───────────────────────────────
  if (showWelcome && adminUser) {
    const initials = (adminUser.fullName || adminUser.username || 'AD')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const progress = ((3 - countdown) / 3) * 100;

    const roleLabel = adminUser.role === 'super_admin'
      ? 'Super Admin'
      : adminUser.role === 'admin'
      ? 'Admin'
      : adminUser.role;

    return (
      <div className="admin-login admin-login--welcome">
        <div className="admin-login__bg-decor">
          <div className="admin-login__bg-circle admin-login__bg-circle--1" />
          <div className="admin-login__bg-circle admin-login__bg-circle--2" />
          <div className="admin-login__bg-circle admin-login__bg-circle--3" />
        </div>

        <div className="admin-welcome-card">
          {/* Pulsing shield badge */}
          <div className="admin-welcome-card__badge-ring">
            <div className="admin-welcome-card__badge">
              <HiOutlineCheckBadge />
            </div>
          </div>

          <p className="admin-welcome-card__logging-text">Identity Confirmed</p>

          {/* Avatar initials or profile pic */}
          <div className="admin-welcome-card__avatar-wrapper">
            {adminUser.profile_pic ? (
              <img
                src={formatImageUrl(adminUser.profile_pic)}
                alt={adminUser.fullName || adminUser.username}
                className="admin-welcome-card__avatar-img"
              />
            ) : (
              <div className="admin-welcome-card__avatar">{initials}</div>
            )}
          </div>

          <h1 className="admin-welcome-card__name">
            {adminUser.fullName || adminUser.username}
          </h1>

          <div className="admin-welcome-card__info">
            <div className="admin-welcome-card__info-item">
              <span className="admin-welcome-card__info-label">Username</span>
              <span className="admin-welcome-card__info-value">{adminUser.username}</span>
            </div>
            <div className="admin-welcome-card__info-item">
              <span className="admin-welcome-card__info-label">Role</span>
              <span className="admin-welcome-card__info-value">{roleLabel}</span>
            </div>
          </div>

          <div className="admin-welcome-card__loader-wrapper">
            <p className="admin-welcome-card__loader-text">
              Redirecting to dashboard in <strong>{countdown}</strong>...
            </p>
            <div className="admin-welcome-card__loader-track">
              <div
                className="admin-welcome-card__loader-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login">
      {/* Background decoration */}
      <div className="admin-login__bg-decor">
        <div className="admin-login__bg-circle admin-login__bg-circle--1" />
        <div className="admin-login__bg-circle admin-login__bg-circle--2" />
        <div className="admin-login__bg-circle admin-login__bg-circle--3" />
      </div>

      <div className="admin-login__container">
        {/* Login Card */}
        <div className="admin-login__card">
          <div className="admin-login__logo" style={{ marginBottom: 'var(--space-6)' }}>
            <img src="/jpc-logo.jpg" alt="John Paul College" className="admin-login__logo-img" />
            <h1 className="admin-login__logo-text" style={{ color: 'var(--slate-900)' }}>VoteX Admin</h1>
            <p className="admin-login__logo-tagline" style={{ color: 'var(--slate-500)' }}>Election Committee Portal</p>
          </div>

          {/* Tabs */}
          <div className="admin-login__tabs">
            <button
              className={`admin-login__tab ${activeTab === 'rfid' ? 'admin-login__tab--active' : ''}`}
              onClick={() => { setActiveTab('rfid'); setErrorMsg(''); setRfidValue(''); setScanStatus('idle'); }}
            >
              <HiOutlineIdentification /> Smart Card
            </button>
            <button
              className={`admin-login__tab ${activeTab === 'credentials' ? 'admin-login__tab--active' : ''}`}
              onClick={() => { setActiveTab('credentials'); setErrorMsg(''); }}
            >
              <HiOutlineUser /> Credentials
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="admin-login__error" id="admin-login-error">
              {errorMsg}
            </div>
          )}

          {/* Content Area */}
          <div className="admin-login__content">
            {activeTab === 'rfid' ? (
              <div className="admin-login__rfid-section">
                <p className="admin-login__hint">Place your Admin Smart Card on the RFID reader</p>
                <div
                  className={`admin-login__scanner admin-login__scanner--${scanStatus}`}
                  id="admin-rfid-scanner"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={rfidValue}
                    onChange={handleRfidChange}
                    className="admin-login__hidden-input"
                    autoFocus
                    disabled={lockoutTimeLeft > 0}
                  />
                  {/* Laser sweep line shown during scanning */}
                  <div className="admin-login__scanner-laser" />
                  <HiOutlineIdentification className="admin-login__scanner-icon" />
                  <span className="admin-login__scanner-text">
                    {lockoutTimeLeft > 0 ? `Locked out (${lockoutTimeLeft}s)` : (
                      <>
                        {scanStatus === 'idle' && 'Ready to Scan...'}
                        {scanStatus === 'scanning' && 'Reading ID Card...'}
                        {scanStatus === 'success' && 'Access Granted ✓'}
                        {scanStatus === 'error' && 'Invalid ID Card'}
                      </>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <form className="admin-login__form" onSubmit={handleCredentialsLogin}>
                <div className="admin-login__field">
                  <label className="admin-login__label" htmlFor="admin-username">
                    <HiOutlineUser /> Username
                  </label>
                  <input
                    type="text"
                    id="admin-username"
                    className="admin-login__input"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    disabled={lockoutTimeLeft > 0}
                  />
                </div>

                <div className="admin-login__field">
                  <label className="admin-login__label" htmlFor="admin-password">
                    <HiOutlineLockClosed /> Password
                  </label>
                  <input
                    type="password"
                    id="admin-password"
                    className="admin-login__input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={lockoutTimeLeft > 0}
                  />
                </div>

                <button
                  type="submit"
                  className={`admin-login__btn ${isLoading ? 'admin-login__btn--loading' : ''}`}
                  id="admin-submit-btn"
                  disabled={isLoading || lockoutTimeLeft > 0}
                >
                  {lockoutTimeLeft > 0 ? (
                    `Locked out (${lockoutTimeLeft}s)`
                  ) : isLoading ? (
                    <><span className="admin-login__spinner" /> Authenticating...</>
                  ) : (
                    <><HiOutlineShieldCheck /> Sign In</>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="admin-login__footer">
            <Link to="/admin-register" className="admin-login__register-link">
              Apply for Admin Access
            </Link>
            <span className="admin-login__footer-divider">•</span>
            <Link to="/login" className="admin-login__back-link" id="back-to-voter-btn">
              Back to Voter Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
