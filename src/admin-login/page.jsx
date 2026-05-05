import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi2';
import './page.css';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      // Retrieve newly registered credentials from localStorage
      const storedAdminData = localStorage.getItem('votex_new_admin');
      let storedAdmin = null;
      if (storedAdminData) {
        try {
          storedAdmin = JSON.parse(storedAdminData);
        } catch (e) {
          console.error("Error parsing stored admin", e);
        }
      }

      // Check against default super admin credentials
      if (username === 'admin' && password === 'admin123') {
        // Set role to superadmin for the session
        localStorage.setItem('votex_session_role', 'superadmin');
        navigate('/admin/dashboard');
        return;
      }
      
      // Check against newly registered account
      if (storedAdmin && username === storedAdmin.username && password === storedAdmin.password) {
        if (storedAdmin.status === 'pending') {
          setErrorMsg('Your account is pending approval from a Super Admin.');
          setIsLoading(false);
          return;
        } else if (storedAdmin.status === 'approved') {
          // Normal admin login success
          localStorage.setItem('votex_session_role', 'admin');
          navigate('/admin/dashboard');
          return;
        }
      }

      // If we reach here, it's an invalid login
      setErrorMsg('Invalid username or password.');
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="admin-login">
      {/* Background decoration */}
      <div className="admin-login__bg-decor">
        <div className="admin-login__bg-circle admin-login__bg-circle--1" />
        <div className="admin-login__bg-circle admin-login__bg-circle--2" />
        <div className="admin-login__bg-circle admin-login__bg-circle--3" />
      </div>

      <div className="admin-login__container">
        {/* Logo */}
        <div className="admin-login__logo">
          <img src="/jpc-logo.jpg" alt="John Paul College" className="admin-login__logo-img" />
          <h1 className="admin-login__logo-text">VoteX</h1>
          <p className="admin-login__logo-tagline">Election Committee Portal</p>
        </div>

        {/* Login Card */}
        <div className="admin-login__card">
          <div className="admin-login__card-header">
            <div className="admin-login__shield-icon">
              <HiOutlineShieldCheck />
            </div>
            <h2 className="admin-login__title">Admin Log In</h2>
            <p className="admin-login__desc">
              Authorized access only. Enter your administrator credentials.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="admin-login__error" id="admin-login-error">
              {errorMsg}
            </div>
          )}

          <form className="admin-login__form" onSubmit={handleLogin}>
            {/* Username */}
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
              />
            </div>

            {/* Password */}
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
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`admin-login__btn ${isLoading ? 'admin-login__btn--loading' : ''}`}
              id="admin-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="admin-login__spinner" />
                  Authenticating...
                </>
              ) : (
                <>
                  <HiOutlineShieldCheck /> Sign In
                </>
              )}
            </button>
          </form>

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
