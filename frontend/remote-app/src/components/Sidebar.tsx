import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeIcon, CogIcon, UserIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
  className: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ className, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const router = useRouter();
  const [theme, setTheme] = useState('default');

  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'default';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const handleThemeChange = (e: CustomEvent) => {
      const { theme: newTheme } = e.detail;
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };
    window.addEventListener('themeChange', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeChange', handleThemeChange as EventListener);
  }, []);

  const navigate = (path: string) => {
    router.push(path);
  };

  return (
    <aside className={`${className} flex flex-col transition-all duration-300 text-white`}>
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 text-white"
          >
            <HomeIcon className="w-6 h-6" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 text-white"
          >
            <UserIcon className="w-6 h-6" />
            {sidebarOpen && <span>Profile</span>}
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-700 text-white"
          >
            <CogIcon className="w-6 h-6" />
            {sidebarOpen && <span>Settings</span>}
          </button>
        </nav>
      </div>
    </aside>
  );
}