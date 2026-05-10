import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineClipboardDocumentList, HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineUserCircle } from 'react-icons/hi2';
import './votesummary.css';

/**
 * Advanced Premium Vote Summary Sidebar.
 * Features:
 * - Circular SVG progress indicator
 * - Candidate avatars in live preview
 * - Glassmorphism UI
 * - Framer Motion entry/update animations
 */
function VoteSummary({ positions, selections, candidates, onJump, currentIndex }) {
  const selectedCount = Object.keys(selections).filter(k => selections[k] !== undefined).length;
  const progressPercent = Math.round((selectedCount / positions.length) * 100);
  
  // Progress Circle Constants
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="vote-summary-panel">
      {/* 1. Header Section with Circular Progress */}
      <div className="vote-summary-panel__header">
        <div className="vote-summary-panel__header-content">
          <div className="vote-summary-panel__title-area">
            <HiOutlineClipboardDocumentList className="vote-summary-panel__title-icon" />
            <div>
              <h3 className="vote-summary-panel__title">Election Progress</h3>
              <p className="vote-summary-panel__subtitle">Student Council 2026</p>
            </div>
          </div>
          
          <div className="vote-summary-panel__progress-circle">
            <svg width="60" height="60">
              <circle
                className="progress-circle-bg"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
                fill="transparent"
                r={radius}
                cx="30"
                cy="30"
              />
              <motion.circle
                className="progress-circle-fill"
                stroke="white"
                strokeWidth="4"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx="30"
                cy="30"
              />
            </svg>
            <span className="progress-circle-text">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* 2. Completion Status Bar */}
      <div className="vote-summary-panel__status">
        <div className="vote-summary-panel__status-row">
          <HiOutlineChartBar />
          <span>{selectedCount} of {positions.length} Positions Voted</span>
        </div>
        <div className="vote-summary-panel__bar-bg">
          <motion.div 
            className="vote-summary-panel__bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "anticipate" }}
          />
        </div>
      </div>

      {/* 3. Live Ballot Preview */}
      <div className="vote-summary-panel__ballot">
        <div className="vote-summary-panel__section-header">
          <span>YOUR BALLOT PREVIEW</span>
        </div>

        <div className="vote-summary-panel__list">
          {positions.map((pos, idx) => {
            const selectedId = selections[pos];
            const candidate = candidates.find(c => c.id === selectedId);
            const isActive = currentIndex === idx;

            return (
              <motion.div 
                key={pos} 
                className={`vote-summary-panel__item ${isActive ? 'active' : ''} ${selectedId ? 'selected' : ''}`}
                onClick={() => onJump && onJump(idx)}
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              >
                <div className="vote-summary-panel__item-main">
                  <div className="vote-summary-panel__avatar-mini">
                    {candidate ? (
                      candidate.image_url ? (
                        <img src={candidate.image_url} alt="" />
                      ) : (
                        <div className="avatar-fallback-mini">
                          {candidate.name.split(' ').map(n=>n[0]).join('').slice(0,1)}
                        </div>
                      )
                    ) : (
                      <HiOutlineUserCircle className="avatar-empty-icon" />
                    )}
                  </div>
                  <div className="vote-summary-panel__item-info">
                    <span className="vote-summary-panel__item-pos">{pos}</span>
                    <span className="vote-summary-panel__item-name">
                      {candidate ? candidate.name : 'Pending Selection...'}
                    </span>
                  </div>
                </div>
                {selectedId && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="vote-summary-panel__check"
                  >
                    <HiOutlineCheckCircle />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VoteSummary;
