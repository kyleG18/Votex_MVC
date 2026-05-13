import { useNavigate } from 'react-router-dom';
import { HiOutlineCheckBadge, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import './voteSuccess.css';

function VoteSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="vote-success">
      {/* Background decoration */}
      <div className="vote-success__bg-decor">
        <div className="vote-success__bg-circle vote-success__bg-circle--1" />
        <div className="vote-success__bg-circle vote-success__bg-circle--2" />
        <div className="vote-success__bg-circle vote-success__bg-circle--3" />
      </div>

      {/* Confetti particles */}
      <div className="vote-success__confetti">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="vote-success__confetti-piece"
            style={{
              '--delay': `${Math.random() * 3}s`,
              '--x': `${Math.random() * 100}vw`,
              '--rotation': `${Math.random() * 360}deg`,
              '--size': `${6 + Math.random() * 8}px`,
              '--color': ['#4f46e5', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#6366f1'][i % 6],
            }}
          />
        ))}
      </div>

      <div className="vote-success__container">
        {/* Animated Checkmark */}
        <div className="vote-success__icon-ring">
          <div className="vote-success__icon-circle">
            <HiOutlineCheckBadge className="vote-success__icon" />
          </div>
        </div>

        {/* Message */}
        <h1 className="vote-success__title">Vote Submitted!</h1>
        <p className="vote-success__message">
          Your vote has been recorded securely using biometric verification.
          Thank you for participating in the <strong>Student Council Election 2026</strong>.
        </p>

        {/* Receipt */}
        <div className="vote-success__receipt">
          <div className="vote-success__receipt-header">
            <span className="vote-success__receipt-label">Transaction ID</span>
            <span className="vote-success__receipt-value">
              VTX-{Date.now().toString(36).toUpperCase()}
            </span>
          </div>
          <div className="vote-success__receipt-row">
            <span>Date & Time</span>
            <span>{new Date().toLocaleString('en-PH', { 
              dateStyle: 'medium', 
              timeStyle: 'short' 
            })}</span>
          </div>
          <div className="vote-success__receipt-row">
            <span>Status</span>
            <span className="vote-success__receipt-status">✓ Verified & Recorded</span>
          </div>
        </div>

        {/* Info */}
        <p className="vote-success__info">
          🔒 Your vote is anonymous and encrypted. No one can trace your ballot.
        </p>

        {/* Action */}
        <button
          className="vote-success__btn"
          onClick={() => navigate('/login')}
          id="return-to-login-btn"
        >
          <HiOutlineArrowRightOnRectangle /> Return to Login
        </button>
      </div>
    </div>
  );
}

export default VoteSuccessPage;
