import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { HiOutlineShieldCheck, HiOutlineKey, HiOutlineUser, HiOutlineLockClosed, HiOutlineIdentification, HiOutlineCheckCircle } from 'react-icons/hi2';
import './adminRegister.css';

function AdminRegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    authKey: '',
    rfid_uid: ''
  });
  const rfidInputRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.fullName || !formData.username || !formData.password || !formData.authKey || !formData.rfid_uid) {
      setErrorMsg('Please fill in all fields and scan your RFID card.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/api/admins/register', formData);
      
      setSuccessMsg(response.data.message);
      
      setTimeout(() => {
        navigate('/admin-login');
      }, 3000);
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg('Failed to connect to the server. Please ensure the backend is running.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-register">
      {/* Background decoration (Dark Theme) */}
      <div className="admin-register__bg-decor">
        <div className="admin-register__bg-circle admin-register__bg-circle--1" />
        <div className="admin-register__bg-circle admin-register__bg-circle--2" />
      </div>

      <div className="admin-register__container">


        {/* Register Card */}
        <div className="admin-register__card">
          {/* Logo Moved Inside Card */}
          <div className="admin-register__logo" style={{ marginBottom: 'var(--space-6)' }}>
            <img src="/jpc-logo.jpg" alt="John Paul College" className="admin-register__logo-img" />
            <h1 className="admin-register__logo-text" style={{ color: 'var(--slate-900)', marginBottom: '0' }}>VoteX</h1>
            <p className="admin-register__logo-tagline" style={{ color: 'var(--slate-500)', marginTop: '4px', textAlign: 'center', fontSize: 'var(--font-size-sm)' }}>Admin Registration</p>
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

            {/* RFID Scanner */}
            <div className={`admin-register__rfid-field ${formData.rfid_uid ? 'admin-register__rfid-field--success' : ''}`}>
              <label className="admin-register__label">
                <HiOutlineIdentification className="admin-register__key-icon" /> Smart Card Registration (Tap card now)
              </label>
              <div className="admin-register__rfid-input-wrapper">
                <HiOutlineIdentification className="icon" />
                <input 
                  type="text" 
                  ref={rfidInputRef} 
                  placeholder="Waiting for scan…"
                  name="rfid_uid"
                  value={formData.rfid_uid}
                  onChange={handleChange}
                  className="admin-register__rfid-input"
                  autoFocus 
                />
                {formData.rfid_uid && <HiOutlineCheckCircle className="success-icon" />}
              </div>
              <p className="admin-register__hint">
                {formData.rfid_uid ? `Card Linked: ${formData.rfid_uid}` : 'Click here then tap your Admin RFID card.'}
              </p>
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
