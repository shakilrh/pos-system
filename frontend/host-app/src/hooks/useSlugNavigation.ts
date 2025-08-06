import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export interface NavigationHook {
    navigate: (path: string) => void;
    currentSlug: string | null;
    storeName: string;
    isSlugReady: boolean;
    getSluggedPath: (path: string) => string;
}

export const useSlugNavigation = (): NavigationHook => {
    const router = useRouter();
    const { restaurantSlug, storeName, isLoading } = useAuth();
    const [currentSlug, setCurrentSlug] = useState<string | null>(null);
    const [isSlugReady, setIsSlugReady] = useState(false);

    const extractSlugFromPath = useCallback((pathname: string): string | null => {
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
            const firstSegment = segments[0];
            const directRoutes = ['Dashboard', 'Orders', 'MenuManagement', 'RoleAndUserManagement', 'Tables', 'Settings', 'Registration', 'NoAccess'];
            if (!directRoutes.includes(firstSegment)) {
                return firstSegment;
            }
        }
        return null;
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const pathSlug = extractSlugFromPath(router.pathname);
        setCurrentSlug(restaurantSlug || pathSlug || '');
        setIsSlugReady(true);
    }, [router.pathname, restaurantSlug, isLoading, extractSlugFromPath]);

    const getSluggedPath = useCallback(
        (path: string): string => {
            if (!currentSlug) return path;
            const cleanPath = path.startsWith('/') ? path.substring(1) : path;
            return `/${currentSlug}/${cleanPath}`;
        },
        [currentSlug]
    );

    const navigate = useCallback(
        (path: string) => {
            const fullPath = getSluggedPath(path);
            router.push(fullPath);
        },
        [router, getSluggedPath]
    );

    return {
        navigate,
        currentSlug,
        storeName,
        isSlugReady,
        getSluggedPath,
    };
};

export const createSlugFromStoreName = (storeName: string): string => {
    return storeName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

export const getCurrentRestaurantContext = () => {
    const slug = localStorage.getItem('restaurantSlug') || '';
    const storeName = localStorage.getItem('storeName') || '';
    return { slug, storeName };
};