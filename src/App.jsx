import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Component/sidebar/sidebar';
import LoginPage from './login/page';
import RegisterPage from './register/page';
import VoteCastingPage from './vote-casting/page';
import VoteSuccessPage from './vote-success/page';
import DashboardPage from './dashboard/page';
import ManageCandidatesPage from './manage-candidates/page';
import ManageStudentsPage from './manage-students/page';
import ReportsPage from './reports/page';
import SettingsPage from './settings/page';
import ManageAdminsPage from './manage-admins/page';
import AdminLoginPage from './admin-login/page';
import AdminRegisterPage from './admin-register/page';
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
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
