import { useState, useEffect, useRef } from 'react';
import { usePopper } from 'react-popper';
import { 
  Bars3Icon, 
  UserCircleIcon, 
  BellIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
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
    <header className="fixed top-0 left-0 w-full h-16 bg-background-secondary shadow-lg z-50 p-4 transition-theme border-b border-border-color">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/*<button className="md:hidden text-text-secondary hover:text-text-primary transition-colors" onClick={onSidebarToggle}>
            <Bars3Icon className="w-6 h-6" />
          </button>*/}
          <div className="flex items-center gap-2">
            <img
              src={storeData.store_logo}
              alt="Store Logo"
              className="w-8 h-8 rounded-full object-cover ring-2"
              style={{ ringColor: 'color-mix(in srgb, var(--primary-color) 20%, transparent)' }}
            />
            <span className="text-lg font-semibold tracking-tight text-text-primary">{storeData.store_name}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="relative p-2 rounded-lg transition-all duration-200 hover:scale-105"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--primary-color)';
              e.currentTarget.style.backgroundColor = 'var(--surface-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <BellIcon className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              ref={setReferenceElement}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-2 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--primary-color)';
                e.currentTarget.style.backgroundColor = 'var(--surface-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <UserCircleIcon className="w-5 h-5" />
              <span 
                className="hidden md:block text-sm font-medium"
                style={{ color: 'var(--text-color)' }}
              >
                {user?.name || 'Admin User'}
              </span>
            </button>
            {isProfileOpen && (
              <div
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
                className="w-56 rounded-xl shadow-xl border py-2 z-20 bg-white"
                css={{
                  backgroundColor: 'var(--background-secondary)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div 
                  className="px-4 py-3 border-b"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text-color)' }}
                  >
                    {user?.name || 'Admin User'}
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {user?.email || 'admin@rasant.com'}
                  </p>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-2 text-sm transition-all duration-200 flex items-center gap-3"
                  style={{ color: 'var(--text-color)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                    e.currentTarget.style.color = 'var(--primary-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-color)';
                  }}
                >
                  <UserIcon className="w-4 h-4" style={{ color: 'inherit' }} />
                  Profile
                </button>
                <button
                  onClick={handleSettingsClick}
                  className="w-full text-left px-4 py-2 text-sm transition-all duration-200 flex items-center gap-3"
                  style={{ color: 'var(--text-color)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-color)';
                    e.currentTarget.style.color = 'var(--primary-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-color)';
                  }}
                >
                  <Cog6ToothIcon className="w-4 h-4" style={{ color: 'inherit' }} />
                  Settings
                </button>
                <hr 
                  className="my-1"
                  style={{ borderColor: 'var(--border-color)' }}
                />
                <button
                  onClick={onLogout}
                  className="w-full text-left px-4 py-2 text-sm transition-all duration-200 flex items-center gap-3"
                  style={{ color: 'var(--text-color)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--error-color) 10%, transparent)';
                    e.currentTarget.style.color = 'var(--error-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-color)';
                  }}
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" style={{ color: 'var(--error-color)' }} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}