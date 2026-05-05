import { NavLink, useLocation } from 'react-router-dom';
import { 
  HiOutlineChartBarSquare, 
  HiOutlineUsers, 
  HiOutlineUserGroup,
  HiOutlineDocumentChartBar,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineShieldCheck
} from 'react-icons/hi2';
import './sidebar.css';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: HiOutlineChartBarSquare },
  { path: '/admin/manage-candidates', label: 'Manage Candidates', icon: HiOutlineUsers },
  { path: '/admin/manage-students', label: 'Manage Students', icon: HiOutlineUserGroup },
  { path: '/admin/reports', label: 'Reports', icon: HiOutlineDocumentChartBar },
  { path: '/admin/settings', label: 'Settings', icon: HiOutlineCog6Tooth },
];

function Sidebar() {
  const location = useLocation();
  const role = localStorage.getItem('votex_session_role');
  const isSuperAdmin = role === 'superadmin';

  const visibleNavItems = [...navItems];
  if (isSuperAdmin) {
    // Insert before Settings
    visibleNavItems.splice(4, 0, { path: '/admin/manage-admins', label: 'Manage Admins', icon: HiOutlineShieldCheck });
  }

  const handleLogout = () => {
    localStorage.removeItem('votex_session_role');
  };

  return (
    <aside className="sidebar" id="admin-sidebar">
      {/* Header */}
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <img src="/jpc-logo.jpg" alt="John Paul College" className="sidebar__logo-img" />
          <span className="sidebar__logo-text">VoteX</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="sidebar__link-icon" />
              <span className="sidebar__link-text">{item.label}</span>
              {isActive && <div className="sidebar__link-indicator" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="sidebar__footer">
        <NavLink to="/login" className="sidebar__link sidebar__link--logout" id="nav-logout" onClick={handleLogout}>
          <HiOutlineArrowRightOnRectangle className="sidebar__link-icon" />
          <span className="sidebar__link-text">Log Out</span>
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;
