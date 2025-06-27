import { useState, useEffect, useRef } from 'react';
import { usePopper } from 'react-popper';
import { Bars3Icon, UserCircleIcon, BellIcon } from '@heroicons/react/24/outline';
import UserService from '../services/UserService';

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
  const [storeData, setStoreData] = useState<{ store_name: string; store_logo: string }>({
    store_name: '',
    store_logo: '',
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  
  const { styles, attributes, update } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-end',
    modifiers: [
      { name: 'offset', options: { offset: [0, 8] } },
      { name: 'preventOverflow', options: { boundary: 'viewport' } },
      { name: 'flip', options: { fallbackPlacements: ['bottom-start', 'top-end', 'top-start'] } },
    ],
  });

  // Update popper position when dropdown opens
  useEffect(() => {
    if (isProfileOpen && update) {
      update();
    }
  }, [isProfileOpen, update]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isProfileOpen &&
        referenceElement &&
        popperElement &&
        !referenceElement.contains(event.target as Node) &&
        !popperElement.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen, referenceElement, popperElement]);

  // Fetch store data using service
  useEffect(() => {
    const fetchStoreData = async () => {
      if (!token) return;
      try {
        const response = await UserService.getUserDetails(token);
        setStoreData({
          store_name: response.store_name || 'Rasant POS',
          store_logo: response.store_logo || '/file.svg',
        });
      } catch (err) {
        console.error('Fetch store data error:', err);
        setStoreData({
          store_name: user?.store_name || 'Rasant POS',
          store_logo: user?.store_logo || '/file.svg',
        });
      }
    };

    fetchStoreData();
  }, [token, user]);

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
          {/*<button className="md:hidden text-gray-300 hover:text-white" onClick={onSidebarToggle}>
            <Bars3Icon className="w-6 h-6" />
          </button>*/}
          <div className="flex items-center gap-2">
            <img
              src={storeData.store_logo}
              alt="Store Logo"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-lg font-semibold tracking-tight">{storeData.store_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative text-gray-300 hover:text-white">
            <BellIcon className="w-6 h-6" />
          </button>
          <div className="relative">
            <button
              ref={setReferenceElement}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 text-gray-300 hover:text-white"
            >
              <UserCircleIcon className="w-6 h-6" />
              <span className="hidden md:block text-sm font-medium">{user?.name || 'Admin User'}</span>
            </button>
            {isProfileOpen && (
              <div
                ref={setPopperElement}
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