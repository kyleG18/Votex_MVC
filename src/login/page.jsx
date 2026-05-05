import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineFingerPrint, HiOutlineIdentification } from 'react-icons/hi2';
import './page.css';

function LoginPage() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [studentIdError, setStudentIdError] = useState('');
  const [email, setEmail] = useState('');
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleStudentIdChange = (e) => {
    const value = e.target.value;
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '');
    setStudentId(digitsOnly);

    if (digitsOnly.length === 0) {
      setStudentIdError('');
    } else if (digitsOnly.length < 7) {
      setStudentIdError(`Student ID must be 7 digits (${digitsOnly.length}/7)`);
    } else if (digitsOnly.length > 7) {
      setStudentIdError('Student ID must be exactly 7 digits');
    } else {
      setStudentIdError('');
    }
  };

  const handleScan = () => {
    setScanStatus('scanning');
    // Simulate fingerprint scan
    setTimeout(() => {
      setScanStatus('success');
    }, 2000);
  };



  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!studentId || !email) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (studentId.length !== 7) {
      setStudentIdError('Student ID must be exactly 7 digits');
      return;
    }

    if (scanStatus !== 'success') {
      setErrorMsg('Please complete biometric verification.');
      return;
    }

    // Success - navigate to vote casting
    navigate('/vote-casting');
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
        {/* Logo */}
        <div className="login-page__logo">
          <img src="/jpc-logo.jpg" alt="John Paul College" className="login-page__logo-img" />
          <h1 className="login-page__logo-text">VoteX</h1>
          <p className="login-page__logo-tagline">John Paul College · Smart Campus Voting</p>
        </div>

        {/* Login Card */}
        <div className="login-page__card">
          <h2 className="login-page__title">Voter Log In</h2>
          <p className="login-page__desc">Authenticate to cast your vote for the Student Council Election 2026</p>

          {/* Error Message */}
          {errorMsg && (
            <div className="login-page__error" id="login-error">
              {errorMsg}
            </div>
          )}

          <form className="login-page__form" onSubmit={handleLogin}>
            {/* Student ID */}
            <div className="login-page__field">
              <label className="login-page__label" htmlFor="studentId">
                <HiOutlineIdentification /> Student ID Number
              </label>
              <input
                type="text"
                id="studentId"
                className={`login-page__input ${studentIdError ? 'login-page__input--error' : ''}`}
                placeholder="e.g., 2500123"
                value={studentId}
                onChange={handleStudentIdChange}
                maxLength={7}
                inputMode="numeric"
              />
              {studentIdError && (
                <span className="login-page__field-error">{studentIdError}</span>
              )}
            </div>

            {/* Email */}
            <div className="login-page__field">
              <label className="login-page__label" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="login-page__input"
                placeholder="student@jpc.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Fingerprint Scanner */}
            <div className="login-page__field">
              <label className="login-page__label">
                <HiOutlineFingerPrint /> Biometrics Scan (Fingerprint)
              </label>
              <div
                className={`login-page__scanner ${scanStatus !== 'idle' ? `login-page__scanner--${scanStatus}` : ''}`}
                onClick={handleScan}
                id="fingerprint-scanner"
              >
                <HiOutlineFingerPrint className="login-page__scanner-icon" />
                <span className="login-page__scanner-text">
                  {scanStatus === 'idle' && 'Tap to scan fingerprint'}
                  {scanStatus === 'scanning' && 'Scanning...'}
                  {scanStatus === 'success' && 'Fingerprint verified ✓'}
                  {scanStatus === 'error' && 'Scan failed. Try again.'}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="login-page__actions">
              <Link to="/register" className="login-page__btn login-page__btn--secondary" id="register-btn">
                Register
              </Link>
              <button type="submit" className="login-page__btn login-page__btn--primary" id="login-btn">
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
