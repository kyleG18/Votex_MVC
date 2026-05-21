import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HiOutlineChartBarSquare, 
  HiOutlineUsers, 
  HiOutlineUserGroup,
  HiOutlineDocumentChartBar,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineShieldCheck,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineClipboardDocumentList
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
    // Insert Manage Admins before Settings
    visibleNavItems.splice(4, 0, { path: '/admin/manage-admins', label: 'Manage Admins', icon: HiOutlineShieldCheck });
    // Add Audit Trail at the end (before settings)
    visibleNavItems.push({ path: '/admin/audit-trail', label: 'Audit Trail', icon: HiOutlineClipboardDocumentList });
  }

  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('votex_session_role');
  };

  const closeSidebar = () => {
    if (window.innerWidth <= 900) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        className="sidebar__mobile-toggle" 
        onClick={() => setIsOpen(true)}
      >
        <HiOutlineBars3 />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="sidebar__overlay" onClick={() => setIsOpen(false)}></div>
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} id="admin-sidebar">
        {/* Header */}
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <img src="/jpc-logo.jpg" alt="John Paul College" className="sidebar__logo-img" />
            <span className="sidebar__logo-text">VoteX</span>
          </div>
          <button className="sidebar__close-btn" onClick={() => setIsOpen(false)}>
            <HiOutlineXMark />
          </button>
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
                onClick={closeSidebar}
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
    </>
  );
}

export default Sidebar;
