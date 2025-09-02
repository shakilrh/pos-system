import { fetchUserProfile } from './UserService';

// AuthService.ts
export interface User {
    _id: string;
    name: string;
    email: string;
    user_type: string;
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

interface Permission {
    _id: string;
    key: string;
    name: string;
    description: string;
}

interface MainPage {
    _id: string;
    key: string;
    name: string;
    description: string;
    permissions: Permission[];
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';
const TIMEOUT_MS = 10000;

export const createSlug = (storeName: string): string => {
    return storeName
        ? storeName
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
        : '';
};

export const decodeToken = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

export const fetchMainPages = async (token: string): Promise<MainPage[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/rolepermission/api/v1/pages/list`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.status === 401) {
            throw new Error('Unauthorized');
        }
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to fetch main pages');
        }
        return data.data?.data || [];
    } catch (err) {
        console.error('Error fetching main pages:', err);
        throw err;
    }
};

export const normalizeUser = (apiUser: any, email?: string): User => {
    return {
        _id: apiUser._id || apiUser.id || '',
        name: apiUser.name || 'User',
        email: apiUser.email || email || '',
        user_type: apiUser.user_type || 'customer',
        role_id: apiUser.role_id ? String(apiUser.role_id) : undefined,
        logoUrl: apiUser.logoUrl || '',
        store_name: apiUser.store_name || '',
        store_logo: apiUser.store_logo || '',
        phone: apiUser.phone || apiUser.phone_number || '',
        phone_number: apiUser.phone_number || apiUser.phone || '',
        addresses: apiUser.addresses || [],
        address: apiUser.address || (apiUser.addresses && apiUser.addresses[0]) || '',
        verified: apiUser.verified || false,
    };
};

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
    const timeout = new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), ms);
    });
    return Promise.race([promise, timeout]);
};

export const loginUser = async (email: string, passwordOrOtp: string, isCustomer: boolean = false): Promise<{ token: string, user: User }> => {
    const endpoint = isCustomer ? '/users/api/v1/customer-login' : '/users/api/v1/login';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isCustomer ? { email, code: passwordOrOtp } : { email, password: passwordOrOtp }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
    }

    const responseData = await response.json();
    const data = responseData.data?.data || responseData.data || {};
    const { token, ...apiUser } = data;

    if (!token) {
        throw new Error('No token received');
    }

    const normalizedUser = normalizeUser({
        ...apiUser,
        user_type: isCustomer ? 'customer' : apiUser.user_type || 'worker',
        role_id: isCustomer ? null : apiUser.role_id || null,
    }, email);

    return { token, user: normalizedUser };
};

export const getUserPermissions = async (token: string): Promise<{ userPermissions: string[], allPermissions: string[] }> => {
    try {
        const mainPages = await fetchMainPages(token);
        const permissions = mainPages.flatMap((page) => page.permissions.map((perm) => perm.key));

        const decodedToken = decodeToken(token);
        if (!decodedToken) {
            throw new Error('Failed to decode token');
        }

        const userPerms = decodedToken.user_type === 'isadmin'
            ? permissions
            : Array.isArray(decodedToken.permissions)
                ? decodedToken.permissions.filter((key: string) => typeof key === 'string')
                : [];

        return {
            userPermissions: userPerms,
            allPermissions: permissions
        };
    } catch (error) {
        console.error('Failed to fetch permissions:', error);
        return {
            userPermissions: [],
            allPermissions: []
        };
    }
};

export const refreshUserProfile = async (token: string): Promise<User> => {
    try {
        const updatedUser = await withTimeout(fetchUserProfile(token), TIMEOUT_MS);
        return normalizeUser(updatedUser);
    } catch (error) {
        console.error('Error refreshing user profile:', error);
        throw error;
    }
};