import { useState, useEffect } from 'react';
import { HiOutlineUserPlus, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';
import axios from 'axios';
import './page.css';

function ManageAdminsPage() {
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [successMsg, setSuccessMsg] = useState('');
  
  const role = localStorage.getItem('votex_session_role');
  const isSuperAdmin = role === 'superadmin';

  const fetchPendingAdmins = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admins/pending');
      if (response.data.success) {
        setPendingAdmins(response.data.pendingAdmins);
      }
    } catch (error) {
      console.error('Error fetching pending admins:', error);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchPendingAdmins();
    }
  }, [isSuperAdmin]);

  const handleApprove = async (id, fullName) => {
    try {
      await axios.put(`http://localhost:5000/api/admins/approve/${id}`);
      setSuccessMsg(`Admin account for ${fullName} has been approved.`);
      fetchPendingAdmins(); // Refresh the list
    } catch (error) {
      console.error('Error approving admin:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/admins/reject/${id}`);
      setSuccessMsg('Admin application rejected and removed.');
      fetchPendingAdmins(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting admin:', error);
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
        <p className="manage-admins__subtitle">Approve or reject pending administrative access requests.</p>
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
          <div className="manage-admins__empty-state">
            <p>There are no pending administrator requests at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageAdminsPage;
