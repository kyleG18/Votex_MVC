import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { HiOutlineShieldCheck, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi2';
import './adminLogin.css';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (!username || !password) {
      setErrorMsg('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/admins/login', { username, password });
      
      if (response.data.success) {
        // Save session data (in a real app, use HTTP-only cookies or JWT tokens)
        localStorage.setItem('votex_session_role', response.data.user.role);
        localStorage.setItem('votex_admin_id', response.data.user.id);
        navigate('/admin/dashboard');
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg('Failed to connect to the server.');
      }
    } finally {
      setIsLoading(false);
    }
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


        {/* Login Card */}
        <div className="admin-login__card">
          {/* Logo Moved Inside Card */}
          <div className="admin-login__logo" style={{ marginBottom: 'var(--space-6)' }}>
            <img src="/jpc-logo.jpg" alt="John Paul College" className="admin-login__logo-img" />
            <h1 className="admin-login__logo-text" style={{ color: 'var(--slate-900)' }}>VoteX</h1>
            <p className="admin-login__logo-tagline" style={{ color: 'var(--slate-500)' }}>Election Committee Portal</p>
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
