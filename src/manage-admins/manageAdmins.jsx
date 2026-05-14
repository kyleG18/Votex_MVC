import { useState, useEffect } from 'react';
import { HiOutlineUserPlus, HiOutlineCheck, HiOutlineXMark, HiOutlineTrash, HiOutlineUsers } from 'react-icons/hi2';
import api from '../api/axios';
import './manageAdmins.css';

function ManageAdminsPage() {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [activeAdmins, setActiveAdmins] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  
  const role = localStorage.getItem('votex_session_role');
  const isSuperAdmin = role === 'superadmin';

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
                  </div>
                </div>
                
                <div className="manage-admins__actions">
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
                  </div>
                </div>
                
                <div className="manage-admins__actions">
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
    </div>
  );
}

export default ManageAdminsPage;
