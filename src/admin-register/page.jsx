import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineKey, HiOutlineUser, HiOutlineLockClosed } from 'react-icons/hi2';
import './page.css';

function AdminRegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    authKey: ''
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.fullName || !formData.username || !formData.password || !formData.authKey) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    // Simulate server delay
    setTimeout(() => {
      // Validate Authorization Key first
      const SECRET_AUTH_KEY = 'JPC-ADMIN-2026';

      if (formData.authKey !== SECRET_AUTH_KEY) {
        setErrorMsg('Invalid Authorization Key. You are not authorized to apply for an admin account.');
        setIsLoading(false);
        return;
      }

      // Create pending admin object
      const newAdmin = {
        fullName: formData.fullName,
        username: formData.username,
        password: formData.password,
        status: 'pending',
        dateApplied: new Date().toLocaleDateString()
      };

      // Save to localStorage
      localStorage.setItem('votex_new_admin', JSON.stringify(newAdmin));
      
      setSuccessMsg('Registration submitted! Please wait for a Super Admin to approve your account.');
      
      setTimeout(() => {
        navigate('/admin-login');
      }, 3000);

    }, 1500);
  };

  return (
    <div className="admin-register">
      {/* Background decoration (Dark Theme) */}
      <div className="admin-register__bg-decor">
        <div className="admin-register__bg-circle admin-register__bg-circle--1" />
        <div className="admin-register__bg-circle admin-register__bg-circle--2" />
      </div>

      <div className="admin-register__container">
        {/* Logo */}
        <div className="admin-register__logo">
          <img src="/jpc-logo.jpg" alt="John Paul College" className="admin-register__logo-img" />
          <h1 className="admin-register__logo-text">VoteX</h1>
        </div>

        {/* Register Card */}
        <div className="admin-register__card">
          <div className="admin-register__card-header">
            <div className="admin-register__shield-icon">
              <HiOutlineShieldCheck />
            </div>
            <h2 className="admin-register__title">Admin Registration</h2>
            <p className="admin-register__desc">
              Enter your details and the administrative setup key. A Super Admin must approve your request before you can log in.
            </p>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="admin-register__alert admin-register__alert--error">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="admin-register__alert admin-register__alert--success">
              {successMsg}
            </div>
          )}

          <form className="admin-register__form" onSubmit={handleRegister}>
            {/* Full Name */}
            <div className="admin-register__field">
              <label className="admin-register__label">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="admin-register__input"
                placeholder="e.g., Juan Dela Cruz"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            {/* Username */}
            <div className="admin-register__field">
              <label className="admin-register__label">
                <HiOutlineUser /> Desired Username
              </label>
              <input
                type="text"
                name="username"
                className="admin-register__input"
                placeholder="e.g., jdelacruz_admin"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div className="admin-register__field">
              <label className="admin-register__label">
                <HiOutlineLockClosed /> Password
              </label>
              <input
                type="password"
                name="password"
                className="admin-register__input"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {/* Authorization Key (Crucial Security Step) */}
            <div className="admin-register__field admin-register__field--highlight">
              <label className="admin-register__label">
                <HiOutlineKey className="admin-register__key-icon" /> Authorization Setup Key
              </label>
              <p className="admin-register__hint">Required. Contact the Election Committee if you do not have this key.</p>
              <input
                type="password"
                name="authKey"
                className="admin-register__input admin-register__input--key"
                placeholder="Enter secret setup key"
                value={formData.authKey}
                onChange={handleChange}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`admin-register__btn ${isLoading ? 'admin-register__btn--loading' : ''}`}
              disabled={isLoading || successMsg}
            >
              {isLoading ? (
                <>
                  <span className="admin-register__spinner" />
                  Verifying Key...
                </>
              ) : (
                'Verify & Register'
              )}
            </button>
          </form>

          {/* Back to admin login */}
          <div className="admin-register__footer">
            <Link to="/admin-login" className="admin-register__back-link">
              ← Back to Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminRegisterPage;
