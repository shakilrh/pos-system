import { useState, useRef } from 'react';
import { usePopper } from 'react-popper';
import { Bars3Icon, UserCircleIcon, BellIcon } from '@heroicons/react/24/outline';

export default function Header({ onSidebarToggle, onNavigate }: { onSidebarToggle: () => void; onNavigate: (path: string) => void; }) {
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
            <span className="text-indigo-400 text-xl">🍽️</span>
            <span className="text-lg font-semibold tracking-tight">Rasant POS</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative text-gray-300 hover:text-white">
            <BellIcon className="w-6 h-6" />
            {/* <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span> */}
          </button>
          <div className="relative">
            <button
              ref={referenceRef}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 text-gray-300 hover:text-white"
            >
              <UserCircleIcon className="w-6 h-6" />
              <span className="hidden md:block text-sm font-medium">Admin User</span>
            </button>
            {isProfileOpen && (
              <div
                ref={popperRef}
                style={styles.popper}
                {...attributes.popper}
                className="w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Admin User</p>
                  <p className="text-xs text-gray-500">admin@rasant.com</p>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}