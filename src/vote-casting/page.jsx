import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import CandidateCard from '../Component/candidate-card/candidatecard';
import VoteSummary from '../Component/vote-summary/votesummary';
import './page.css';

const API = 'http://localhost:5000';

function VoteCastingPage() {
  const navigate = useNavigate();
  const [voter, setVoter] = useState(null);

  const formatStudentId = (value) => {
    if (!value) return '';
    const cleaned = value.toString().replace(/[^0-9]/g, '').slice(0, 7);
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
    }
    if (cleaned.length > 3) {
      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
    }
    return formatted;
  };
  
  const [positions, setPositions] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [selections, setSelections] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    // Check if voter is logged in
    const storedVoter = localStorage.getItem('voter');
    if (!storedVoter) {
      navigate('/login');
      return;
    }
    setVoter(JSON.parse(storedVoter));

    // Fetch Candidates and Positions
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/api/candidates`);
        if (res.data.success) {
          const fetchedCandidates = res.data.candidates.map(c => ({
            id: c.id,
            name: `${c.first_name} ${c.last_name}`,
            position: c.position,
            party: c.partylist,
            course: c.course,
            bio: c.bio,
            image_url: c.image_url ? `${API}${c.image_url}` : null
          }));
          
          setCandidates(fetchedCandidates);
          
          // Extract unique positions from candidates and sort them
          const POSITION_ORDER = [
            'President',
            'Vice President',
            'Secretary',
            'Treasurer',
            'Auditor',
            'P.R.O.',
            'Business Manager',
            'Peace Officer',
            'Representative',
            '1st Year Representative',
            '2nd Year Representative',
            '3rd Year Representative',
            '4th Year Representative'
          ];

          const uniquePositions = [...new Set(fetchedCandidates.map(c => c.position))].sort((a, b) => {
            const indexA = POSITION_ORDER.indexOf(a);
            const indexB = POSITION_ORDER.indexOf(b);
            
            // If position not in list, put at the end
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            
            return indexA - indexB;
          });

          // If no candidates, use some default positions or empty
          if (uniquePositions.length > 0) {
            setPositions(uniquePositions);
          } else {
            // Fallback if DB is completely empty but user somehow reached here
            setPositions(['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor']);
          }
        }
      } catch (err) {
        console.error('Failed to fetch candidates', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) {
    return <div className="vote-casting" style={{ padding: '2rem', textAlign: 'center' }}>Loading ballot...</div>;
  }

  if (positions.length === 0) {
    return (
      <div className="vote-casting">
        <div className="vote-casting__header">
          <h1 className="vote-casting__title">No Candidates Found</h1>
          <p className="vote-casting__subtitle">The election administrator has not added any candidates yet.</p>
        </div>
      </div>
    );
  }

  const currentPosition = positions[currentPositionIndex];
  const positionCandidates = candidates.filter(c => c.position === currentPosition);

  const handleSelect = (candidateId) => {
    setSelections(prev => ({
      ...prev,
      [currentPosition]: prev[currentPosition] === candidateId ? undefined : candidateId,
    }));
  };

  const handleNext = () => {
    if (currentPositionIndex < positions.length - 1) {
      setCurrentPositionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPositionIndex > 0) {
      setCurrentPositionIndex(prev => prev - 1);
    }
  };

  const handleSubmitVote = () => {
    setShowConfirm(true);
  };

  const confirmVote = async () => {
    setSubmitError('');
    try {
      const response = await axios.post(`${API}/api/votes`, {
        student_id: voter.id, // The internal DB id of the student
        selections
      });

      if (response.data.success) {
        // Clear session so they can't vote again
        localStorage.removeItem('voter');
        navigate('/vote-success');
      }
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Failed to cast vote. Please try again or ask for help.');
    }
  };

  const isLastPosition = currentPositionIndex === positions.length - 1;
  const allSelected = Object.keys(selections).filter(k => selections[k]).length === positions.length;

  return (
    <div className="vote-casting">
      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            className="vote-casting__modal-overlay" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div 
              className="vote-casting__modal" 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="vote-casting__modal-title">Review Your Ballot</h3>
              <p className="vote-casting__modal-desc">
                Please double-check your selections. This action is final and cannot be modified after submission.
              </p>
              
              {submitError && (
                <div style={{ color: 'red', marginBottom: '1rem', padding: '12px', background: '#fee2e2', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '500' }}>
                  {submitError}
                </div>
              )}

              <div className="vote-casting__modal-summary">
                {positions.map(pos => {
                  const selected = candidates.find(c => c.id === selections[pos]);
                  return (
                    <div key={pos} className="vote-casting__modal-item">
                      <span className="vote-casting__modal-pos">{pos}</span>
                      <span className="vote-casting__modal-name">
                        {selected ? selected.name : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="vote-casting__modal-actions">
                <button
                  className="vote-casting__btn vote-casting__btn--secondary"
                  onClick={() => setShowConfirm(false)}
                >
                  Review Again
                </button>
                <button
                  className="vote-casting__btn vote-casting__btn--submit"
                  onClick={confirmVote}
                  id="confirm-vote-btn"
                >
                  Confirm & Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="vote-casting__main">
        {/* Premium Header Area */}
        <div className="vote-casting__header-section">
          <div className="vote-casting__title-group">
            <div className="vote-casting__badge">Election 2026</div>
            <h1 className="vote-casting__title">
              Candidate Selection
            </h1>
            <div className="vote-casting__current-position">
              <span className="position-dot"></span>
              Current Stage: <strong>{currentPosition}</strong>
            </div>
            <p className="vote-casting__instruction">
              Choose your representative for <strong>{currentPosition}</strong> below.
            </p>
          </div>

          <div className="vote-casting__voter-profile">
            <div className="voter-profile__details">
              <span className="voter-profile__name">{voter?.fullName || 'Voter Name'}</span>
              <span className="voter-profile__id">ID: {formatStudentId(voter?.student_id) || '00-0-0000'}</span>
            </div>
            <div className="voter-profile__avatar">
              {voter?.profile_pic ? (
                <img 
                  src={`${API}${voter.profile_pic}`} 
                  alt={voter.fullName} 
                  className="voter-profile__image" 
                />
              ) : (
                <span className="voter-profile__initials">
                  {voter?.fullName ? voter.fullName.split(' ').map(n=>n[0]).join('').slice(0,2) : 'V'}
                </span>
              )}
              <div className="voter-profile__status-dot"></div>
            </div>
          </div>
        </div>

        {/* Modern Stepper Pagination */}
        <div className="vote-casting__stepper-container">
          <div className="vote-casting__stepper">
            {/* Background progress track */}
            <div className="vote-casting__stepper-track">
              <motion.div 
                className="vote-casting__stepper-track-fill"
                initial={{ width: "0%" }}
                animate={{ 
                  width: positions.length > 1 
                    ? `${(currentPositionIndex / (positions.length - 1)) * 100}%` 
                    : "100%" 
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            {positions.map((pos, idx) => {
              const isActive = idx === currentPositionIndex;
              const isCompleted = selections[pos] !== undefined;
              
              const shortLabel = pos.includes('Grade') ? pos.replace('Grade ', 'G') : pos.split(' ')[0];

              return (
                <div 
                  key={pos} 
                  className={`vote-casting__stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => isCompleted || idx < currentPositionIndex ? setCurrentPositionIndex(idx) : null}
                >
                  <div className="vote-casting__stepper-circle-wrapper">
                    <motion.div 
                      className="vote-casting__stepper-circle"
                      animate={{
                        scale: isActive ? 1.15 : 1,
                        backgroundColor: isCompleted ? "var(--primary-600)" : (isActive ? "var(--primary-100)" : "var(--bg-surface)"),
                        borderColor: isCompleted ? "var(--primary-600)" : (isActive ? "var(--primary-500)" : "var(--slate-300)"),
                        boxShadow: isActive ? "0 0 20px rgba(79, 70, 229, 0.4)" : "none"
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <AnimatePresence mode="wait">
                        {isCompleted ? (
                          <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="vote-casting__stepper-check"
                          >
                            ✓
                          </motion.div>
                        ) : (
                          <motion.span 
                            key="number"
                            animate={{ color: isActive ? "var(--primary-600)" : "var(--slate-500)" }}
                          >
                            {idx + 1}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    
                    {isActive && (
                      <motion.div 
                        layoutId="active-stepper-pulse"
                        className="vote-casting__stepper-pulse"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 0.4, 0], scale: [1, 1.5, 2] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      />
                    )}
                  </div>
                  <div className="vote-casting__stepper-info">
                    <span className="vote-casting__stepper-label">{shortLabel}</span>
                    {isActive && <span className="vote-casting__stepper-current-tag">Voting</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Candidate Grid */}
        <div className="vote-casting__grid">
          {positionCandidates.length > 0 ? (
            positionCandidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                isSelected={selections[currentPosition] === candidate.id}
                onSelect={() => handleSelect(candidate.id)}
                animationDelay={index * 0.1}
              />
            ))
          ) : (
            <div className="vote-casting__empty-state">
              <p>No candidates available for {currentPosition}. You can skip this position.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="vote-casting__nav">
          <button
            className="vote-casting__btn vote-casting__btn--logout"
            onClick={() => { localStorage.removeItem('voter'); navigate('/login'); }}
            id="voter-logout-btn"
          >
            <HiOutlineArrowRightOnRectangle /> Log Out
          </button>

          <div className="vote-casting__nav-arrows">
            <button
              className="vote-casting__btn vote-casting__btn--secondary"
              onClick={handlePrev}
              disabled={currentPositionIndex === 0}
            >
              <HiOutlineArrowLeft /> Previous
            </button>

            {isLastPosition ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-1)' }}>
                <button
                  className="vote-casting__btn vote-casting__btn--submit"
                  onClick={handleSubmitVote}
                  id="review-submit-btn"
                  disabled={!allSelected}
                  style={!allSelected ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  Review & Submit Vote
                </button>
                {!allSelected && (
                  <span style={{ fontSize: '12px', color: 'var(--danger-500)', fontWeight: '500' }}>
                    *You must cast a vote for all positions before submitting.
                  </span>
                )}
              </div>
            ) : (
              <button
                className="vote-casting__btn vote-casting__btn--primary"
                onClick={handleNext}
              >
                Next <HiOutlineArrowRight />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Summary */}
      <div className="vote-casting__sidebar">
        <VoteSummary
          positions={positions}
          selections={selections}
          candidates={candidates}
          onJump={(index) => setCurrentPositionIndex(index)}
          currentIndex={currentPositionIndex}
        />
      </div>
    </div>
  );
}

export default VoteCastingPage;
