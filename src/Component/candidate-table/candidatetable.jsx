import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import './candidatetable.css';

function CandidateTable({ candidates, onEdit, onDelete }) {
  return (
    <div className="candidate-table__wrapper">
      <table className="candidate-table" id="candidates-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Candidate Name</th>
            <th>Position</th>
            <th>Party Affiliation</th>
            <th>Voter ID</th>
            <th>Bio Summary</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate, index) => (
            <tr key={candidate.id} style={{ animationDelay: `${index * 0.03}s` }}>
              <td>
                <div className="candidate-table__avatar">
                  {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              </td>
              <td>
                <span className="candidate-table__name">{candidate.name}</span>
              </td>
              <td>{candidate.position}</td>
              <td>
                <span className="candidate-table__party-badge">{candidate.party}</span>
              </td>
              <td>
                <code className="candidate-table__id">{candidate.voterId}</code>
              </td>
              <td>
                <span className="candidate-table__bio">{candidate.bio}</span>
              </td>
              <td>
                <div className="candidate-table__actions">
                  <button
                    className="candidate-table__btn candidate-table__btn--edit"
                    onClick={() => onEdit(candidate)}
                    title="Edit Candidate"
                    id={`edit-candidate-${candidate.id}`}
                  >
                    <HiOutlinePencilSquare />
                  </button>
                  <button
                    className="candidate-table__btn candidate-table__btn--delete"
                    onClick={() => onDelete(candidate.id)}
                    title="Delete Candidate"
                    id={`delete-candidate-${candidate.id}`}
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CandidateTable;
