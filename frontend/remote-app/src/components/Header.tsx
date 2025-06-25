import { useState, useEffect, useRef } from 'react';
import { usePopper } from 'react-popper';
import { Bars3Icon, UserCircleIcon, BellIcon } from '@heroicons/react/24/outline';

export default function Header({
  onSidebarToggle,
  onNavigate,
  darkMode,
  onDarkModeToggle,
  onLogout,
  token,
  user,
}: {
  onSidebarToggle: () => void;
  onNavigate: (path: string) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onLogout: () => void;
  token: string | null;
  user: any | null;
}) {
  const [logo, setLogo] = useState<string>('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const referenceRef = useRef<HTMLButtonElement>(null);
  const popperRef = useRef<HTMLDivElement>(null);
  const { styles, attributes } = usePopper(referenceRef.current, popperRef.current, {
    placement: 'bottom-end',
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      { name: 'preventOverflow', options: { boundary: 'viewport' } },
      { name: 'flip', options: { fallbackPlacements: ['bottom-start', 'top-end', 'top-start'] } },
    ],
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isProfileOpen &&
        referenceRef.current &&
        popperRef.current &&
        !referenceRef.current.contains(event.target as Node) &&
        !popperRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  // Fetch logo from backend
  useEffect(() => {
    const fetchLogo = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://192.168.18.107:3000/users/api/v1/details', {
          method: 'GET',
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch logo');
        const response = await res.json();
        const userData = response.data.data.user;
        setLogo(userData.logoUrl || '');
      } catch (err) {
        console.error('Fetch logo error:', err);
      }
    };

    fetchLogo();
  }, [token]);

  // Set logo from user context if available (fallback)
  useEffect(() => {
    setLogo(user?.logoUrl || '');
  }, [user]);

  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
      const { theme } = e.detail;
      document.documentElement.setAttribute('data-theme', theme);
    };
    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeChange', handleThemeChange as EventListener);
  }, []);

  const handleProfileClick = () => {
    onNavigate('/profile');
    setIsProfileOpen(false);
  };

  const handleSettingsClick = () => {
    onNavigate('/settings');
    setIsProfileOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-gray-100 shadow-lg z-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden text-gray-300 hover:text-white" onClick={onSidebarToggle}>
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src={logo || '/file.svg'}
              alt="Logo"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-lg font-semibold tracking-tight">Rasant POS</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative text-gray-300 hover:text-white">
            <BellIcon className="w-6 h-6" />
          </button>
          <div className="relative">
            <button
              ref={referenceRef}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 text-gray-300 hover:text-white"
            >
              <UserCircleIcon className="w-6 h-6" />
              <span className="hidden md:block text-sm font-medium">{user?.name || 'Admin User'}</span>
            </button>
            {isProfileOpen && (
              <div
                ref={popperRef}
                style={styles.popper}
                {...attributes.popper}
                className="w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'admin@rasant.com'}</p>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  👤 Profile
                </button>
                <button
                  onClick={handleSettingsClick}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ⚙️ Settings
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}