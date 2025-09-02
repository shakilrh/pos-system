// AppService.tsx
interface UserDetails {
    user: {
        theme?: string;
        currency?: string;
        store_name?: string;
        slug?: string;
        user_type?: string;
        store_logo?: string;
        role_id?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

interface ApiResponse {
    statusCode: number;
    message: string;
    success: boolean;
    error?: string;
    type: number;
    data?: {
        data?: UserDetails;
        [key: string]: any;
    };
}

interface StoreDetails {
    store_logo?: string;
    store_name?: string;
    slug?: string;
    [key: string]: any;
}

interface PublicStoreResponse {
    statusCode: number;
    message: string;
    success: boolean;
    error?: string;
    data?: {
        data?: StoreDetails;
        [key: string]: any;
    };
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

// Error handling utility similar to RoleService
const handleApiError = (response: ApiResponse, logout: () => void): string => {
    if (!response.success) {
        console.error('API Error:', response);
        switch (response.error) {
            case 'DATA_NOT_FOUND':
                return 'User data not found';
            case 'BAD_REQUEST':
                return response.message || 'Invalid request. Please check your data and try again';
            case 'ALREADY_EXISTS':
                return response.message || 'Data already exists';
            case 'CONFLICT':
                return response.message || 'Conflict occurred. Please refresh and try again';
            case 'FORBIDDEN':
                return 'You do not have permission to access this resource';
            case 'UNAUTHORIZED':
                logout();
                return 'Your session has expired. Please log in again';
            case 'MONGO_EXCEPTION':
                return 'Database error occurred. Please try again later';
            case 'DB_CHECK_FAIL':
                return response.message || 'Database validation failed';
            case 'VALIDATION_ERROR':
                return response.message || 'Please check your input and try again';
            case 'DUPLICATE_KEY':
                return 'Duplicate data found';
            case 'INVALID_ID':
                return 'Invalid identifier provided';
            default:
                return response.message || 'An unexpected error occurred. Please try again';
        }
    }
    return '';
};

// Helper function to validate network response
const validateResponse = async (response: Response): Promise<ApiResponse> => {
    if (!response.ok) {
        // Handle different HTTP status codes
        switch (response.status) {
            case 400:
                throw new Error('Invalid request. Please check your input');
            case 401:
                throw new Error('Unauthorized');
            case 403:
                throw new Error('Access denied');
            case 404:
                throw new Error('Resource not found');
            case 409:
                throw new Error('Resource already exists');
            case 422:
                throw new Error('Validation failed');
            case 500:
                throw new Error('Server error. Please try again later');
            default:
                throw new Error(`Request failed with status ${response.status}`);
        }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format from server');
    }

    return await response.json();
};

// Fetch user details and settings
export const fetchUserDetails = async (token: string, logout: () => void): Promise<UserDetails> => {
    try {
        if (!token) {
            throw new Error('Authentication token is required');
        }

        const response = await fetch(`${API_BASE_URL}/users/api/v1/details`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please log in again');
        }

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data, logout));
        }

        if (data.success && data.data && 'data' in data.data) {
            return (data.data as { data: UserDetails }).data;
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to fetch user details. Please check your connection and try again');
    }
};

// Fetch public store details
export const fetchPublicStoreDetails = async (slug: string): Promise<StoreDetails> => {
    try {
        if (!slug || !slug.trim()) {
            throw new Error('Store slug is required');
        }

        const response = await fetch(`${API_BASE_URL}/users/api/v1/public/store/${slug.trim()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            switch (response.status) {
                case 404:
                    throw new Error('Store not found');
                case 400:
                    throw new Error('Invalid store identifier');
                case 500:
                    throw new Error('Server error. Please try again later');
                default:
                    throw new Error(`Request failed with status ${response.status}`);
            }
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Invalid response format from server');
        }

        const data: PublicStoreResponse = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch store details');
        }

        if (data.success && data.data && 'data' in data.data) {
            return (data.data as { data: StoreDetails }).data;
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to fetch store details. Please check your connection and try again');
    }
};

// Theme management utilities
export const applyThemeToDOM = (selectedTheme: string): void => {
    try {
        console.log('Applying theme to DOM:', selectedTheme);

        // Remove existing theme classes
        document.documentElement.classList.remove(
            'theme-default', 'theme-blue', 'theme-green',
            'theme-professional', 'theme-warm-minimal', 'theme-dark-pro'
        );

        // Add new theme class
        document.documentElement.classList.add(`theme-${selectedTheme}`);
        document.documentElement.setAttribute('data-theme', selectedTheme);

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChange', {
            detail: { theme: selectedTheme }
        }));

        // Save to localStorage
        localStorage.setItem('appTheme', selectedTheme);

        // Force DOM reflow for theme application
        document.documentElement.style.display = 'none';
        document.documentElement.offsetHeight; // Trigger reflow
        document.documentElement.style.display = '';
    } catch (error) {
        console.error('Error applying theme:', error);
    }
};

// Currency management utilities
export const applyCurrencyToDOM = (selectedCurrency: string): void => {
    try {
        console.log('Applying currency to DOM:', selectedCurrency);

        const currencySymbol = {
            pkr: '₨',
            dollar: '$',
            euro: '€'
        }[selectedCurrency] || '₨';

        // Set currency attributes
        document.documentElement.setAttribute('data-currency', selectedCurrency);
        document.documentElement.setAttribute('data-currency-symbol', currencySymbol);

        // Dispatch currency change event
        window.dispatchEvent(new CustomEvent('currencyChange', {
            detail: { currency: selectedCurrency, symbol: currencySymbol }
        }));

        // Save to localStorage
        localStorage.setItem('appCurrency', selectedCurrency);

        // Set CSS custom properties
        document.documentElement.style.setProperty('--current-currency', selectedCurrency);
        document.documentElement.style.setProperty('--current-currency-symbol', currencySymbol);

        console.log('Currency applied successfully:', { selectedCurrency, currencySymbol });
    } catch (error) {
        console.error('Error applying currency:', error);
    }
};

// Local storage utilities
export const getStoredSettings = (): {
    theme: string;
    currency: string;
    slug: string;
    storeName: string;
} => {
    return {
        theme: localStorage.getItem('appTheme') || 'default',
        currency: localStorage.getItem('appCurrency') || 'pkr',
        slug: localStorage.getItem('restaurantSlug') || '',
        storeName: localStorage.getItem('storeName') || ''
    };
};

export const saveSettingsToStorage = (settings: {
    theme?: string;
    currency?: string;
    slug?: string;
    storeName?: string;
}): void => {
    try {
        if (settings.theme) localStorage.setItem('appTheme', settings.theme);
        if (settings.currency) localStorage.setItem('appCurrency', settings.currency);
        if (settings.slug !== undefined) localStorage.setItem('restaurantSlug', settings.slug);
        if (settings.storeName !== undefined) localStorage.setItem('storeName', settings.storeName);
    } catch (error) {
        console.error('Error saving settings to storage:', error);
    }
};

export const clearStoredSettings = (): void => {
    try {
        localStorage.removeItem('restaurantSlug');
        localStorage.removeItem('storeName');
        // Note: We might want to keep theme and currency preferences
        // localStorage.removeItem('appTheme');
        // localStorage.removeItem('appCurrency');
    } catch (error) {
        console.error('Error clearing stored settings:', error);
    }
};

// Utility functions for slug and path management
export const createSlug = (storeName: string): string => {
    return storeName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

export const extractSlugFromPath = (pathname: string | null): string | null => {
    if (!pathname) return null;

    const publicRoutes = ['/Registration/login', '/Registration/forgotPassword', '/Registration/registerAdmin', '/public/[slug]', '/NoAccess'];
    const isPublicRoute = (path: string): boolean => {
        if (path.startsWith('/public/')) return true;
        return publicRoutes.some(route => {
            if (route === '/public/[slug]') return path.startsWith('/public/');
            return path === route || path.startsWith(route);
        });
    };

    const segments = pathname.split('/').filter(Boolean);

    if (pathname.startsWith('/public/') && segments.length >= 2) {
        return segments[1];
    }

    if (segments.length > 0 && !isPublicRoute(pathname)) {
        const firstSegment = segments[0];
        const directRoutes = ['Dashboard', 'Orders', 'MenuManagement', 'RoleAndUserManagement', 'Tables', 'Settings'];
        if (!directRoutes.includes(firstSegment)) {
            return firstSegment;
        }
    }

    return null;
};

export const getPathWithoutSlug = (pathname: string | null, slug: string | null): string => {
    if (!pathname) return '/';
    if (pathname.startsWith('/public/')) return pathname;
    if (!slug) return pathname;
    return pathname.replace(`/${slug}`, '') || '/';
};

// Notification utilities
export const showThemeChangeNotification = (themeName: string): void => {
    try {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.theme-change-notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = 'theme-change-notification fixed top-6 right-6 z-[9999] transform translate-x-full opacity-0 transition-all duration-500 ease-out';
        notification.innerHTML = `
      <div class="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm overflow-hidden min-w-[320px] max-w-[400px]">
        <div class="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 animate-pulse"></div>
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400"></div>
        <div class="relative p-4 flex items-center space-x-4">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-bounce">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z"></path>
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-white/90 mb-1">Theme Updated</div>
            <div class="text-lg font-bold text-white capitalize">${themeName} Theme Active</div>
            <div class="text-xs text-white/70 mt-1">Changes synced across devices</div>
          </div>
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div class="progress-bar h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-[4000ms] ease-linear" style="width: 100%"></div>
        </div>
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="particle absolute w-2 h-2 bg-white/30 rounded-full animate-ping" style="top: 20%; left: 10%; animation-delay: 0s;"></div>
          <div class="particle absolute w-1 h-1 bg-white/40 rounded-full animate-ping" style="top: 60%; right: 15%; animation-delay: 0.5s;"></div>
          <div class="particle absolute w-1.5 h-1.5 bg-white/25 rounded-full animate-ping" style="bottom: 30%; left: 20%; animation-delay: 1s;"></div>
        </div>
      </div>
    `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
            notification.classList.add('translate-x-0', 'opacity-100');
        }, 50);

        // Add hover effects
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateX(0) scale(1.02)';
        });

        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0) scale(1)';
        });

        // Start progress bar animation
        setTimeout(() => {
            const progressBar = notification.querySelector('.progress-bar') as HTMLElement;
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }, 100);

        // Auto-dismiss notification
        setTimeout(() => {
            notification.classList.add('animate-pulse');
            setTimeout(() => {
                notification.style.transform = 'translateX(100%) scale(0.8)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 500);
            }, 200);
        }, 4000);

        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%) scale(0.8)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        });
    } catch (error) {
        console.error('Error showing theme notification:', error);
    }
};

export const showCurrencyChangeNotification = (currencyName: string): void => {
    try {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.currency-change-notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = 'currency-change-notification fixed top-6 right-6 z-[9999] transform translate-x-full opacity-0 transition-all duration-500 ease-out';
        notification.innerHTML = `
      <div class="relative bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 text-white rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm overflow-hidden min-w-[320px] max-w-[400px]">
        <div class="absolute inset-0 bg-gradient-to-r from-green-400/10 via-teal-400/10 to-blue-400/10 animate-pulse"></div>
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400"></div>
        <div class="relative p-4 flex items-center space-x-4">
          <div class="flex-shrink-0">
            <div class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-bounce">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .672-3 1.5S10.343 11 12 11s3-.672 3-1.5S13.657 8 12 8zm0 8c-1.657 0-3 .672-3 1.5S10.343 19 12 19s3-.672 3-1.5S13.657 16 12 16zm0-12c-1.657 0-3 .672-3 1.5S10.343 7 12 7s3-.672 3-1.5S13.657 4 12 4z"></path>
              </svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-white/90 mb-1">Currency Updated</div>
            <div class="text-lg font-bold text-white capitalize">${currencyName} Currency Active</div>
            <div class="text-xs text-white/70 mt-1">Changes synced across devices</div>
          </div>
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
        </div>
        <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div class="progress-bar h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-[4000ms] ease-linear" style="width: 100%"></div>
        </div>
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="particle absolute w-2 h-2 bg-white/30 rounded-full animate-ping" style="top: 20%; left: 10%; animation-delay: 0s;"></div>
          <div class="particle absolute w-1 h-1 bg-white/40 rounded-full animate-ping" style="top: 60%; right: 15%; animation-delay: 0.5s;"></div>
          <div class="particle absolute w-1.5 h-1.5 bg-white/25 rounded-full animate-ping" style="bottom: 30%; left: 20%; animation-delay: 1s;"></div>
        </div>
      </div>
    `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
            notification.classList.add('translate-x-0', 'opacity-100');
        }, 50);

        // Add hover effects
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateX(0) scale(1.02)';
        });

        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0) scale(1)';
        });

        // Start progress bar animation
        setTimeout(() => {
            const progressBar = notification.querySelector('.progress-bar') as HTMLElement;
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }, 100);

        // Auto-dismiss notification
        setTimeout(() => {
            notification.classList.add('animate-pulse');
            setTimeout(() => {
                notification.style.transform = 'translateX(100%) scale(0.8)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 500);
            }, 200);
        }, 4000);

        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%) scale(0.8)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        });
    } catch (error) {
        console.error('Error showing currency notification:', error);
    }
};

// Dispatch settings loaded event
export const dispatchSettingsLoadedEvent = (settings: {
    theme: string;
    currency: string;
    slug: string;
    storeName: string;
    userType: string;
}): void => {
    try {
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('settingsLoaded', {
                detail: settings
            }));
        }, 100);
    } catch (error) {
        console.error('Error dispatching settings loaded event:', error);
    }
};