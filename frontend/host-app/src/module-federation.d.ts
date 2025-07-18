interface User {
  role_id?: string | null;
  name?: string | null;
  store_name?: string | null;
  store_logo?: string | null;
  logoUrl?: string | null;
  email?: string | null;
}

interface HeaderProps {
  onSidebarToggle: () => void;
  onNavigate: (path: string) => void;
  onLogout: () => Promise<void>; // <-- CHANGE THIS
  token: string | null;
  user: User | null;
  className?: string;
}

declare module 'remoteApp/Header' {
  import { ComponentType } from 'react';
  const Header: ComponentType<HeaderProps>;
  export default Header;
}

declare module 'remoteApp/Sidebar' {
  import { ComponentType } from 'react';
  // Assuming Sidebar also needs userPermissions
  const Sidebar: ComponentType<{ className?: string, userPermissions: string[], sidebarOpen: boolean, setSidebarOpen: (open: boolean) => void }>;
  export default Sidebar;
}

declare module 'remoteApp/Footer' {
  import { ComponentType } from 'react';
  const Footer: ComponentType;
  export default Footer;
}

declare module 'remoteApp/AuthContext' {
  import { ReactNode } from 'react';
  export function AuthProvider({ children }: { children: ReactNode }): JSX.Element;
  export function useAuth(): any; // Adjust based on actual AuthContext type
}