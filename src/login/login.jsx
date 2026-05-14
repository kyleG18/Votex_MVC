import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineIdentification, HiOutlineCheckBadge } from 'react-icons/hi2';
import api from '../api/axios';
import './login.css';

// Remove the API constant as we'll use the relative paths with the 'api' instance

function LoginPage() {
  const navigate = useNavigate();
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [rfidValue, setRfidValue] = useState('');
  const [voter, setVoter] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const inputRef = useRef(null);

  const formatStudentId = (value) => {
    if (!value) return '';
    const cleaned = value.toString().replace(/[^0-9]/g, '').slice(0, 7);
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
    }
    if (cleaned.length > 3) {
      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
    }
    return formatted;
  };

  // Auto-focus hidden input on scanner screen
  useEffect(() => {
    if (showWelcome) return;
    const focusInput = () => { if (inputRef.current) inputRef.current.focus(); };
    focusInput();
    document.addEventListener('click', focusInput);
    return () => document.removeEventListener('click', focusInput);
  }, [showWelcome]);

  // Auto-redirect countdown after welcome screen appears
  useEffect(() => {
    if (!showWelcome) return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/vote-casting');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showWelcome]);

  const handleInputChange = (e) => {
    setRfidValue(e.target.value);
    if (e.target.value.length > 0) setScanStatus('scanning');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!rfidValue) { setErrorMsg('Please tap your ID card on the scanner.'); return; }

    setScanStatus('scanning');
    setErrorMsg('');

    try {
      const response = await api.post('/api/voters/login-rfid', {
        rfid_uid: rfidValue.trim()
      });

      if (response.data.success) {
        setScanStatus('success');
        localStorage.setItem('voter', JSON.stringify(response.data.student));
        setVoter(response.data.student);
        setTimeout(() => setShowWelcome(true), 600);
      }
    } catch (error) {
      setScanStatus('error');
      setRfidValue('');
      setErrorMsg(error.response?.data?.message || 'Connection error. Please contact administrator.');
      setTimeout(() => { setScanStatus('idle'); setErrorMsg(''); }, 3000);
    }
  };

  const handleAdminLogin = () => navigate('/admin-login');

  // ─── WELCOME / IDENTITY CONFIRMATION SCREEN ───────────────────────────────
  if (showWelcome && voter) {
    const initials = voter.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Progress: countdown goes 3→2→1→0, so fill is (3-countdown)/3 * 100
    const progress = ((3 - countdown) / 3) * 100;

    return (
      <div className="login-page login-page--welcome">
        <div className="login-page__bg-decor">
          <div className="login-page__bg-circle login-page__bg-circle--1" />
          <div className="login-page__bg-circle login-page__bg-circle--2" />
          <div className="login-page__bg-circle login-page__bg-circle--3" />
        </div>

        <div className="welcome-card">
          {/* Pulsing badge */}
          <div className="welcome-card__badge-ring">
            <div className="welcome-card__badge">
              <HiOutlineCheckBadge />
            </div>
          </div>

          <p className="welcome-card__logging-text">Identity Confirmed</p>

          {/* Profile picture or avatar initials */}
          <div className="welcome-card__avatar-wrapper">
            {voter.profile_pic ? (
              <img
                src={`${API}${voter.profile_pic}`}
                alt={voter.fullName}
                className="welcome-card__avatar-img"
              />
            ) : (
              <div className="welcome-card__avatar">{initials}</div>
            )}
          </div>

          {/* Name */}
          <h1 className="welcome-card__name">{voter.fullName}</h1>

          {/* Info tiles */}
          <div className="welcome-card__info">
            <div className="welcome-card__info-item">
              <span className="welcome-card__info-label">Student ID</span>
              <span className="welcome-card__info-value">{formatStudentId(voter.student_id)}</span>
            </div>
            <div className="welcome-card__info-item">
              <span className="welcome-card__info-label">Course</span>
              <span className="welcome-card__info-value">{voter.course || '—'}</span>
            </div>
            {voter.year_level && (
              <div className="welcome-card__info-item">
                <span className="welcome-card__info-label">Year</span>
                <span className="welcome-card__info-value">{voter.year_level}</span>
              </div>
            )}
          </div>

          {/* Countdown loading bar */}
          <div className="welcome-card__loader-wrapper">
            <p className="welcome-card__loader-text">
              Redirecting to voting in <strong>{countdown}</strong>...
            </p>
            <div className="welcome-card__loader-track">
              <div
                className="welcome-card__loader-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN SCANNER SCREEN ──────────────────────────────────────────────────
  return (
    <div className="login-page">
      <div className="login-page__bg-decor">
        <div className="login-page__bg-circle login-page__bg-circle--1" />
        <div className="login-page__bg-circle login-page__bg-circle--2" />
        <div className="login-page__bg-circle login-page__bg-circle--3" />
      </div>

      <div className="login-page__container">
        <div className="login-page__card">
          <div className="login-page__logo" style={{ marginBottom: 'var(--space-6)' }}>
            <img src="/jpc-logo.jpg" alt="John Paul College" className="login-page__logo-img" />
            <h1 className="login-page__logo-text">VoteX</h1>
            <p className="login-page__logo-tagline">John Paul College · Smart Campus Voting</p>
          </div>

          {errorMsg && (
            <div className="login-page__error" id="login-error">{errorMsg}</div>
          )}

          <form className="login-page__form" onSubmit={handleLogin}>
            <div className="login-page__field login-page__field--rfid-only">
              <label className="login-page__label" style={{ textAlign: 'center', width: '100%', marginBottom: 'var(--space-2)' }}>
                Smart Card ID Scanner
              </label>
              <p className="login-page__hint" style={{ textAlign: 'center', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--slate-500)' }}>
                Place your Student ID on the RFID reader
              </p>

              <div
                className={`login-page__scanner ${scanStatus !== 'idle' ? `login-page__scanner--${scanStatus}` : ''}`}
                id="rfid-scanner"
                style={{ padding: 'var(--space-8) var(--space-4)', position: 'relative' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={rfidValue}
                  onChange={handleInputChange}
                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', top: 0, left: 0 }}
                  autoFocus
                />
                <HiOutlineIdentification className="login-page__scanner-icon" style={{ fontSize: '4rem' }} />
                <span className="login-page__scanner-text" style={{ marginTop: 'var(--space-2)', fontSize: '1.1rem' }}>
                  {scanStatus === 'idle' && 'Ready to Scan...'}
                  {scanStatus === 'scanning' && 'Reading ID Card...'}
                  {scanStatus === 'success' && 'Access Granted ✓'}
                  {scanStatus === 'error' && 'Invalid ID Card'}
                </span>
              </div>
            </div>

            <div className="login-page__actions" style={{ marginTop: 'var(--space-2)' }}>
              <button type="submit" className="login-page__btn login-page__btn--primary" id="login-btn" style={{ width: '100%' }}>
                Log In
              </button>
            </div>
          </form>

          <div className="login-page__admin-link">
            <button onClick={handleAdminLogin} className="login-page__admin-btn" id="admin-login-btn">
              Admin Login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
