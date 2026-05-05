import { useState, useEffect } from 'react';
import { HiOutlineUserPlus, HiOutlineCheck, HiOutlineXMark } from 'react-icons/hi2';
import './page.css';

function ManageAdminsPage() {
  const [pendingAdmin, setPendingAdmin] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Check if current user is superadmin
  const role = localStorage.getItem('votex_session_role');
  const isSuperAdmin = role === 'superadmin';

  useEffect(() => {
    // Load pending admin from localStorage
    const storedAdminData = localStorage.getItem('votex_new_admin');
    if (storedAdminData) {
      try {
        const parsed = JSON.parse(storedAdminData);
        if (parsed.status === 'pending') {
          setPendingAdmin(parsed);
        }
      } catch (e) {
        console.error("Error parsing stored admin", e);
      }
    }
  }, []);

  const handleApprove = () => {
    if (pendingAdmin) {
      const updatedAdmin = { ...pendingAdmin, status: 'approved' };
      localStorage.setItem('votex_new_admin', JSON.stringify(updatedAdmin));
      setPendingAdmin(null);
      setSuccessMsg(`Admin account for ${updatedAdmin.fullName} has been approved.`);
    }
  };

  const handleReject = () => {
    // Simply remove the pending application from localStorage
    localStorage.removeItem('votex_new_admin');
    setPendingAdmin(null);
    setSuccessMsg('Admin application rejected and removed.');
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
          <HiOutlineUserPlus className="icon" /> Pending Approvals
        </h2>

        {pendingAdmin ? (
          <div className="manage-admins__card">
            <div className="manage-admins__card-details">
              <div className="manage-admins__avatar">
                {pendingAdmin.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="manage-admins__info">
                <h3>{pendingAdmin.fullName}</h3>
                <p>Username: <strong>{pendingAdmin.username}</strong></p>
                <p className="date">Applied on: {pendingAdmin.dateApplied}</p>
              </div>
            </div>
            
            <div className="manage-admins__actions">
              <button onClick={handleReject} className="btn-reject">
                <HiOutlineXMark /> Reject
              </button>
              <button onClick={handleApprove} className="btn-approve">
                <HiOutlineCheck /> Approve Access
              </button>
            </div>
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
