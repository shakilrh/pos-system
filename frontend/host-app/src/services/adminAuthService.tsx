import toast from 'react-hot-toast';

interface ApiResponse<T = any> {
    statusCode: number;
    message: string;
    success: boolean;
    type: number;
    data?: { data: T };
    error?: string | null;
    details?: any;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';

const handleApiError = (response: ApiResponse, logout?: () => void): string => {
    if (!response.success) {
        console.error('API Error:', response);

        switch (response.error) {
            case 'BAD_REQUEST':
                return response.message || 'Invalid input provided';
            case 'ALREADY_EXISTS':
                return response.message || 'Admin with this email already exists';
            case 'UNAUTHORIZED':
                if (logout) {
                    logout();
                    window.location.href = '/login';
                }
                return response.message || 'Invalid email or password';
            case 'DATA_NOT_FOUND':
                return response.message || 'Resource not found';
            case 'CONFLICT':
                return response.message || 'Please try again';
            case 'FORBIDDEN':
                return response.message || 'Access denied';
            case 'MONGO_EXCEPTION':
                console.error('MongoDB Error Details:', response.details);
                return response.message || 'Database error occurred';
            case 'DB_ERROR':
                return response.message || 'Database error occurred';
            case 'INTERNAL_SERVER_ERROR':
            default:
                return response.message || 'An unexpected error occurred';
        }
    }
    return '';
};

export const adminAuthService = {
    /**
     * Register a new admin
     */
    registerAdmin: async (
        name: string,
        email: string,
        password: string,
        logo: File,
        storeName: string,
        logout?: () => void
    ): Promise<any> => {
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            formData.append('logo', logo);
            formData.append('store_name', storeName);

            const response = await fetch(`${API_BASE_URL}/users/api/v1/create-admin`, {
                method: 'POST',
                body: formData,
            });

            console.log(response)

            if (response.status === 401) {
                if (logout) {
                    logout();
                    window.location.href = '/login';
                }
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse = await response.json();

            if (!data.success) {
                const errorMessage = handleApiError(data, logout);
                throw new Error(errorMessage);
            }

            if (data.type !== 1) {
                throw new Error('Invalid response format');
            }

            return data.data?.data || data;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to register admin';
            throw new Error(message);
        }
    },

    /**
     * Login admin
     */
    loginAdmin: async (
        email: string,
        password: string,
        logout?: () => void
    ): Promise<any> => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/api/v1/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (response.status === 401) {
                if (logout) {
                    logout();
                    window.location.href = '/login';
                }
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse = await response.json();

            if (!data.success) {
                const errorMessage = handleApiError(data, logout);
                throw new Error(errorMessage);
            }

            if (data.type !== 1) {
                throw new Error('Invalid response format');
            }

            return data.data?.data || data;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to login';
            throw new Error(message);
        }
    }
};
