import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUserPermissions } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const login = async (userData) => {
    setUser(userData.user);
    // Convert permissions object to array
    const permissionsArray = Object.entries(userData.user.permissions || {}).map(([pageName, perms]) => ({
      pageName,
      canView: perms.canView,
      canEdit: perms.canEdit,
      canDelete: perms.canDelete
    }));
    setPermissions(permissionsArray);
    localStorage.setItem('token', userData.token);
    await fetchPermissions();
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
    localStorage.removeItem('token');
  };

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token && user && !user.isAdmin) {
        const response = await getUserPermissions();
        const permissionsArray = Object.entries(response.data.permissions || {}).map(([pageName, perms]) => ({
          pageName,
          canView: perms.canView,
          canEdit: perms.canEdit,
          canDelete: perms.canDelete
        }));
        setPermissions(permissionsArray);
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchPermissions();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
