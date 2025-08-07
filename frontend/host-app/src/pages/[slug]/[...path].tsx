import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Dashboard from './../Dashboard/dashboard';
import Orders from './../Orders/orders';
import CreateOrder from './../Orders/createOrder';
import MenuManagement from './../MenuManagement';
import RoleAndUserManagement from './../RoleAndUserManagement';
import FloorTableManagement from './../Tables/FloorTableManagement';
import Profile from './../Settings/profile';
import Settings from './../Settings/settings';
import Site from '../Settings/site';
import NoAccess from './../NoAccess';

const componentMap: { [key: string]: React.ComponentType<any> } = {
    'Dashboard/dashboard': Dashboard,
    'Orders/orders': Orders,
    'Orders/createOrder': CreateOrder,
    'MenuManagement': MenuManagement,
    'RoleAndUserManagement': RoleAndUserManagement,
    'Tables/FloorTableManagement': FloorTableManagement,
    'Settings/settings': Settings,
    'Settings/site': Site,
    'Settings/profile': Profile,
    'NoAccess': NoAccess,
};

interface SlugPageProps {
    restaurantSlug?: string;
    storeName?: string;
    currentCurrency?: string;
}

export default function SlugPage(props: SlugPageProps) {
    const router = useRouter();
    const { slug, path } = router.query;
    const { isAuthenticated, isLoading, restaurantSlug } = useAuth();
    const [isValidSlug, setIsValidSlug] = useState<boolean | null>(null);

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            router.replace('/Registration/login');
            return;
        }

        const expectedSlug = restaurantSlug || '';
        if (slug === expectedSlug) {
            setIsValidSlug(true);
        } else {
            const currentPath = Array.isArray(path) ? path.join('/') : path || 'Dashboard/dashboard';
            router.replace(`/${expectedSlug}/${currentPath}`);
        }
    }, [slug, path, isAuthenticated, isLoading, restaurantSlug, router]);

    if (isLoading || isValidSlug === null) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg font-semibold text-gray-700">Validating restaurant...</p>
                </div>
            </div>
        );
    }

    if (!isValidSlug) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Restaurant</h1>
                    <p className="text-gray-600 mb-4">The restaurant URL you're trying to access is not valid.</p>
                    <button
                        onClick={() => router.replace('/Registration/login')}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    const componentPath = Array.isArray(path) ? path.join('/') : path || 'Dashboard/dashboard';
    const Component = componentMap[componentPath];

    if (!Component) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
                    <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
                    <button
                        onClick={() => router.replace(`/${slug}/Dashboard/dashboard`)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return <Component {...props} restaurantSlug={slug as string} currentPath={componentPath} />;
}

export async function getStaticPaths() {
    return {
        paths: [],
        fallback: 'blocking',
    };
}

export async function getStaticProps({ params }: { params: { slug: string; path: string[] } }) {
    return {
        props: {
            restaurantSlug: params.slug,
            path: params.path,
        },
        revalidate: 60,
    };
}