import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlinePlus, HiOutlineIdentification, HiOutlineTrash, HiOutlinePencilSquare,
  HiOutlineXMark, HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import axios from 'axios';
import './page.css';

const API = 'http://localhost:5000';

function ManageStudentsPage() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Enroll modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '', first_name: '', last_name: '',
    email: '', course: '', year_level: '', rfid_uid: '', profile_pic: null
  });
  const [enrollMsg, setEnrollMsg] = useState({ text: '', type: '' });
  const rfidInputRef = useRef(null);

  // Edit drawer
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editData, setEditData] = useState({});
  const [editPreview, setEditPreview] = useState(null);
  const [editMsg, setEditMsg] = useState({ text: '', type: '' });

  // Custom delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  useEffect(() => { fetchStudents(); }, []);
  
  // Format student ID: ##-#-####
  const formatStudentId = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 7);
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2);
    }
    if (cleaned.length > 3) {
      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
    }
    return formatted;
  };

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API}/api/students`);
      if (res.data.success) setStudents(res.data.students);
    } catch (err) { console.error('Fetch error:', err.message); }
  };

  /* ─── ENROLL ─────────────────────────────── */
  const handleEnroll = async (e) => {
    e.preventDefault();
    setEnrollMsg({ text: '', type: '' });
    if (!formData.rfid_uid) {
      setEnrollMsg({ text: 'Please scan an RFID card for this student.', type: 'error' });
      return;
    }
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v !== null && v !== '') data.append(k, v); });
      const res = await axios.post(`${API}/api/students`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setEnrollMsg({ text: res.data.message, type: 'success' });
        setFormData({ student_id: '', first_name: '', last_name: '', email: '', course: '', year_level: '', rfid_uid: '', profile_pic: null });
        setProfilePreview(null);
        fetchStudents();
        setTimeout(() => { setShowAddModal(false); setEnrollMsg({ text: '', type: '' }); }, 1800);
      }
    } catch (err) {
      setEnrollMsg({ text: err.response?.data?.message || 'Error enrolling student.', type: 'error' });
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) { setFormData(p => ({ ...p, profile_pic: file })); setProfilePreview(URL.createObjectURL(file)); }
  };

  /* ─── DELETE (custom modal) ──────────────── */
  const askDelete = (student, e) => {
    e.stopPropagation();
    setDeleteTarget({ id: student.id, name: `${student.first_name} ${student.last_name}` });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API}/api/students/${deleteTarget.id}`);
      if (selectedStudent?.id === deleteTarget.id) setSelectedStudent(null);
      setDeleteTarget(null);
      fetchStudents();
    } catch (err) {
      console.error('Delete error:', err.response?.data || err.message);
      setDeleteTarget(null);
    }
  };

  /* ─── OPEN EDIT DRAWER ───────────────────── */
  const openEdit = (student) => {
    setSelectedStudent(student);
    setEditData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      course: student.course || '',
      year_level: student.year_level || '',
      rfid_uid: student.rfid_uid || '',
      profile_pic: null
    });
    setEditPreview(student.profile_pic ? `${API}${student.profile_pic}` : null);
    setEditMsg({ text: '', type: '' });
  };

  /* ─── SAVE EDIT ──────────────────────────── */
  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditMsg({ text: '', type: '' });
    try {
      const data = new FormData();
      // Always send all text fields
      data.append('first_name', editData.first_name);
      data.append('last_name', editData.last_name);
      data.append('email', editData.email);
      data.append('course', editData.course);
      data.append('year_level', editData.year_level);
      data.append('rfid_uid', editData.rfid_uid);
      // Only send file if a new one was selected
      if (editData.profile_pic) data.append('profile_pic', editData.profile_pic);

      const res = await axios.put(`${API}/api/students/${selectedStudent.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setEditMsg({ text: '✓ Changes saved successfully!', type: 'success' });
        fetchStudents();
        setTimeout(() => setSelectedStudent(null), 1500);
      }
    } catch (err) {
      setEditMsg({ text: err.response?.data?.message || 'Update failed. Please try again.', type: 'error' });
    }
  };

  /* ─── FILTER ─────────────────────────────── */
  const filteredStudents = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      s.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'voted' && s.has_voted) ||
      (filterStatus === 'not-voted' && !s.has_voted);
    return matchesSearch && matchesFilter;
  });

  const votedCount = students.filter(s => s.has_voted).length;
  const notVotedCount = students.filter(s => !s.has_voted).length;

  return (
    <div className="manage-students" id="manage-students-page">

      {/* ─── CUSTOM DELETE CONFIRM MODAL ───── */}
      {deleteTarget && (
        <div className="ms-confirm-overlay">
          <div className="ms-confirm">
            <div className="ms-confirm__icon"><HiOutlineExclamationTriangle /></div>
            <h3 className="ms-confirm__title">Delete Student?</h3>
            <p className="ms-confirm__msg">
              You are about to permanently remove <strong>{deleteTarget.name}</strong> from the voter registry.
              This action cannot be undone.
            </p>
            <div className="ms-confirm__actions">
              <button className="ms-confirm__cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="ms-confirm__delete" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ENROLL MODAL ────────────────────── */}
      {showAddModal && (
        <div className="manage-students__modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="manage-students__modal" onClick={e => e.stopPropagation()}>
            <div className="manage-students__modal-header">
              <h2>Enroll New Voter</h2>
              <button onClick={() => setShowAddModal(false)} className="manage-students__modal-close">×</button>
            </div>

            {enrollMsg.text && (
              <div className={`manage-students__alert manage-students__alert--${enrollMsg.type}`}>
                {enrollMsg.text}
              </div>
            )}

            <form onSubmit={handleEnroll} className="manage-students__form">
              <div className="manage-students__form-grid">
                {[
                  { label: 'Student ID', key: 'student_id', ph: 'e.g. 2024-0001', type: 'text' },
                  { label: 'Email Address', key: 'email', ph: 'student@jpc.edu.ph', type: 'email' },
                  { label: 'First Name', key: 'first_name', ph: 'First Name', type: 'text' },
                  { label: 'Last Name', key: 'last_name', ph: 'Last Name', type: 'text' },
                  { label: 'Course', key: 'course', ph: 'BSIT, BSED…', type: 'text' },
                ].map(f => (
                  <div className="manage-students__form-group" key={f.key}>
                    <label>{f.label}</label>
                    <input 
                      type={f.type} 
                      placeholder={f.ph} 
                      required 
                      value={formData[f.key]}
                      onChange={e => {
                        const val = f.key === 'student_id' ? formatStudentId(e.target.value) : e.target.value;
                        setFormData(p => ({ ...p, [f.key]: val }));
                      }} 
                      maxLength={f.key === 'student_id' ? 9 : undefined}
                    />
                  </div>
                ))}
                <div className="manage-students__form-group">
                  <label>Year Level</label>
                  <select value={formData.year_level} required
                    onChange={e => setFormData(p => ({ ...p, year_level: e.target.value }))}>
                    <option value="">Select Year</option>
                    {['1st Year','2nd Year','3rd Year','4th Year','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']
                      .map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Profile Photo */}
              <div className="manage-students__photo-upload">
                <label className="manage-students__photo-label">Profile Photo</label>
                <div className="manage-students__photo-row">
                  <div className="manage-students__photo-preview">
                    {profilePreview ? <img src={profilePreview} alt="Preview" /> :
                      <span className="manage-students__photo-placeholder">No Photo</span>}
                  </div>
                  <div className="manage-students__photo-actions">
                    <label htmlFor="profile-pic-input" className="manage-students__photo-btn">📷 Choose Photo</label>
                    <input id="profile-pic-input" type="file" accept="image/*"
                      onChange={handleProfilePicChange} style={{ display: 'none' }} />
                    <p className="manage-students__photo-hint">JPEG / PNG / WebP · Max 5MB</p>
                  </div>
                </div>
              </div>

              {/* RFID */}
              <div className={`manage-students__rfid-field ${formData.rfid_uid ? 'manage-students__rfid-field--success' : ''}`}>
                <label>RFID Registration (Tap card now)</label>
                <div className="manage-students__rfid-input-wrapper">
                  <HiOutlineIdentification className="icon" />
                  <input type="text" ref={rfidInputRef} placeholder="Waiting for scan…"
                    value={formData.rfid_uid}
                    onChange={e => setFormData(p => ({ ...p, rfid_uid: e.target.value }))}
                    autoFocus />
                  {formData.rfid_uid && <HiOutlineCheckCircle className="success-icon" />}
                </div>
                <p className="hint">
                  {formData.rfid_uid ? `Card Linked: ${formData.rfid_uid}` : 'Click here then tap the RFID card.'}
                </p>
              </div>

              <div className="manage-students__modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-submit">Complete Enrollment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT DRAWER ─────────────────────── */}
      {selectedStudent && (
        <div className="ms-drawer-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="ms-drawer" onClick={e => e.stopPropagation()}>
            <div className="ms-drawer__header">
              <h2>Student Details</h2>
              <button className="ms-drawer__close" onClick={() => setSelectedStudent(null)}>
                <HiOutlineXMark />
              </button>
            </div>

            <div className="ms-drawer__profile">
              {editPreview ? (
                <img src={editPreview} alt={selectedStudent.first_name} className="ms-drawer__profile-img" />
              ) : (
                <div className="ms-drawer__profile-avatar">
                  {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                </div>
              )}
              <label htmlFor="edit-pic-input" className="ms-drawer__change-photo">📷 Change Photo</label>
              <input id="edit-pic-input" type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files[0];
                  if (f) { setEditData(p => ({ ...p, profile_pic: f })); setEditPreview(URL.createObjectURL(f)); }
                }} />
            </div>

            {editMsg.text && (
              <div className={`manage-students__alert manage-students__alert--${editMsg.type}`}
                style={{ margin: '0 0 16px' }}>
                {editMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdate} className="ms-drawer__form">
              <div className="ms-drawer__grid">
                {[
                  { label: 'First Name', key: 'first_name', type: 'text' },
                  { label: 'Last Name', key: 'last_name', type: 'text' },
                  { label: 'Email', key: 'email', type: 'email' },
                  { label: 'Course', key: 'course', type: 'text' },
                ].map(f => (
                  <div className="manage-students__form-group" key={f.key}>
                    <label>{f.label}</label>
                    <input type={f.type} value={editData[f.key] || ''}
                      onChange={e => setEditData(p => ({ ...p, [f.key]: e.target.value }))} required />
                  </div>
                ))}

                <div className="manage-students__form-group">
                  <label>Year Level</label>
                  <select value={editData.year_level || ''}
                    onChange={e => setEditData(p => ({ ...p, year_level: e.target.value }))}>
                    {['1st Year','2nd Year','3rd Year','4th Year','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']
                      .map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                <div className="manage-students__form-group">
                  <label>RFID Card UID</label>
                  <input type="text" value={editData.rfid_uid || ''}
                    onChange={e => setEditData(p => ({ ...p, rfid_uid: e.target.value }))}
                    placeholder="Tap card to update…" />
                </div>
              </div>

              <div className="ms-drawer__readonly">
                <span><strong>Student ID:</strong> {selectedStudent.student_id}</span>
                <span><strong>Status:</strong> {selectedStudent.has_voted ? '✅ Voted' : '⏳ Not Yet Voted'}</span>
                <span><strong>Enrolled:</strong> {new Date(selectedStudent.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>

              <div className="ms-drawer__actions">
                <button type="button" className="ms-drawer__delete-btn"
                  onClick={e => askDelete(selectedStudent, e)}>
                  <HiOutlineTrash /> Delete
                </button>
                <button type="submit" className="ms-drawer__save-btn">
                  <HiOutlinePencilSquare /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── PAGE HEADER ─────────────────────── */}
      <div className="manage-students__header">
        <div>
          <h1 className="manage-students__title">Voter Management</h1>
          <p className="manage-students__subtitle">
            {students.length} total · {votedCount} voted · {notVotedCount} pending
          </p>
        </div>
        <button className="manage-students__add-btn" onClick={() => setShowAddModal(true)} id="enroll-student-btn">
          <HiOutlinePlus /> Enroll New Voter
        </button>
      </div>

      {/* ─── TOOLBAR ─────────────────────────── */}
      <div className="manage-students__toolbar">
        <div className="manage-students__search">
          <HiOutlineMagnifyingGlass className="manage-students__search-icon" />
          <input type="text" placeholder="Search by name, ID, or email…"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="manage-students__search-input" id="search-students-input" />
        </div>
        <div className="manage-students__filters">
          {['all', 'voted', 'not-voted'].map(f => (
            <button key={f}
              className={`manage-students__filter-btn ${filterStatus === f ? 'manage-students__filter-btn--active' : ''}`}
              onClick={() => setFilterStatus(f)}>
              {f === 'all' ? 'All' : f === 'voted' ? 'Voted' : 'Not Voted'}
            </button>
          ))}
        </div>
      </div>

      {/* ─── TABLE ───────────────────────────── */}
      <div className="manage-students__table-container">
        <table className="manage-students__table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Course</th>
              <th>Year</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student, index) => (
              <tr key={student.id}
                style={{ animationDelay: `${index * 0.03}s` }}
                className="manage-students__row"
                onClick={() => openEdit(student)}>
                <td>
                  {student.profile_pic ? (
                    <img src={`${API}${student.profile_pic}`} alt={student.first_name}
                      className="manage-students__row-pic" />
                  ) : (
                    <div className="manage-students__row-avatar">
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </div>
                  )}
                </td>
                <td><code className="manage-students__id">{formatStudentId(student.student_id)}</code></td>
                <td><span className="manage-students__name">{student.first_name} {student.last_name}</span></td>
                <td className="manage-students__email">{student.email}</td>
                <td>{student.course}</td>
                <td>{student.year_level}</td>
                <td>
                  {student.has_voted ? (
                    <span className="manage-students__status manage-students__status--voted">
                      <HiOutlineCheckCircle /> Voted
                    </span>
                  ) : (
                    <span className="manage-students__status manage-students__status--pending">
                      <HiOutlineXCircle /> Not Yet
                    </span>
                  )}
                </td>
                {/* IMPORTANT: stop propagation so row click doesn't also fire */}
                <td onClick={e => e.stopPropagation()}>
                  <button className="manage-students__delete-btn"
                    onClick={e => askDelete(student, e)}
                    title="Delete Student">
                    <HiOutlineTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <div className="manage-students__empty">
            <p>No students found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageStudentsPage;
