import { HiCheck } from 'react-icons/hi2';
import './candidatecard.css';

function CandidateCard({ candidate, isSelected, onSelect }) {
  return (
    <div
      className={`candidate-card ${isSelected ? 'candidate-card--selected' : ''}`}
      onClick={onSelect}
      id={`candidate-${candidate.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      {/* Candidate Photo */}
      <div className="candidate-card__photo">
        <div className="candidate-card__avatar">
          {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
      </div>

      {/* Candidate Info */}
      <div className="candidate-card__info">
        <h4 className="candidate-card__name">{candidate.name}</h4>
        <p className="candidate-card__party">{candidate.party}</p>
      </div>

      {/* Selection Checkbox */}
      <div className={`candidate-card__checkbox ${isSelected ? 'candidate-card__checkbox--checked' : ''}`}>
        {isSelected && <HiCheck />}
      </div>
    </div>
  );
}

export default CandidateCard;
