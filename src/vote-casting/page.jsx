import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import CandidateCard from '../Component/candidate-card/candidatecard';
import VoteSummary from '../Component/vote-summary/votesummary';
import data from '../../data.json';
import './page.css';

function VoteCastingPage() {
  const navigate = useNavigate();
  const { positions, candidates } = data;
  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [selections, setSelections] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

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

  const confirmVote = () => {
    navigate('/vote-success');
  };

  const isLastPosition = currentPositionIndex === positions.length - 1;
  const allSelected = Object.keys(selections).filter(k => selections[k]).length === positions.length;

  return (
    <div className="vote-casting">
      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="vote-casting__modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="vote-casting__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="vote-casting__modal-title">Confirm Your Vote</h3>
            <p className="vote-casting__modal-desc">
              You are about to submit your final vote. This action cannot be undone.
            </p>
            <div className="vote-casting__modal-summary">
              {positions.map(pos => {
                const selected = candidates.find(c => c.id === selections[pos]);
                return (
                  <div key={pos} className="vote-casting__modal-item">
                    <span className="vote-casting__modal-pos">{pos}:</span>
                    <span className="vote-casting__modal-name">
                      {selected ? selected.name : 'None'}
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
                Go Back
              </button>
              <button
                className="vote-casting__btn vote-casting__btn--submit"
                onClick={confirmVote}
                id="confirm-vote-btn"
              >
                Submit Vote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="vote-casting__main">
        {/* Header */}
        <div className="vote-casting__header">
          <div>
            <h1 className="vote-casting__title">
              Candidate Selection — <span className="vote-casting__position">{currentPosition}</span>
            </h1>
            <p className="vote-casting__subtitle">
              Select one (1) candidate for the position of <strong>{currentPosition}</strong>
            </p>
          </div>

          {/* Position Steps */}
          <div className="vote-casting__steps">
            {positions.map((pos, idx) => (
              <button
                key={pos}
                className={`vote-casting__step ${idx === currentPositionIndex ? 'vote-casting__step--active' : ''} ${selections[pos] ? 'vote-casting__step--done' : ''}`}
                onClick={() => setCurrentPositionIndex(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate List */}
        <div className="vote-casting__candidates">
          {positionCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              isSelected={selections[currentPosition] === candidate.id}
              onSelect={() => handleSelect(candidate.id)}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="vote-casting__nav">
          <button
            className="vote-casting__btn vote-casting__btn--logout"
            onClick={() => navigate('/login')}
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
              <button
                className="vote-casting__btn vote-casting__btn--submit"
                onClick={handleSubmitVote}
                id="review-submit-btn"
              >
                Review & Submit Vote
              </button>
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

      {/* Vote Summary Sidebar */}
      <aside className="vote-casting__sidebar">
        <VoteSummary
          positions={positions}
          selections={Object.fromEntries(Object.entries(selections).filter(([, v]) => v))}
          candidates={candidates}
        />
      </aside>
    </div>
  );
}

export default VoteCastingPage;
