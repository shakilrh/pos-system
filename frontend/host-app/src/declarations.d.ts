// declarations.d.ts
declare module "remoteApp/Header" {
    import { ComponentType } from 'react';

    interface User {
        _id: string;
        name: string;
        email: string;
        user_type: string;
        role_id: string | null;
        profile?: any;
        logoUrl?: string;
        store_name?: string;
        store_logo?: string;
    }

    interface HeaderProps {
        onSidebarToggle: () => void;
        onNavigate: (path: string) => void;
        darkMode?: boolean;
        onDarkModeToggle?: () => void;
        onLogout: () => void;
        token: string | null;
        user: User | null;
        className?: string;
        restaurantSlug: string | null;
        storeName: string;
    }

    const Header: ComponentType<HeaderProps>;
    export default Header;
}

declare module "remoteApp/Footer" {
    import { ComponentType } from 'react';

    interface FooterProps {
        className?: string;
        sidebarOpen?: boolean;
        restaurantSlug?: string | null;
    }

    const Footer: ComponentType<FooterProps>;
    export default Footer;
}