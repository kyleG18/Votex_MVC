import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './page.css';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // Simulate registration
    navigate('/login');
  };

  return (
    <div className="register-page">
      {/* Background decoration */}
      <div className="register-page__bg-decor">
        <div className="register-page__bg-circle register-page__bg-circle--1" />
        <div className="register-page__bg-circle register-page__bg-circle--2" />
      </div>

      <div className="register-page__container">


        {/* Register Card */}
        <div className="register-page__card">
          {/* Logo Moved Inside Card */}
          <div className="register-page__logo" style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'center' }}>
            <img src="/jpc-logo.jpg" alt="John Paul College" className="register-page__logo-img" />
          </div>
          


          <form className="register-page__form" onSubmit={handleSubmit}>
            {/* Name */}
            <div className="register-page__field">
              <label className="register-page__label" htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className={`register-page__input ${errors.name ? 'register-page__input--error' : ''}`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && <span className="register-page__error">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="register-page__field">
              <label className="register-page__label" htmlFor="reg-email">Email</label>
              <input
                type="email"
                id="reg-email"
                name="email"
                className={`register-page__input ${errors.email ? 'register-page__input--error' : ''}`}
                placeholder="student@jpc.edu.ph"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <span className="register-page__error">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="register-page__field">
              <label className="register-page__label" htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`register-page__input ${errors.password ? 'register-page__input--error' : ''}`}
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <span className="register-page__error">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="register-page__field">
              <label className="register-page__label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`register-page__input ${errors.confirmPassword ? 'register-page__input--error' : ''}`}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <span className="register-page__error">{errors.confirmPassword}</span>}
            </div>

            {/* Actions */}
            <div className="register-page__actions">
              <Link to="/login" className="register-page__link">Already registered?</Link>
              <button type="submit" className="register-page__btn" id="register-submit-btn">
                Register
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
