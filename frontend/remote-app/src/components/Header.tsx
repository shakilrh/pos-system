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

interface User {
  _id: string;
  name: string;
  email: string;
  user_type: string;
  role_id?: string;
  profile?: any;
  logoUrl?: string;
  store_name?: string;
  store_logo?: string;
}

interface HeaderProps {
  onSidebarToggle: () => void;
  onNavigate: (path: string) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onLogout: () => void;
  token: string | null;
  user: User | null;
  className?: string;
  restaurantSlug: string | null;
  storeName: string;
}

// --- Helper Functions for Avatar ---
const getInitials = (name: string): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

const getAvatarColor = (name: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F06292', '#AED581', '#FFB74D',
    '#81C784', '#64B5F6', '#A1887F', '#90A4AE', '#E57373'
  ];

  if (!name) return colors[0];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

// Avatar Component with fallback to initials
const Avatar = ({
                  src,
                  name,
                  size = 'md',
                  className = ''
                }: {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const shouldShowFallback = !src || imgError || src === '/file.svg';

  useEffect(() => {
    if (src && src !== '/file.svg') {
      setImgError(false);
      setImgLoading(true);
    } else {
      setImgLoading(false);
    }
  }, [src]);

  if (shouldShowFallback) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white border-2 ${className}`}
        style={{
          backgroundColor: getAvatarColor(name),
          borderColor: 'var(--primary-color)'
        }}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <div className="relative">
      {imgLoading && (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white border-2 ${className}`}
          style={{
            backgroundColor: getAvatarColor(name),
            borderColor: 'var(--primary-color)'
          }}
        >
          {getInitials(name)}
        </div>
      )}
      <img
        src={src}
        alt={`${name}'s avatar`}
        className={`${sizeClasses[size]} rounded-full object-cover border-2 ${className} ${imgLoading ? 'absolute top-0 left-0' : ''}`}
        style={{ borderColor: 'var(--primary-color)' }}
        onLoad={() => setImgLoading(false)}
        onError={() => {
          setImgError(true);
          setImgLoading(false);
        }}
      />
    </div>
  );
};

export default function Header({
                                 onSidebarToggle,
                                 onNavigate,
                                 darkMode,
                                 onDarkModeToggle,
                                 onLogout,
                                 token,
                                 user,
                                 className,
                                 restaurantSlug,
                                 storeName,
                               }: HeaderProps) {
  const [storeData, setStoreData] = useState<{ store_name: string; store_logo: string }>({
    store_name: '',
    store_logo: '',
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(false);

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

  // Fetch detailed user data and store data using service
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        console.log('No token available for fetching user data');
        // Use fallback data from props
        setStoreData({
          store_name: user?.store_name || 'Rasant POS',
          store_logo: user?.store_logo || '/file.svg',
        });
        setUserDetails(user);
        return;
      }

      setIsLoadingUserDetails(true);
      try {
        console.log('Fetching user details with token:', token);
        const response = await UserService.getUserDetails(token);
        console.log('User details response:', response);

        // Set user details from API response
        setUserDetails(response);

        // Set store data from API response with fallbacks
        setStoreData({
          store_name: response.store_name || user?.store_name || 'Rasant POS',
          store_logo: response.store_logo || user?.store_logo || '/file.svg',
        });
      } catch (err) {
        console.error('Fetch user data error:', err);
        // Use fallback data from props in case of error
        setStoreData({
          store_name: user?.store_name || 'Rasant POS',
          store_logo: user?.store_logo || '/file.svg',
        });
        setUserDetails(user);
      } finally {
        setIsLoadingUserDetails(false);
      }
    };

    fetchUserData();
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
    onNavigate('/Settings/profile');
    setIsProfileOpen(false);
  };

  const handleSettingsClick = () => {
    onNavigate('/Settings/settings');
    setIsProfileOpen(false);
  };

  // Get user display name with proper fallbacks
  const getUserDisplayName = () => {
    if (isLoadingUserDetails) return 'Loading...';
    return userDetails?.name || user?.name || 'User';
  };

  // Get user email with proper fallbacks
  const getUserEmail = () => {
    if (isLoadingUserDetails) return 'Loading...';
    return userDetails?.email || user?.email || 'user@example.com';
  };

  // Get user avatar URL with proper fallbacks - only return actual user photos, not store logos
  const getUserAvatar = () => {
    const avatar = userDetails?.logoUrl || user?.logoUrl;
    // Only return if it's a valid user avatar, not default file.svg or store logo
    return (avatar && avatar !== '/file.svg') ? avatar : undefined;
  };

  console.log('Header render - Current user data:', {
    user,
    userDetails,
    displayName: getUserDisplayName(),
    email: getUserEmail(),
    isLoadingUserDetails
  });

  return (
    <header className="fixed top-0 left-0 w-full h-16 shadow-lg z-50 p-4 transition-theme border-b"
            style={{
              backgroundColor: 'var(--background-secondary)',
              borderColor: 'var(--border-color)'
            }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src={storeData.store_logo}
              alt="Store Logo"
              className="w-8 h-8 rounded-full object-cover ring-2"
              style={{ ringColor: 'color-mix(in srgb, var(--primary-color) 20%, transparent)' }}
              onError={(e) => {
                e.currentTarget.src = '/file.svg';
              }}
            />
            <span className="text-lg font-semibold tracking-tight"
                  style={{ color: 'var(--text-color)' }}>
              {storeData.store_name}
            </span>
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
              <div className="flex items-center gap-2">
                <Avatar
                  src={getUserAvatar()}
                  name={getUserDisplayName()}
                  size="sm"
                />
                <span
                  className="hidden md:block text-sm font-medium"
                  style={{ color: 'var(--text-color)' }}
                >
                  {getUserDisplayName()}
                </span>
              </div>
            </button>

            {isProfileOpen && (
              <div
                ref={setPopperElement}
                style={{
                  ...styles.popper,
                  backgroundColor: 'var(--surface-color)',
                  borderColor: 'var(--border-color)'
                }}
                {...attributes.popper}
                className="w-64 rounded-xl shadow-xl border py-2 z-20"
              >
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={getUserAvatar()}
                      name={getUserDisplayName()}
                      size="md"
                    />
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: 'var(--text-color)' }}
                      >
                        {getUserDisplayName()}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {getUserEmail()}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-2 text-sm transition-all duration-200 flex items-center gap-3"
                  style={{ color: 'var(--text-color)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
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
                    e.currentTarget.style.backgroundColor = 'var(--background-secondary)';
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
