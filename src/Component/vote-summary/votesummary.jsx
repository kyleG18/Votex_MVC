import './votesummary.css';

function VoteSummary({ positions, selections, candidates }) {
  return (
    <div className="vote-summary" id="vote-summary">
      <div className="vote-summary__header">
        <h3 className="vote-summary__title">Your Vote Summary</h3>
        <p className="vote-summary__subtitle">Student Council Election 2026</p>
      </div>

      <div className="vote-summary__list">
        {positions.map((position) => {
          const selectedId = selections[position];
          const selectedCandidate = candidates.find(c => c.id === selectedId);

          return (
            <div key={position} className="vote-summary__item">
              <span className="vote-summary__position">{position}</span>
              {selectedCandidate ? (
                <span className="vote-summary__selected">{selectedCandidate.name}</span>
              ) : (
                <span className="vote-summary__empty">—</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="vote-summary__footer">
        <div className="vote-summary__progress">
          <div className="vote-summary__progress-bar">
            <div
              className="vote-summary__progress-fill"
              style={{
                width: `${(Object.keys(selections).length / positions.length) * 100}%`
              }}
            />
          </div>
          <span className="vote-summary__progress-text">
            {Object.keys(selections).length} of {positions.length} selected
          </span>
        </div>
      </div>
    </div>
  );
}

export default VoteSummary;
