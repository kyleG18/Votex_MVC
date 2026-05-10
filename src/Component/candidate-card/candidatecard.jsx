import { HiCheck } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import './candidatecard.css';

/**
 * Premium Candidate Card component for the VoteX system.
 * Features: 
 * - Glassmorphism design
 * - Framer Motion animations
 * - Responsive flex layout
 * - Initials fallback for avatars
 */
function CandidateCard({ candidate, isSelected, onSelect, animationDelay = 0 }) {
  
  // Helper to generate initials from candidate name
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isSelected ? 1.02 : 1,
        backgroundColor: isSelected ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0.8)"
      }}
      transition={{ 
        duration: 0.5, 
        delay: animationDelay,
        ease: [0.16, 1, 0.3, 1] 
      }}
      className={`candidate-card ${isSelected ? 'candidate-card--selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      whileHover={{ 
        y: isSelected ? -7 : -5, 
        scale: isSelected ? 1.025 : 1.01,
        transition: { duration: 0.25, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.96 }}
    >
      {/* Left Section: Profile Avatar */}
      <div className="candidate-card__avatar-section">
        <div className="candidate-card__avatar-container">
          <AnimatePresence>
            {isSelected && (
              <motion.div 
                className="candidate-card__avatar-ring"
                initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                animate={{ opacity: 1, scale: 1.1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            )}
          </AnimatePresence>
          
          {candidate.image_url ? (
            <img 
              src={candidate.image_url} 
              alt={candidate.name} 
              className="candidate-card__avatar-image" 
            />
          ) : (
            <div className="candidate-card__avatar-fallback">
              {getInitials(candidate.name)}
            </div>
          )}
          {/* Subtle glass reflection overlay */}
          <div className="candidate-card__avatar-overlay" />
        </div>
      </div>

      {/* Center Section: Candidate Information */}
      <div className="candidate-card__info-section">
        <div className="candidate-card__name-row">
          <h4 className="candidate-card__name">{candidate.name}</h4>
          {candidate.party && (
            <span className="candidate-card__partylist-badge">
              {candidate.party}
            </span>
          )}
        </div>
        <p className="candidate-card__tagline">
          {candidate.bio || candidate.slogan || "Empowering the student body through dedicated leadership and service."}
        </p>
      </div>

      <div className="candidate-card__action-section">
        <motion.div 
          className={`candidate-card__selector ${isSelected ? 'candidate-card__selector--active' : ''}`}
          animate={isSelected ? { 
            scale: [1, 1.2, 1],
            transition: { duration: 0.4, ease: "easeInOut" } 
          } : { scale: 1 }}
        >
          <AnimatePresence mode="wait">
            {isSelected && (
              <motion.div
                key="check"
                initial={{ scale: 0, opacity: 0, rotate: -90 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0, rotate: 90 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="candidate-card__check-icon"
              >
                <HiCheck strokeWidth={1} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Modern Selection Background Glow */}
      {isSelected && (
        <motion.div 
          layoutId="active-highlight"
          className="candidate-card__active-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
}

export default CandidateCard;
