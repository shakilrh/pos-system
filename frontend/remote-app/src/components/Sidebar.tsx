// remote-app/src/components/Sidebar.tsx
import { FC } from 'react';

interface SidebarProps {
  className?: string;
}

const Sidebar: FC<SidebarProps> = ({ className = '' }) => {
  return (
    <aside className={`w-64 bg-gray-100 p-4 fixed top-16 left-0 h-[calc(100vh-8rem)] shadow-md z-0 ${className}`}>
      <div className="text-gray-800 font-semibold">Remote Sidebar Component</div>
    </aside>
  );
};

export default Sidebar;
