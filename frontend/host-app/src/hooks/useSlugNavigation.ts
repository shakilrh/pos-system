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

const extractSlugFromPath = (pathname: string | null): string | null => {
    if (!pathname) return null;
    const segments = pathname.split('/').filter(Boolean);

    // FORCE: For public routes, ALWAYS return the slug
    if (pathname.startsWith('/public/') && segments.length >= 2) {
        console.log('Extracting slug from public route:', segments[1]);
        return segments[1]; // Return the slug (e.g., 'cheezious')
    }

    // For non-public routes, apply existing logic
    if (segments.length > 0 && !publicRoutes.some(route => {
        if (route === '/public/[slug]') return pathname.startsWith('/public/');
        return pathname.startsWith(route);
    })) {
        const firstSegment = segments[0];
        const directRoutes = ['Dashboard', 'Orders', 'MenuManagement', 'RoleAndUserManagement', 'Tables', 'Settings'];
        if (!directRoutes.includes(firstSegment)) {
            return firstSegment;
        }
    }
    return null;
};

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