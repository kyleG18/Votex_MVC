import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineFingerPrint, HiOutlineIdentification } from 'react-icons/hi2';
import './page.css';

function LoginPage() {
  const navigate = useNavigate();
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSimulateScan = () => {
    if (scanStatus === 'scanning') return;
    
    setErrorMsg('');
    setScanStatus('scanning');
    
    // Simulate the hardware reading the card
    setTimeout(() => {
      setScanStatus('success');
      
      // Auto-navigate to voting after success
      setTimeout(() => {
        navigate('/vote-casting');
      }, 1000);
    }, 2000);
  };



  const handleLogin = (e) => {
    e.preventDefault();
    if (scanStatus !== 'success') {
      setErrorMsg('Please tap your ID card on the scanner to log in.');
    }
  };

  const handleAdminLogin = () => {
    navigate('/admin-login');
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-page__bg-decor">
        <div className="login-page__bg-circle login-page__bg-circle--1" />
        <div className="login-page__bg-circle login-page__bg-circle--2" />
        <div className="login-page__bg-circle login-page__bg-circle--3" />
      </div>

      <div className="login-page__container">


        {/* Login Card */}
        <div className="login-page__card">
          {/* Logo Moved Inside Card */}
          <div className="login-page__logo" style={{ marginBottom: 'var(--space-6)' }}>
            <img src="/jpc-logo.jpg" alt="John Paul College" className="login-page__logo-img" />
            <h1 className="login-page__logo-text">VoteX</h1>
            <p className="login-page__logo-tagline">John Paul College · Smart Campus Voting</p>
          </div>
          


          {/* Error Message */}
          {errorMsg && (
            <div className="login-page__error" id="login-error">
              {errorMsg}
            </div>
          )}

          <form className="login-page__form" onSubmit={handleLogin}>
            {/* RFID Scanner Area (Simulation) */}
            <div className="login-page__field login-page__field--rfid-only">
              <label className="login-page__label" style={{ textAlign: 'center', width: '100%', marginBottom: 'var(--space-2)' }}>
                Student ID Scanner
              </label>
              <p className="login-page__hint" style={{ textAlign: 'center', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--slate-500)' }}>
                Hardware required. (Click box to simulate scan)
              </p>
              
              <div
                className={`login-page__scanner ${scanStatus !== 'idle' ? `login-page__scanner--${scanStatus}` : ''}`}
                onClick={handleSimulateScan}
                id="rfid-scanner"
                style={{ padding: 'var(--space-8) var(--space-4)' }}
              >
                <HiOutlineIdentification className="login-page__scanner-icon" style={{ fontSize: '4rem' }} />
                <span className="login-page__scanner-text" style={{ marginTop: 'var(--space-2)', fontSize: '1.1rem' }}>
                  {scanStatus === 'idle' && 'Tap ID Card to Scan'}
                  {scanStatus === 'scanning' && 'Reading Card Data...'}
                  {scanStatus === 'success' && 'Card Verified ✓'}
                  {scanStatus === 'error' && 'Unrecognized Card'}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="login-page__actions" style={{ marginTop: 'var(--space-2)' }}>
              <button type="submit" className="login-page__btn login-page__btn--primary" id="login-btn" style={{ width: '100%' }}>
                Log In
              </button>
            </div>
          </form>

          {/* Admin Login Link */}
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
