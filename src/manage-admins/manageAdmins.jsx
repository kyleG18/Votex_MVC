import { useState, useEffect, useRef } from 'react';
import { 
  HiOutlineUserPlus, 
  HiOutlineCheck, 
  HiOutlineXMark, 
  HiOutlineTrash, 
  HiOutlineUsers, 
  HiOutlineIdentification, 
  HiOutlineCheckCircle, 
  HiOutlineLockClosed, 
  HiOutlineUser, 
  HiOutlinePencilSquare 
} from 'react-icons/hi2';
import api from '../api/axios';
import './manageAdmins.css';

function ManageAdminsPage() {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [activeAdmins, setActiveAdmins] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Edit State
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editData, setEditData] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'admin',
    rfid_uid: ''
  });
  const [editErrorMsg, setEditErrorMsg] = useState('');
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const rfidInputRef = useRef(null);

  const role = localStorage.getItem('votex_session_role');
  const isSuperAdmin = role === 'superadmin';

  const openEdit = (admin) => {
    setSelectedAdmin(admin);
    setEditData({
      fullName: admin.fullName || '',
      username: admin.username || '',
      password: '',
      role: admin.role || 'admin',
      rfid_uid: admin.rfid_uid || ''
    });
    setEditErrorMsg('');
    setEditSuccessMsg('');
    
    // Auto-focus RFID input shortly after modal opens
    setTimeout(() => {
      if (rfidInputRef.current) {
        rfidInputRef.current.focus();
      }
    }, 100);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditErrorMsg('');
    setEditSuccessMsg('');
    setIsSaving(true);

    try {
      const response = await api.put(`/api/admins/${selectedAdmin.id}`, {
        fullName: editData.fullName,
        username: editData.username,
        password: editData.password || undefined,
        role: editData.role,
        rfid_uid: editData.rfid_uid
      });

      if (response.data.success) {
        setEditSuccessMsg('Admin details updated successfully!');
        fetchAdmins();
        setTimeout(() => {
          setSelectedAdmin(null);
        }, 1500);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setEditErrorMsg(error.response.data.message);
      } else {
        setEditErrorMsg('Failed to update admin details.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const [pendingRes, activeRes] = await Promise.all([
        api.get('/api/admins/pending'),
        api.get('/api/admins/approved')
      ]);
      
      if (pendingRes.data.success) {
        setPendingAdmins(pendingRes.data.pendingAdmins);
      }
      if (activeRes.data.success) {
        setActiveAdmins(activeRes.data.admins);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const handleApprove = async (id, fullName) => {
    try {
      await api.put(`/api/admins/approve/${id}`);
      setSuccessMsg(`Admin account for ${fullName} has been approved.`);
      fetchAdmins(); // Refresh the lists
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error approving admin:', error);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this application?')) return;
    try {
      await api.delete(`/api/admins/reject/${id}`);
      setSuccessMsg('Admin application rejected and removed.');
      fetchAdmins(); // Refresh the lists
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error('Error rejecting admin:', error);
    }
  };

  const handleDelete = async (id, fullName) => {
    if (!window.confirm(`Are you sure you want to delete the admin account for ${fullName}?`)) return;
    try {
      const response = await api.delete(`/api/admins/${id}`);
      if (response.data.success) {
        setSuccessMsg(`Admin account for ${fullName} has been deleted.`);
        fetchAdmins(); // Refresh the lists
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert(error.response?.data?.message || 'Error deleting admin');
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="manage-admins__container">
        <div className="manage-admins__restricted">
          <h2>Restricted Access</h2>
          <p>Only Super Admins can manage other administrator accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-admins__container">
      <div className="manage-admins__header">
        <h1 className="manage-admins__title">Manage Administrators</h1>
        <p className="manage-admins__subtitle">Approve or manage administrative access.</p>
      </div>

      {successMsg && (
        <div className="manage-admins__success-alert">
          <HiOutlineCheck className="icon" /> {successMsg}
        </div>
      )}

      <div className="manage-admins__content">
        <h2 className="manage-admins__section-title">
          <HiOutlineUserPlus className="icon" /> Pending Approvals ({pendingAdmins.length})
        </h2>

        {pendingAdmins.length > 0 ? (
          <div className="manage-admins__list">
            {pendingAdmins.map((admin) => (
              <div key={admin.id} className="manage-admins__card">
                <div className="manage-admins__card-details">
                  <div className="manage-admins__avatar">
                    {admin.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="manage-admins__info">
                    <h3>{admin.fullName}</h3>
                    <p>Username: <strong>{admin.username}</strong></p>
                    <p className="date">Applied on: {new Date(admin.dateApplied).toLocaleDateString()}</p>
                    <p className="date" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <HiOutlineIdentification /> Smart Card: <strong>{admin.rfid_uid || 'None'}</strong>
                    </p>
                  </div>
                </div>
                
                <div className="manage-admins__actions">
                  <button onClick={() => openEdit(admin)} className="btn-edit">
                    <HiOutlinePencilSquare /> Edit
                  </button>
                  <button onClick={() => handleReject(admin.id)} className="btn-reject">
                    <HiOutlineXMark /> Reject
                  </button>
                  <button onClick={() => handleApprove(admin.id, admin.fullName)} className="btn-approve">
                    <HiOutlineCheck /> Approve Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="manage-admins__empty-state" style={{ marginBottom: '2rem' }}>
            <p>There are no pending administrator requests at this time.</p>
          </div>
        )}

        <h2 className="manage-admins__section-title" style={{ marginTop: '2rem' }}>
          <HiOutlineUsers className="icon" /> Active Administrators ({activeAdmins.length})
        </h2>

        {activeAdmins.length > 0 ? (
          <div className="manage-admins__list">
            {activeAdmins.map((admin) => (
              <div key={admin.id} className="manage-admins__card">
                <div className="manage-admins__card-details">
                  <div className="manage-admins__avatar" style={{ background: admin.role === 'superadmin' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                    {admin.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="manage-admins__info">
                    <h3>{admin.fullName}</h3>
                    <p>Username: <strong>{admin.username}</strong></p>
                    <p className="date">Role: <strong style={{ color: admin.role === 'superadmin' ? '#10b981' : '#6366f1', textTransform: 'capitalize' }}>{admin.role}</strong></p>
                    <p className="date" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <HiOutlineIdentification /> Smart Card: <strong>{admin.rfid_uid || 'None'}</strong>
                    </p>
                  </div>
                </div>
                
                <div className="manage-admins__actions">
                  <button onClick={() => openEdit(admin)} className="btn-edit">
                    <HiOutlinePencilSquare /> Edit
                  </button>
                  {admin.role !== 'superadmin' ? (
                    <button onClick={() => handleDelete(admin.id, admin.fullName)} className="btn-reject">
                      <HiOutlineTrash /> Delete
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Cannot delete</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="manage-admins__empty-state">
            <p>No active administrators found.</p>
          </div>
        )}
      </div>

      {/* ─── EDIT MODAL ───────────────────────── */}
      {selectedAdmin && (
        <div className="manage-admins__modal-overlay" onClick={() => setSelectedAdmin(null)}>
          <div className="manage-admins__modal" onClick={(e) => e.stopPropagation()}>
            <div className="manage-admins__modal-header">
              <h2>Edit Administrator Details</h2>
              <button className="manage-admins__modal-close" onClick={() => setSelectedAdmin(null)}>
                <HiOutlineXMark />
              </button>
            </div>

            {editErrorMsg && (
              <div className="manage-admins__alert manage-admins__alert--error">
                {editErrorMsg}
              </div>
            )}
            {editSuccessMsg && (
              <div className="manage-admins__alert manage-admins__alert--success">
                {editSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="manage-admins__modal-form">
              <div className="manage-admins__form-group">
                <label className="manage-admins__label">
                  <HiOutlineUser /> Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={editData.fullName}
                  onChange={handleEditChange}
                  required
                  placeholder="e.g. Juan Dela Cruz"
                />
              </div>

              <div className="manage-admins__form-group">
                <label className="manage-admins__label">
                  <HiOutlineUser /> Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={editData.username}
                  onChange={handleEditChange}
                  required
                  placeholder="e.g. jdelacruz"
                />
              </div>

              <div className="manage-admins__form-group">
                <label className="manage-admins__label">
                  <HiOutlineLockClosed /> New Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={editData.password}
                  onChange={handleEditChange}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="manage-admins__form-group">
                <label className="manage-admins__label">Role</label>
                <select
                  name="role"
                  value={editData.role}
                  onChange={handleEditChange}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              <div className={`manage-admins__rfid-field ${editData.rfid_uid ? 'manage-admins__rfid-field--success' : ''}`}>
                <label className="manage-admins__label">
                  <HiOutlineIdentification /> Smart Card Registration (Tap card now)
                </label>
                <div className="manage-admins__rfid-input-wrapper">
                  <HiOutlineIdentification className="icon" />
                  <input
                    type="text"
                    ref={rfidInputRef}
                    placeholder="Waiting for scan…"
                    name="rfid_uid"
                    value={editData.rfid_uid}
                    onChange={handleEditChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                  />
                  {editData.rfid_uid && <HiOutlineCheckCircle className="success-icon" />}
                </div>
                <p className="manage-admins__hint">
                  {editData.rfid_uid ? `Card Linked: ${editData.rfid_uid}` : 'Click here then tap the RFID card.'}
                </p>
                {editData.rfid_uid && (
                  <button
                    type="button"
                    className="manage-admins__clear-rfid"
                    onClick={() => setEditData(prev => ({ ...prev, rfid_uid: '' }))}
                  >
                    Clear Card Link
                  </button>
                )}
              </div>

              <div className="manage-admins__modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setSelectedAdmin(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageAdminsPage;
