import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineMagnifyingGlass, HiOutlineCheckCircle, HiOutlineXCircle,
  HiOutlinePlus, HiOutlineIdentification, HiOutlineTrash, HiOutlinePencilSquare,
  HiOutlineXMark, HiOutlineExclamationTriangle
} from 'react-icons/hi2';
import api from '../api/axios';
import { formatImageUrl } from '../utils/imageUtils';
import './manageStudents.css';

function ManageStudentsPage() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Courses dropdown list
  const [coursesList, setCoursesList] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Enroll modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '', first_name: '', middle_name: '', last_name: '',
    email: '', course: '', section: '', year_level: '', rfid_uid: '', password: '', profile_pic: null
  });
  const [enrollMsg, setEnrollMsg] = useState({ text: '', type: '' });
  const rfidInputRef = useRef(null);

  // Excel Import modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importMsg, setImportMsg] = useState({ text: '', type: '' });
  const [importing, setImporting] = useState(false);

  // Edit drawer
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editData, setEditData] = useState({});
  const [editPreview, setEditPreview] = useState(null);
  const [editMsg, setEditMsg] = useState({ text: '', type: '' });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editConfirmPassword, setEditConfirmPassword] = useState('');

  // Custom delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/api/utility/courses');
      if (res.data.success) {
        const courses = res.data.courses || [];
        setCoursesList(courses);
        setFormData(prev => ({ ...prev, course: courses[0] || '' }));
      }
    } catch (err) {
      console.error('Error fetching courses:', err.message);
    }
  };
  
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
      const res = await api.get('/api/students');
      if (res.data.success) setStudents(res.data.students);
    } catch (err) { console.error('Fetch error:', err.message); }
  };

  /* ─── ENROLL ─────────────────────────────── */
  const handleEnroll = async (e) => {
    e.preventDefault();
    setEnrollMsg({ text: '', type: '' });

    if (formData.password && !/^\d{4}$/.test(formData.password)) {
      setEnrollMsg({ text: 'PIN must be exactly 4 numeric digits (e.g. 1234).', type: 'error' });
      return;
    }

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => { if (v !== null && v !== '') data.append(k, v); });
      const res = await api.post('/api/students', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setEnrollMsg({ text: res.data.message, type: 'success' });
        setFormData({ student_id: '', first_name: '', middle_name: '', last_name: '', email: '', course: coursesList[0] || '', section: '', year_level: '', rfid_uid: '', password: '', profile_pic: null });
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
      await api.delete(`/api/students/${deleteTarget.id}`);
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
      middle_name: student.middle_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      course: student.course || '',
      section: student.section || '',
      year_level: student.year_level || '',
      rfid_uid: student.rfid_uid || '',
      password: '', // blank by default, only sent if changed
      profile_pic: null
    });
    setEditConfirmPassword('');
    setShowEditPassword(false);
    setEditPreview(formatImageUrl(student.profile_pic));
    setEditMsg({ text: '', type: '' });
  };

  /* ─── SAVE EDIT ──────────────────────────── */
  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditMsg({ text: '', type: '' });

    // Password validation — school standard: exactly 4 numeric digits
    if (editData.password) {
      if (!/^\d{4}$/.test(editData.password)) {
        setEditMsg({ text: 'Password must be exactly 4 numeric digits (e.g. 1234).', type: 'error' });
        return;
      }
      if (editData.password !== editConfirmPassword) {
        setEditMsg({ text: 'Passwords do not match. Please re-enter the 4-digit PIN.', type: 'error' });
        return;
      }
    }

    try {
      const data = new FormData();
      // Always send all text fields
      data.append('first_name', editData.first_name);
      data.append('middle_name', editData.middle_name || '');
      data.append('last_name', editData.last_name);
      data.append('email', editData.email);
      data.append('course', editData.course);
      data.append('section', editData.section || '');
      data.append('year_level', editData.year_level);
      data.append('rfid_uid', editData.rfid_uid);
      if (editData.password) data.append('password', editData.password);
      // Only send file if a new one was selected
      if (editData.profile_pic) data.append('profile_pic', editData.profile_pic);

      const res = await api.put(`/api/students/${selectedStudent.id}`, data, {
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

  /* ─── FILTER & PAGINATION ─────────────────── */
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

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const votedCount = students.filter(s => s.has_voted).length;
  const notVotedCount = students.filter(s => !s.has_voted).length;

  /* ─── EXCEL IMPORT ───────────────────────── */
  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);
    setImportMsg({ text: '', type: '' });
  };

  const submitExcelImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportMsg({ text: '', type: '' });
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const XLSX = await import('xlsx');
          const data = evt.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (sheetData.length < 2) {
            setImportMsg({ text: 'Excel sheet is empty or has no data rows.', type: 'error' });
            setImporting(false);
            return;
          }

          const parsedStudents = [];
          for (let i = 1; i < sheetData.length; i++) {
            const row = sheetData[i];
            if (!row || row.length === 0 || !row[0]) continue;

            const student_id = String(row[0] || '').trim();
            const last_name = String(row[1] || '').trim();
            const first_name = String(row[2] || '').trim();
            const middle_name = String(row[3] || '').trim();
            const course = String(row[4] || '').trim();
            const section = String(row[5] || '').trim();
            const year_level = String(row[6] || '').trim();

            if (student_id && first_name && last_name) {
              parsedStudents.push({
                student_id,
                first_name,
                middle_name: middle_name || null,
                last_name,
                course: course || null,
                section: section || null,
                year_level: year_level || '1st Year'
              });
            }
          }

          if (parsedStudents.length === 0) {
            setImportMsg({ text: 'No valid student rows found. Required order: Student ID, Last Name, First Name, Middle Name, Course, Section, Year.', type: 'error' });
            setImporting(false);
            return;
          }

          const response = await api.post('/api/students/bulk', { students: parsedStudents });
          if (response.data.success) {
            setImportMsg({ text: response.data.message, type: 'success' });
            fetchStudents();
            setTimeout(() => {
              setShowImportModal(false);
              setImportFile(null);
              setImportMsg({ text: '', type: '' });
            }, 3000);
          } else {
            setImportMsg({ text: response.data.message, type: 'error' });
          }
        } catch (parseErr) {
          setImportMsg({ text: 'Error parsing file: ' + parseErr.message, type: 'error' });
        } finally {
          setImporting(false);
        }
      };
      reader.readAsBinaryString(importFile);
    } catch (err) {
      setImportMsg({ text: 'Failed to read file: ' + err.message, type: 'error' });
      setImporting(false);
    }
  };

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
                <div className="manage-students__form-group">
                  <label>Student ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024-0001"
                    required
                    value={formData.student_id}
                    onChange={e => {
                      const val = formatStudentId(e.target.value);
                      setFormData(p => ({ ...p, student_id: val }));
                    }}
                    maxLength={9}
                  />
                </div>
                <div className="manage-students__form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="student@jpc.edu.ph"
                    required
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="manage-students__form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    required
                    value={formData.first_name}
                    onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))}
                  />
                </div>
                <div className="manage-students__form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    placeholder="Middle Name (Optional)"
                    value={formData.middle_name}
                    onChange={e => setFormData(p => ({ ...p, middle_name: e.target.value }))}
                  />
                </div>
                <div className="manage-students__form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    required
                    value={formData.last_name}
                    onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))}
                  />
                </div>
                <div className="manage-students__form-group">
                  <label>Course</label>
                  <select
                    value={formData.course}
                    required
                    onChange={e => setFormData(p => ({ ...p, course: e.target.value }))}
                  >
                    <option value="">Select Course</option>
                    {coursesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="manage-students__form-group">
                  <label>Section</label>
                  <input
                    type="text"
                    placeholder="e.g. A, B, 301"
                    value={formData.section}
                    onChange={e => setFormData(p => ({ ...p, section: e.target.value }))}
                  />
                </div>
                <div className="manage-students__form-group">
                  <label>Year Level</label>
                  <select
                    value={formData.year_level}
                    required
                    onChange={e => setFormData(p => ({ ...p, year_level: e.target.value }))}
                  >
                    <option value="">Select Year</option>
                    {['1st Year','2nd Year','3rd Year','4th Year','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']
                      .map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="manage-students__form-group">
                  <label>Initial PIN (4 digits, Optional)</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="\d{4}"
                    placeholder="e.g. 1234 — blank = Student ID"
                    value={formData.password}
                    onChange={e => setFormData(p => ({ ...p, password: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    style={{ letterSpacing: '0.3em', fontWeight: '700', fontSize: '1.1rem' }}
                  />
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
                <div className="manage-students__form-group">
                  <label>First Name</label>
                  <input type="text" value={editData.first_name || ''}
                    onChange={e => setEditData(p => ({ ...p, first_name: e.target.value }))} required />
                </div>
                <div className="manage-students__form-group">
                  <label>Middle Name</label>
                  <input type="text" value={editData.middle_name || ''}
                    onChange={e => setEditData(p => ({ ...p, middle_name: e.target.value }))} placeholder="Optional" />
                </div>
                <div className="manage-students__form-group">
                  <label>Last Name</label>
                  <input type="text" value={editData.last_name || ''}
                    onChange={e => setEditData(p => ({ ...p, last_name: e.target.value }))} required />
                </div>
                <div className="manage-students__form-group">
                  <label>Email</label>
                  <input type="email" value={editData.email || ''}
                    onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div className="manage-students__form-group">
                  <label>Course</label>
                  <select value={editData.course || ''} required
                    onChange={e => setEditData(p => ({ ...p, course: e.target.value }))}>
                    <option value="">Select Course</option>
                    {coursesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="manage-students__form-group">
                  <label>Section</label>
                  <input type="text" value={editData.section || ''}
                    onChange={e => setEditData(p => ({ ...p, section: e.target.value }))} placeholder="e.g. A, B, 301" />
                </div>
                <div className="manage-students__form-group">
                  <label>Year Level</label>
                  <select value={editData.year_level || ''} required
                    onChange={e => setEditData(p => ({ ...p, year_level: e.target.value }))}>
                    {['1st Year','2nd Year','3rd Year','4th Year','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12']
                      .map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* ─── PASSWORD RESET SECTION ──────── */}
              <div className="ms-drawer__password-section">
                <div className="ms-drawer__password-header">
                  <span className="ms-drawer__password-title">🔐 Set New Password</span>
                  <span className="ms-drawer__password-hint">Leave blank to keep the current password</span>
                </div>
                <div className="ms-drawer__password-grid">
                  <div className="manage-students__form-group">
                    <label>New Password</label>
                    <div className="ms-drawer__password-input-wrap">
                      <input
                        type={showEditPassword ? 'tel' : 'password'}
                        inputMode="numeric"
                        maxLength={4}
                        pattern="\d{4}"
                        value={editData.password || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setEditData(p => ({ ...p, password: val }));
                        }}
                        placeholder="e.g. 1234"
                        autoComplete="new-password"
                        style={{ letterSpacing: '0.3em', fontWeight: '700', fontSize: '1.1rem' }}
                      />
                      <button
                        type="button"
                        className="ms-drawer__eye-btn"
                        onClick={() => setShowEditPassword(v => !v)}
                        tabIndex={-1}
                        title={showEditPassword ? 'Hide password' : 'Show password'}
                      >
                        {showEditPassword ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <div className="manage-students__form-group">
                    <label>Confirm New Password</label>
                    <div className="ms-drawer__password-input-wrap">
                      <input
                        type={showEditPassword ? 'tel' : 'password'}
                        inputMode="numeric"
                        maxLength={4}
                        pattern="\d{4}"
                        value={editConfirmPassword}
                        onChange={e => setEditConfirmPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="Re-enter 4-digit PIN"
                        autoComplete="new-password"
                        style={{
                          letterSpacing: '0.3em',
                          fontWeight: '700',
                          fontSize: '1.1rem',
                          borderColor: editConfirmPassword && editData.password && editConfirmPassword !== editData.password
                            ? '#ef4444'
                            : editConfirmPassword && editData.password && editConfirmPassword === editData.password
                            ? '#10b981'
                            : ''
                        }}
                      />
                      {editConfirmPassword && editData.password && (
                        <span className="ms-drawer__password-match-icon">
                          {editConfirmPassword === editData.password ? '✅' : '❌'}
                        </span>
                      )}
                    </div>
                  </div>
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
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="manage-students__add-btn" style={{ backgroundColor: '#10b981' }} onClick={() => setShowImportModal(true)}>
            📥 Import Excel
          </button>
          <button className="manage-students__add-btn" onClick={() => setShowAddModal(true)} id="enroll-student-btn">
            <HiOutlinePlus /> Enroll New Voter
          </button>
        </div>
      </div>

      {/* ─── EXCEL IMPORT MODAL ──────────────── */}
      {showImportModal && (
        <div className="manage-students__modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="manage-students__modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="manage-students__modal-header">
              <h2>Import Students from Excel</h2>
              <button onClick={() => setShowImportModal(false)} className="manage-students__modal-close">×</button>
            </div>

            {importMsg.text && (
              <div className={`manage-students__alert manage-students__alert--${importMsg.type}`}>
                {importMsg.text}
              </div>
            )}

            <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Please select an Excel file (.xlsx, .xls) containing the voter registry.
                The columns <strong>must</strong> be in this exact order:
              </p>
              <ol style={{ fontSize: '13px', paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <li><strong>Student ID</strong> (e.g. 2024-0001)</li>
                <li><strong>Last Name</strong></li>
                <li><strong>First Name</strong></li>
                <li><strong>Middle Name</strong></li>
                <li><strong>Course</strong></li>
                <li><strong>Section</strong></li>
                <li><strong>Year Level</strong> (e.g. 1st Year)</li>
              </ol>

              <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
                <input type="file" accept=".xlsx, .xls" onChange={handleExcelImport} id="excel-file-input" style={{ display: 'none' }} />
                <label htmlFor="excel-file-input" style={{ cursor: 'pointer', display: 'inline-block', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '6px', fontWeight: '500' }}>
                  Choose Excel File
                </label>
                {importFile && (
                  <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--primary-color)', fontWeight: '500' }}>
                    📄 {importFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="manage-students__modal-actions">
              <button type="button" onClick={() => setShowImportModal(false)} className="btn-cancel" disabled={importing}>
                Cancel
              </button>
              <button type="button" onClick={submitExcelImport} className="btn-submit" disabled={!importFile || importing}>
                {importing ? 'Importing...' : 'Upload & Process'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOOLBAR ─────────────────────────── */}
      <div className="manage-students__toolbar">
        <div className="manage-students__search">
          <HiOutlineMagnifyingGlass className="manage-students__search-icon" />
          <input type="text" placeholder="Search by name, ID, or email…"
            value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="manage-students__search-input" id="search-students-input" />
        </div>
        <div className="manage-students__filters">
          {['all', 'voted', 'not-voted'].map(f => (
            <button key={f}
              className={`manage-students__filter-btn ${filterStatus === f ? 'manage-students__filter-btn--active' : ''}`}
              onClick={() => { setFilterStatus(f); setCurrentPage(1); }}>
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
              <th>Section</th>
              <th>Year</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student, index) => (
              <tr key={student.id}
                style={{ animationDelay: `${index * 0.03}s` }}
                className="manage-students__row"
                onClick={() => openEdit(student)}>
                <td>
                  {student.profile_pic ? (
                    <img src={formatImageUrl(student.profile_pic)} alt={student.first_name}
                      className="manage-students__row-pic" />
                  ) : (
                    <div className="manage-students__row-avatar">
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </div>
                  )}
                </td>
                <td><code className="manage-students__id">{formatStudentId(student.student_id)}</code></td>
                <td>
                  <span className="manage-students__name">
                    {student.last_name}, {student.first_name} {student.middle_name ? student.middle_name : ''}
                  </span>
                </td>
                <td className="manage-students__email">{student.email}</td>
                <td>{student.course}</td>
                <td>{student.section || '—'}</td>
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

      {/* ─── PAGINATION CONTROLS ───────────────── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          <button
            style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '6px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              style={{
                backgroundColor: currentPage === i + 1 ? 'var(--primary-color)' : 'var(--surface-color)',
                color: currentPage === i + 1 ? '#fff' : 'var(--text-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                cursor: 'pointer',
                fontWeight: '600'
              }}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '6px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
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

export default ManageStudentsPage;
