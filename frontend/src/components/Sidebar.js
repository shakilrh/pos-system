import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';

// Sidebar component with themed styling
const Sidebar = () => {
  const { user, permissions, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items with required permissions (excluding logout)
  const navItems = [
    { path: '/dashboard', name: 'Dashboard', requiredPermission: 'dashboard' },
    { path: '/inventory', name: 'Inventory', requiredPermission: 'inventory' },
    { path: '/orders', name: 'Orders', requiredPermission: 'listOrders' },
    { path: '/checkout', name: 'Checkout', requiredPermission: 'checkout' },
    { path: '/role-management', name: 'Role Management', requiredPermission: 'roleManagement' },
  ];

  // Logout item (always visible if user is authenticated)
  const logoutItem = { path: '/logout', name: 'Logout', onClick: handleLogout };

  return (
    <div className="sidebar" style={{
      backgroundColor: 'var(--sidebar-bg)',
      color: 'var(--sidebar-text)',
      height: '100vh',
      width: '250px',
      position: 'fixed',
      top: 0,
      left: 0,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      zIndex: 1000
    }}>
      <div>
        <h2 style={{
          margin: '0 0 20px 0',
          fontSize: '1.5rem',
          fontWeight: 500,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          paddingBottom: '10px'
        }}>
          POS System
        </h2>
        <nav>
          {navItems.map(item => {
            const hasPermission = permissions.some(perm =>
              perm.pageName === item.requiredPermission && perm.canView
            );
            return hasPermission && (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '12px 15px',
                  margin: '5px 0',
                  color: 'var(--sidebar-text)',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
                  transition: 'all 0.3s ease',
                  cursor: item.onClick ? 'pointer' : 'default'
                })}
                onMouseOver={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!e.currentTarget.classList.contains('active')) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={(e) => item.onClick && item.onClick(e)}
              >
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div>
        {user && (
          <NavLink
            key={logoutItem.path}
            to={logoutItem.path}
            className="nav-item logout-button"
            style={{
              display: 'block',
              padding: '12px 15px',
              margin: '5px 0',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '5px',
              backgroundColor: '#dc3545', // Red background for logout button
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              textAlign: 'center',
              fontWeight: 500
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#c82333'; // Darker red on hover
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#dc3545'; // Reset to original red
            }}
            onClick={(e) => {
              e.preventDefault(); // Prevent navigation
              logoutItem.onClick();
            }}
          >
            {logoutItem.name}
          </NavLink>
        )}
      </div>
    </div>
  );
};
// /*test
export default Sidebar;
