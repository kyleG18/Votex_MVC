import { useState, useEffect } from 'react';
import {
  HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare,
  HiOutlineXMark, HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import axios from 'axios';
import data from '../../data.json';
import './manageCandidates.css';

const API = 'http://localhost:5000';

function ManageCandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPosition, setFilterPosition] = useState('all');

  // Add Candidate modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', position: 'President', partylist: '', course: '', student_id: '', bio: '', image_url: null
  });
  const [addMsg, setAddMsg] = useState({ text: '', type: '' });

  // Edit Drawer
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [editData, setEditData] = useState({});
  const [editPreview, setEditPreview] = useState(null);
  const [editMsg, setEditMsg] = useState({ text: '', type: '' });

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API}/api/candidates`);
      if (res.data.success) setCandidates(res.data.candidates);
    } catch (err) { console.error('Fetch error:', err.message); }
  };

  /* ─── ADD CANDIDATE ──────────────────────── */
  const handleAdd = async (e) => {
    e.preventDefault();
    setAddMsg({ text: '', type: '' });
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v !== null && v !== '') data.append(k, v); });
      
      const res = await axios.post(`${API}/api/candidates`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setAddMsg({ text: res.data.message, type: 'success' });
        setFormData({ first_name: '', last_name: '', position: 'President', partylist: '', course: '', student_id: '', bio: '', image_url: null });
        setProfilePreview(null);
        fetchCandidates();
        setTimeout(() => { setShowAddModal(false); setAddMsg({ text: '', type: '' }); }, 1800);
      }
    } catch (err) {
      setAddMsg({ text: err.response?.data?.message || 'Error adding candidate.', type: 'error' });
    }
  };

  const handleProfilePicChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) { 
      if (isEdit) {
        setEditData(p => ({ ...p, image_url: file })); 
        setEditPreview(URL.createObjectURL(file));
      } else {
        setFormData(p => ({ ...p, image_url: file })); 
        setProfilePreview(URL.createObjectURL(file)); 
      }
    }
  };

  /* ─── DELETE CANDIDATE ───────────────────── */
  const askDelete = (candidate, e) => {
    e.stopPropagation();
    setDeleteTarget({ id: candidate.id, name: `${candidate.first_name} ${candidate.last_name}` });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API}/api/candidates/${deleteTarget.id}`);
      if (selectedCandidate?.id === deleteTarget.id) setSelectedCandidate(null);
      setDeleteTarget(null);
      fetchCandidates();
    } catch (err) {
      console.error('Delete error:', err.response?.data || err.message);
      setDeleteTarget(null);
    }
  };

  /* ─── EDIT DRAWER ────────────────────────── */
  const openEdit = (candidate) => {
    setSelectedCandidate(candidate);
    setEditData({
      first_name: candidate.first_name || '',
      last_name: candidate.last_name || '',
      position: candidate.position || 'President',
      partylist: candidate.partylist || '',
      course: candidate.course || '',
      student_id: candidate.student_id || '',
      bio: candidate.bio || '',
      image_url: null
    });
    setEditPreview(candidate.image_url ? `${API}${candidate.image_url}` : null);
    setEditMsg({ text: '', type: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditMsg({ text: '', type: '' });
    try {
      const data = new FormData();
      data.append('first_name', editData.first_name);
      data.append('last_name', editData.last_name);
      data.append('position', editData.position);
      data.append('partylist', editData.partylist);
      data.append('course', editData.course);
      data.append('student_id', editData.student_id);
      data.append('bio', editData.bio);
      if (editData.image_url) data.append('image_url', editData.image_url);

      const res = await axios.put(`${API}/api/candidates/${selectedCandidate.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setEditMsg({ text: '✓ Changes saved successfully!', type: 'success' });
        fetchCandidates();
        setTimeout(() => setSelectedCandidate(null), 1500);
      }
    } catch (err) {
      setEditMsg({ text: err.response?.data?.message || 'Update failed.', type: 'error' });
    }
  };

  /* ─── FILTER & SEARCH ────────────────────── */
  const filteredCandidates = candidates.filter(c => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      (c.student_id && c.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.partylist && c.partylist.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterPosition === 'all' || c.position === filterPosition;
    return matchesSearch && matchesFilter;
  });

  /* ─── PAGINATION ─────────────────────────── */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = filteredCandidates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="manage-candidates" id="manage-candidates-page">
      
      {/* ─── CUSTOM DELETE CONFIRM MODAL ───── */}
      {deleteTarget && (
        <div className="mc-confirm-overlay">
          <div className="mc-confirm">
            <div className="mc-confirm__icon"><HiOutlineExclamationTriangle /></div>
            <h3 className="mc-confirm__title">Delete Candidate?</h3>
            <p className="mc-confirm__msg">
              You are about to permanently remove <strong>{deleteTarget.name}</strong> from the election.
              This action cannot be undone.
            </p>
            <div className="mc-confirm__actions">
              <button className="mc-confirm__cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="mc-confirm__delete" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD MODAL ───────────────────────── */}
      {showAddModal && (
        <div className="mc-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="mc-modal" onClick={e => e.stopPropagation()}>
            <div className="mc-modal__header">
              <h2>Add New Candidate</h2>
              <button onClick={() => setShowAddModal(false)} className="mc-modal__close"><HiOutlineXMark /></button>
            </div>

            {addMsg.text && (
              <div className={`mc-alert mc-alert--${addMsg.type}`}>{addMsg.text}</div>
            )}

            <form onSubmit={handleAdd} className="mc-form">
              <div className="mc-form-grid">
                <div className="mc-form-group">
                  <label>First Name</label>
                  <input type="text" required value={formData.first_name} onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div className="mc-form-group">
                  <label>Last Name</label>
                  <input type="text" required value={formData.last_name} onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))} />
                </div>
                <div className="mc-form-group">
                  <label>Position</label>
                  <input type="text" list="positions-list" required value={formData.position} onChange={e => setFormData(p => ({ ...p, position: e.target.value }))} placeholder="Select or type new position..." />
                  <datalist id="positions-list">
                    {data.positions.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>
                <div className="mc-form-group">
                  <label>Party Affiliation</label>
                  <input type="text" required value={formData.partylist} onChange={e => setFormData(p => ({ ...p, partylist: e.target.value }))} />
                </div>
                <div className="mc-form-group">
                  <label>Course</label>
                  <input type="text" required value={formData.course} onChange={e => setFormData(p => ({ ...p, course: e.target.value }))} />
                </div>
                <div className="mc-form-group">
                  <label>Student ID</label>
                  <input type="text" required value={formData.student_id} onChange={e => setFormData(p => ({ ...p, student_id: e.target.value }))} />
                </div>
              </div>

              <div className="mc-form-group mc-form-group--full">
                <label>Bio Summary</label>
                <textarea rows="3" value={formData.bio} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}></textarea>
              </div>

              <div className="mc-photo-upload">
                <label className="mc-photo-label">Candidate Photo</label>
                <div className="mc-photo-row">
                  <div className="mc-photo-preview">
                    {profilePreview ? <img src={profilePreview} alt="Preview" /> : <span className="mc-photo-placeholder">No Photo</span>}
                  </div>
                  <div className="mc-photo-actions">
                    <label htmlFor="add-pic-input" className="mc-photo-btn">📷 Choose Photo</label>
                    <input id="add-pic-input" type="file" accept="image/*" onChange={e => handleProfilePicChange(e, false)} style={{ display: 'none' }} />
                    <p className="mc-photo-hint">JPEG / PNG / WebP · Max 5MB</p>
                  </div>
                </div>
              </div>

              <div className="mc-modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-submit">Save Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT DRAWER ─────────────────────── */}
      {selectedCandidate && (
        <div className="mc-drawer-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="mc-drawer" onClick={e => e.stopPropagation()}>
            <div className="mc-drawer__header">
              <h2>Edit Candidate</h2>
              <button className="mc-drawer__close" onClick={() => setSelectedCandidate(null)}><HiOutlineXMark /></button>
            </div>

            <div className="mc-drawer__profile">
              {editPreview ? (
                <img src={editPreview} alt={selectedCandidate.first_name} className="mc-drawer__profile-img" />
              ) : (
                <div className="mc-drawer__profile-avatar">
                  {selectedCandidate.first_name?.[0]}{selectedCandidate.last_name?.[0]}
                </div>
              )}
              <label htmlFor="edit-pic-input" className="mc-drawer__change-photo">📷 Change Photo</label>
              <input id="edit-pic-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleProfilePicChange(e, true)} />
            </div>

            {editMsg.text && (
              <div className={`mc-alert mc-alert--${editMsg.type}`} style={{ margin: '0 0 16px' }}>{editMsg.text}</div>
            )}

            <form onSubmit={handleUpdate} className="mc-drawer__form">
              <div className="mc-drawer__grid">
                <div className="mc-form-group">
                  <label>First Name</label>
                  <input type="text" required value={editData.first_name || ''} onChange={e => setEditData(p => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div className="mc-form-group">
                  <label>Last Name</label>
                  <input type="text" required value={editData.last_name || ''} onChange={e => setEditData(p => ({ ...p, last_name: e.target.value }))} />
                </div>
                <div className="mc-form-group">
                  <label>Position</label>
                  <input type="text" list="edit-positions-list" required value={editData.position || ''} onChange={e => setEditData(p => ({ ...p, position: e.target.value }))} placeholder="Select or type new position..." />
                  <datalist id="edit-positions-list">
                    {data.positions.map(p => <option key={p} value={p} />)}
                  </datalist>
                </div>
                <div className="mc-form-group">
                  <label>Party Affiliation</label>
                  <input type="text" required value={editData.partylist || ''} onChange={e => setEditData(p => ({ ...p, partylist: e.target.value }))} />
                </div>
                <div className="mc-form-group">
                  <label>Course</label>
                  <input type="text" required value={editData.course || ''} onChange={e => setEditData(p => ({ ...p, course: e.target.value }))} />
                </div>
                <div className="mc-form-group">
                  <label>Student ID</label>
                  <input type="text" required value={editData.student_id || ''} onChange={e => setEditData(p => ({ ...p, student_id: e.target.value }))} />
                </div>
              </div>
              
              <div className="mc-form-group mc-form-group--full">
                <label>Bio Summary</label>
                <textarea rows="4" value={editData.bio || ''} onChange={e => setEditData(p => ({ ...p, bio: e.target.value }))}></textarea>
              </div>

              <div className="mc-drawer__actions">
                <button type="button" className="mc-drawer__delete-btn" onClick={e => askDelete(selectedCandidate, e)}>
                  <HiOutlineTrash /> Delete
                </button>
                <button type="submit" className="mc-drawer__save-btn">
                  <HiOutlinePencilSquare /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PAGE HEADER & TOOLBAR ─────────────── */}
      <div className="manage-candidates__header">
        <div>
          <h1 className="manage-candidates__title">Manage Candidates</h1>
          <p className="manage-candidates__subtitle">Showing {paginatedCandidates.length} of {filteredCandidates.length} candidates</p>
        </div>
        <button className="manage-candidates__add-btn" onClick={() => setShowAddModal(true)}>
          <HiOutlinePlus /> Add Candidate
        </button>
      </div>

      <div className="manage-candidates__toolbar">
        <div className="manage-candidates__search">
          <HiOutlineMagnifyingGlass className="manage-candidates__search-icon" />
          <input type="text" placeholder="Search by name, ID, or party…"
            value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="manage-candidates__search-input" />
        </div>
        <div className="manage-candidates__filters">
          <button className={`mc-filter-btn ${filterPosition === 'all' ? 'mc-filter-btn--active' : ''}`} onClick={() => { setFilterPosition('all'); setCurrentPage(1); }}>All</button>
          {data.positions.map(pos => (
            <button key={pos} className={`mc-filter-btn ${filterPosition === pos ? 'mc-filter-btn--active' : ''}`} onClick={() => { setFilterPosition(pos); setCurrentPage(1); }}>
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TABLE ─────────────────────────────── */}
      <div className="mc-table-container">
        <table className="mc-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Position</th>
              <th>Party</th>
              <th>Course</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedCandidates.map((candidate, index) => (
              <tr key={candidate.id} style={{ animationDelay: `${index * 0.03}s` }} className="mc-row" onClick={() => openEdit(candidate)}>
                <td>
                  {candidate.image_url ? (
                    <img src={`${API}${candidate.image_url}`} alt={candidate.first_name} className="mc-row-pic" />
                  ) : (
                    <div className="mc-row-avatar">{candidate.first_name?.[0]}{candidate.last_name?.[0]}</div>
                  )}
                </td>
                <td><span className="mc-name">{candidate.first_name} {candidate.last_name}</span></td>
                <td><span className="mc-position">{candidate.position}</span></td>
                <td><span className="mc-party">{candidate.partylist}</span></td>
                <td>{candidate.course}</td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="mc-delete-btn" onClick={e => askDelete(candidate, e)} title="Delete Candidate">
                    <HiOutlineTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCandidates.length === 0 && (
          <div className="mc-empty"><p>No candidates found matching your criteria.</p></div>
        )}
      </div>

      {/* ─── PAGINATION ─────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mc-pagination">
          <button
            className="mc-page-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`mc-page-btn ${currentPage === i + 1 ? 'mc-page-btn--active' : ''}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="mc-page-btn"
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
