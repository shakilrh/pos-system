interface OrderItem {
    product_id: string;
    quantity: number;
}

interface OrderRequest {
    items: OrderItem[];
    delivery_address: string;
    phone_number: string;
    use_redeem_points?: boolean;
    rider_note?: string;
}

interface OrderResponse {
    _id: string;
    items: OrderItem[];
    delivery_address: string;
    phone_number: string;
    rider_note?: string;
    total_amount: number;
    status: string;
    redeemed_points?: number;
    earned_points?: number;
    created_at: string;
    successMessage?: string;
}

interface CustomerDetails {
    name: string;
    phone_number: string;
    addresses: string[];
    loyalty_points?: number;
}

interface StoreDetails {
    slug: string;
    name: string;
    currency: string;
    loyaltyprogram: string;
}

interface CustomerProfileUpdate {
    name: string;
    phone_number: string;
    addresses: string[];
}

interface ApiResponse {
    statusCode: number;
    message: string;
    success: boolean;
    error?: string;
    type: number;
    data?: any;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

const handleApiError = (response: ApiResponse, logout?: () => void): string => {
    if (!response.success) {
        console.error('API Error:', response);
        switch (response.error) {
            case 'DATA_NOT_FOUND':
                return 'Data not found';
            case 'BAD_REQUEST':
                return response.message || 'Invalid input provided. Please check your data and try again';
            case 'ALREADY_EXISTS':
                return response.message || 'Resource already exists';
            case 'CONFLICT':
                return response.message || 'Conflict occurred. Please refresh and try again';
            case 'FORBIDDEN':
                return 'You do not have permission to perform this action';
            case 'UNAUTHORIZED':
                if (logout) logout();
                return 'Your session has expired. Please log in again';
            case 'MONGO_EXCEPTION':
                return 'Database error occurred. Please try again later';
            case 'DB_CHECK_FAIL':
                return response.message || 'Database validation failed';
            case 'VALIDATION_ERROR':
                return response.message || 'Please check your input and try again';
            case 'DUPLICATE_KEY':
                return 'Duplicate entry found';
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

// Helper function to extract nested data from API responses
const extractNestedData = (data: any): any => {
    // Handle triple nested structure: data.data.data.data
    if (data?.data?.data?.data) {
        return data.data.data.data;
    }
    // Handle double nested structure: data.data.data
    if (data?.data?.data) {
        return data.data.data;
    }
    // Handle single nested structure: data.data
    if (data?.data) {
        return data.data;
    }
    // Return as is
    return data;
};

// Cart Modal Service Functions

export const fetchCustomerDetails = async (token: string, logout: () => void): Promise<CustomerDetails> => {
    try {
        if (!token) {
            throw new Error('Authentication token is required');
        }

        const response = await fetch(`${API_BASE_URL}/orders/api/v1/customer/details`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
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

        if (data.success && data.data) {
            const customerData = extractNestedData(data);

            if (!customerData) {
                throw new Error('No customer data found in API response');
            }

            return {
                name: customerData.name || '',
                phone_number: customerData.phone_number || '',
                addresses: customerData.addresses || [],
                loyalty_points: customerData.loyalty_points || 0
            };
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to fetch customer details. Please check your connection and try again');
    }
};

export const checkLoyaltyProgramStatus = async (storeSlug: string): Promise<boolean> => {
    try {
        if (!storeSlug) {
            throw new Error('Store slug is required');
        }

        const response = await fetch(`${API_BASE_URL}/users/api/v1/public/store/${storeSlug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await validateResponse(response);

        if (data.success) {
            const storeData = extractNestedData(data);
            return storeData?.store?.loyaltyprogram === 'enable';
        }

        return false;
    } catch (err) {
        console.error('Error checking loyalty program status:', err);
        return false;
    }
};

export const placeOrder = async (
    token: string,
    logout: () => void,
    orderData: OrderRequest
): Promise<OrderResponse> => {
    try {
        if (!token) {
            throw new Error('Authentication token is required');
        }

        if (!orderData.items || orderData.items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        if (!orderData.delivery_address.trim()) {
            throw new Error('Delivery address is required');
        }

        if (!orderData.phone_number.trim()) {
            throw new Error('Phone number is required');
        }

        const response = await fetch(`${API_BASE_URL}/orders/api/v1/online-create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please log in again');
        }

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data, logout));
        }

        if (data.success && data.data) {
            const orderResponse = extractNestedData(data);

            if (!orderResponse) {
                throw new Error('Invalid order response from server');
            }

            // Generate success message based on loyalty points
            let successMessage = 'Order placed successfully!';
            if (orderResponse.redeemed_points && orderResponse.redeemed_points > 0) {
                successMessage += ` You redeemed ${orderResponse.redeemed_points} loyalty points!`;
            }
            if (orderResponse.earned_points && orderResponse.earned_points > 0) {
                successMessage += ` You earned ${orderResponse.earned_points} new loyalty points with this order!`;
            }

            return {
                ...orderResponse,
                successMessage
            };
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to place order. Please try again');
    }
};

// Customer Profile Modal Service Functions

export const updateCustomerProfile = async (
    token: string,
    logout: () => void,
    profileData: CustomerProfileUpdate
): Promise<CustomerDetails> => {
    try {
        if (!token) {
            throw new Error('Authentication token is required');
        }

        if (!profileData.name.trim()) {
            throw new Error('Name is required');
        }

        // Client-side validation
        if (profileData.name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }

        if (profileData.name.trim().length > 100) {
            throw new Error('Name must not exceed 100 characters');
        }

        if (profileData.phone_number && profileData.phone_number.trim().length > 0) {
            if (profileData.phone_number.trim().length < 10) {
                throw new Error('Phone number must be at least 10 digits');
            }
        }

        const requestBody = {
            name: profileData.name.trim(),
            phone_number: profileData.phone_number.trim(),
            addresses: profileData.addresses.filter(addr => addr.trim().length > 0)
        };

        const response = await fetch(`${API_BASE_URL}/users/api/v1/customer-profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please log in again');
        }

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data, logout));
        }

        if (data.success && data.data) {
            const updatedProfile = extractNestedData(data);

            if (!updatedProfile) {
                throw new Error('Invalid profile response from server');
            }

            return {
                name: updatedProfile.name || '',
                phone_number: updatedProfile.phone_number || '',
                addresses: updatedProfile.addresses || []
            };
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to update profile. Please try again');
    }
};

// Utility functions for validation

export const validateOrderData = (orderData: OrderRequest): string | null => {
    if (!orderData.items || orderData.items.length === 0) {
        return 'Order must contain at least one item';
    }

    if (!orderData.delivery_address || !orderData.delivery_address.trim()) {
        return 'Delivery address is required';
    }

    if (orderData.delivery_address.trim().length < 10) {
        return 'Delivery address must be at least 10 characters long';
    }

    if (!orderData.phone_number || !orderData.phone_number.trim()) {
        return 'Phone number is required';
    }

    if (orderData.phone_number.trim().length < 10) {
        return 'Phone number must be at least 10 digits';
    }

    if (orderData.rider_note && orderData.rider_note.trim().length > 500) {
        return 'Rider note must not exceed 500 characters';
    }

    // Validate items
    for (const item of orderData.items) {
        if (!item.product_id || !item.product_id.trim()) {
            return 'Invalid product selected';
        }
        if (!item.quantity || item.quantity <= 0) {
            return 'Product quantity must be greater than 0';
        }
        if (item.quantity > 100) {
            return 'Maximum 100 quantity allowed per product';
        }
    }

    return null;
};

export const validateCustomerProfile = (profileData: CustomerProfileUpdate): string | null => {
    if (!profileData.name || !profileData.name.trim()) {
        return 'Name is required';
    }

    const trimmedName = profileData.name.trim();
    if (trimmedName.length < 2) {
        return 'Name must be at least 2 characters long';
    }

    if (trimmedName.length > 100) {
        return 'Name must not exceed 100 characters';
    }

    if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmedName)) {
        return 'Name can only contain letters, spaces, hyphens, apostrophes, and periods';
    }

    if (profileData.phone_number && profileData.phone_number.trim()) {
        const trimmedPhone = profileData.phone_number.trim();
        if (trimmedPhone.length < 10) {
            return 'Phone number must be at least 10 digits';
        }
        if (!/^[\+]?[0-9\-\s\(\)]+$/.test(trimmedPhone)) {
            return 'Please enter a valid phone number';
        }
    }

    // Validate addresses if provided
    for (const address of profileData.addresses) {
        if (address && address.trim()) {
            if (address.trim().length < 10) {
                return 'Address must be at least 10 characters long';
            }
            if (address.trim().length > 500) {
                return 'Address must not exceed 500 characters';
            }
        }
    }

    return null;
};

// Helper function to format currency
export const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
        case 'dollar':
            return '$';
        case 'euro':
            return '€';
        default:
            return 'PKR ';
    }
};