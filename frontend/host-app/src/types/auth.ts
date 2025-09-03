export interface User {
    _id: string;
    name: string;
    email: string;
    user_type: string; // 'worker', 'isadmin', or 'customer'
    role_id?: string;
    profile?: any;
    logoUrl?: string;
    store_name?: string;
    store_logo?: string;
    phone?: string;
    phone_number?: string;
    addresses?: string[];
    address?: string;
    verified?: boolean;
}

export interface Permission {
    _id: string;
    key: string;
    name: string;
    description: string;
}

export interface MainPage {
    _id: string;
    key: string;
    name: string;
    description: string;
    permissions: Permission[];
}

export interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    profileLoading: boolean;
    profileError: string | null;
    user: User | null;
    user_type?: string;
    token: string | null;
    userPermissions: string[];
    permissionsLoaded: boolean;
    allPermissions: string[];
    storeName: string;
    refreshUserProfile: () => Promise<void>;
    restaurantSlug: string;
    login: (email: string, passwordOrOtp: string, isCustomer?: boolean) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
}