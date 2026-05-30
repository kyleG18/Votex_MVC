import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCheckBadge, HiOutlineIdentification, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import api from '../api/axios';
import { formatImageUrl } from '../utils/imageUtils';
import './login.css';

function LoginPage() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voter, setVoter] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  const formatStudentId = (value) => {
    if (!value) return '';
    const cleaned = value.toString().replace(/[^0-9]/g, '').slice(0, 7);
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
    if (cleaned.length > 3) formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
    return formatted;
  };

  // Check for existing lockout on load
  useEffect(() => {
    const lockoutUntil = localStorage.getItem('voter_lockout_until');
    if (lockoutUntil) {
      const remaining = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutTimeLeft(remaining);
      } else {
        localStorage.removeItem('voter_lockout_until');
        localStorage.removeItem('voter_failed_attempts');
      }
    }
  }, []);

  // Handle lockout countdown timer
  useEffect(() => {
    if (lockoutTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          localStorage.removeItem('voter_lockout_until');
          localStorage.removeItem('voter_failed_attempts');
          setErrorMsg('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  // Auto-redirect countdown after welcome screen
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
  }, [showWelcome, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (lockoutTimeLeft > 0) {
      setErrorMsg(`Too many failed attempts. Locked out for ${lockoutTimeLeft} seconds.`);
      return;
    }

    if (!studentId) { setErrorMsg('Please enter your Student ID.'); return; }
    if (!password) { setErrorMsg('Please enter your password.'); return; }

    setIsLoading(true);
    try {
      const response = await api.post('/api/voters/login', {
        student_id: studentId.replace(/-/g, '').trim(), // strip dashes and whitespace
        password: password.trim()
      });

      if (response.data.success) {
        localStorage.removeItem('voter_failed_attempts');
        localStorage.removeItem('voter_lockout_until');
        const voterData = {
          ...response.data.student,
          fullName: response.data.student.fullName
        };
        localStorage.setItem('voter', JSON.stringify(voterData));
        setVoter(voterData);
        setTimeout(() => setShowWelcome(true), 300);
      }
    } catch (error) {
      const failedAttempts = parseInt(localStorage.getItem('voter_failed_attempts') || '0') + 1;
      localStorage.setItem('voter_failed_attempts', failedAttempts.toString());

      if (failedAttempts >= 3) {
        const lockoutUntil = Date.now() + 30000; // 30 seconds lockout
        localStorage.setItem('voter_lockout_until', lockoutUntil.toString());
        setLockoutTimeLeft(30);
        setPassword('');
        setErrorMsg('Too many failed login attempts. You are locked out for 30 seconds.');
      } else {
        const attemptsLeft = 3 - failedAttempts;
        setErrorMsg(
          (error.response?.data?.message || 'Invalid Student ID or Password.') +
          ` (Attempt ${failedAttempts}/3. ${attemptsLeft} attempts remaining)`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = () => navigate('/admin-login');

  // ─── WELCOME / IDENTITY CONFIRMATION SCREEN ──────────────────────────────
  if (showWelcome && voter) {
    const initials = voter.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const progress = ((3 - countdown) / 3) * 100;

    return (
      <div className="login-page login-page--welcome">
        <div className="login-page__bg-decor">
          <div className="login-page__bg-circle login-page__bg-circle--1" />
          <div className="login-page__bg-circle login-page__bg-circle--2" />
          <div className="login-page__bg-circle login-page__bg-circle--3" />
        </div>

        <div className="welcome-card">
          <div className="welcome-card__badge-ring">
            <div className="welcome-card__badge">
              <HiOutlineCheckBadge />
            </div>
          </div>

          <p className="welcome-card__logging-text">Identity Confirmed</p>

          <div className="welcome-card__avatar-wrapper">
            {voter.profile_pic ? (
              <img
                src={formatImageUrl(voter.profile_pic)}
                alt={voter.fullName}
                className="welcome-card__avatar-img"
              />
            ) : (
              <div className="welcome-card__avatar">{initials}</div>
            )}
          </div>

          <h1 className="welcome-card__name">{voter.fullName}</h1>

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

          <div className="welcome-card__loader-wrapper">
            <p className="welcome-card__loader-text">
              Redirecting to voting in <strong>{countdown}</strong>...
            </p>
            <div className="welcome-card__loader-track">
              <div className="welcome-card__loader-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN LOGIN SCREEN ────────────────────────────────────────────────────
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
            {/* Student ID */}
            <div className="login-page__field">
              <label className="login-page__label" htmlFor="student-id-input">
                <HiOutlineIdentification /> Student ID
              </label>
              <input
                id="student-id-input"
                type="text"
                className="login-page__input"
                placeholder="e.g. 23-1-2345"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                autoComplete="username"
                autoFocus
                disabled={lockoutTimeLeft > 0}
              />
            </div>

            {/* Password */}
            <div className="login-page__field">
              <label className="login-page__label" htmlFor="student-password-input">
                <HiOutlineLockClosed /> Password
              </label>
              <div className="login-page__input-wrapper">
                <input
                  id="student-password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="login-page__input login-page__input--password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={lockoutTimeLeft > 0}
                />
                <button
                  type="button"
                  className="login-page__eye-btn"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  disabled={lockoutTimeLeft > 0}
                >
                  {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            <div className="login-page__actions" style={{ marginTop: 'var(--space-2)' }}>
              <button
                type="submit"
                className="login-page__btn login-page__btn--primary"
                id="login-btn"
                disabled={isLoading || lockoutTimeLeft > 0}
              >
                {lockoutTimeLeft > 0 ? (
                  `Locked out (${lockoutTimeLeft}s)`
                ) : isLoading ? (
                  <><span className="login-page__spinner" /> Signing In...</>
                ) : (
                  'Sign In to Vote'
                )}
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
