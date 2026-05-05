import { useState } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlinePlusCircle, HiOutlineXMark } from 'react-icons/hi2';
import CandidateTable from '../Component/candidate-table/candidatetable';
import data from '../../data.json';
import './page.css';

function ManageCandidatesPage() {
  const [candidates, setCandidates] = useState(data.candidates);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [formData, setFormData] = useState({
    name: '', position: 'President', party: '', voterId: '', bio: '',
  });

  // Filter candidates by search query
  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.party.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openAddModal = () => {
    setEditingCandidate(null);
    setFormData({ name: '', position: 'President', party: '', voterId: '', bio: '' });
    setShowModal(true);
  };

  const openEditModal = (candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name,
      position: candidate.position,
      party: candidate.party,
      voterId: candidate.voterId,
      bio: candidate.bio,
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      setCandidates(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCandidate) {
      // Update
      setCandidates(prev => prev.map(c =>
        c.id === editingCandidate.id ? { ...c, ...formData } : c
      ));
    } else {
      // Create
      const newCandidate = {
        id: Date.now(),
        ...formData,
        votes: 0,
      };
      setCandidates(prev => [...prev, newCandidate]);
    }
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="manage-candidates" id="manage-candidates-page">
      {/* Modal */}
      {showModal && (
        <div className="manage-candidates__modal-overlay" onClick={() => setShowModal(false)}>
          <div className="manage-candidates__modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-candidates__modal-header">
              <h3>{editingCandidate ? 'Edit Candidate' : 'Add Candidate'}</h3>
              <button className="manage-candidates__modal-close" onClick={() => setShowModal(false)}>
                <HiOutlineXMark />
              </button>
            </div>
            <form className="manage-candidates__modal-form" onSubmit={handleSubmit}>
              <div className="manage-candidates__form-grid">
                <div className="manage-candidates__field">
                  <label htmlFor="cand-name">Full Name</label>
                  <input type="text" id="cand-name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="manage-candidates__field">
                  <label htmlFor="cand-position">Position</label>
                  <select id="cand-position" name="position" value={formData.position} onChange={handleChange}>
                    {data.positions.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="manage-candidates__field">
                  <label htmlFor="cand-party">Party Affiliation</label>
                  <input type="text" id="cand-party" name="party" value={formData.party} onChange={handleChange} required />
                </div>
                <div className="manage-candidates__field">
                  <label htmlFor="cand-voterId">Voter ID</label>
                  <input type="text" id="cand-voterId" name="voterId" value={formData.voterId} onChange={handleChange} required />
                </div>
              </div>
              <div className="manage-candidates__field">
                <label htmlFor="cand-bio">Bio Summary</label>
                <textarea id="cand-bio" name="bio" value={formData.bio} onChange={handleChange} rows="3" />
              </div>
              <div className="manage-candidates__modal-actions">
                <button type="button" className="manage-candidates__btn--cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="manage-candidates__btn--save" id="save-candidate-btn">
                  {editingCandidate ? 'Save Changes' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="manage-candidates__header">
        <div>
          <h1 className="manage-candidates__title">Manage Candidates</h1>
          <p className="manage-candidates__subtitle">
            Showing {paginatedCandidates.length} of {filteredCandidates.length} candidates
          </p>
        </div>

        <div className="manage-candidates__toolbar">
          {/* Search */}
          <div className="manage-candidates__search">
            <HiOutlineMagnifyingGlass className="manage-candidates__search-icon" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="manage-candidates__search-input"
              id="search-candidates-input"
            />
          </div>

          {/* Add Button */}
          <button className="manage-candidates__add-btn" onClick={openAddModal} id="add-candidate-btn">
            <HiOutlinePlusCircle /> Add Candidate
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="manage-candidates__table-container">
        <CandidateTable
          candidates={paginatedCandidates}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="manage-candidates__pagination">
          <button
            className="manage-candidates__page-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`manage-candidates__page-btn ${currentPage === i + 1 ? 'manage-candidates__page-btn--active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="manage-candidates__page-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default ManageCandidatesPage;
