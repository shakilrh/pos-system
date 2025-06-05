// host-app/src/module-federation.d.ts
declare module 'remoteApp/Header' {
  import { ComponentType } from 'react';
  const Header: ComponentType;
  export default Header;
}

declare module 'remoteApp/Sidebar' {
  import { ComponentType } from 'react';
  const Sidebar: ComponentType;
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
