import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Component/sidebar/sidebar';
import LoginPage from './login/login';
import RegisterPage from './register/register';
import VoteCastingPage from './vote-casting/voteCasting';
import VoteSuccessPage from './vote-success/voteSuccess';
import DashboardPage from './dashboard/dashboard';
import ManageCandidatesPage from './manage-candidates/manageCandidates';
import ManageStudentsPage from './manage-students/manageStudents';
import ReportsPage from './reports/reports';
import SettingsPage from './settings/settings';
import ManageAdminsPage from './manage-admins/manageAdmins';
import AdminLoginPage from './admin-login/adminLogin';
import AdminRegisterPage from './admin-register/adminRegister';
import AuditTrailPage from './audit-trail/auditTrail';
import './App.css';

/* Admin Layout - wraps all admin pages with sidebar */
function AdminLayout() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/vote-casting" element={<VoteCastingPage />} />
        <Route path="/vote-success" element={<VoteSuccessPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/admin-register" element={<AdminRegisterPage />} />

        {/* Admin Routes - wrapped with sidebar layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="manage-candidates" element={<ManageCandidatesPage />} />
          <Route path="manage-students" element={<ManageStudentsPage />} />
          <Route path="manage-admins" element={<ManageAdminsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit-trail" element={<AuditTrailPage />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
