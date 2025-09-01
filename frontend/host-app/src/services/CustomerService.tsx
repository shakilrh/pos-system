interface CustomerDetails {
    name: string;
    phone_number: string;
    addresses: string[];
    email?: string | null;
    loyalty_points?: number | null;
    orders?: Order[];
}

interface StoreDetails {
    id: string;
    store_logo?: string;
    store_name?: string;
    store?: {
        id: string;
        logo?: string;
        name?: string;
    };
}

interface ApiResponse {
    statusCode: number;
    message: string;
    success: boolean;
    error?: string;
    type?: number;
    data?: any;
}

interface Store {
    slug: string;
    name?: string;
    logo?: string;
    currency?: string;
    loyaltyprogram?: string;
}

interface CreateCustomerRequest {
    email: string;
    created_by: string;
}

interface UpdateCustomerProfileRequest {
    name: string;
    phone_number: string;
    addresses: string[];
}

interface LoginRequest {
    email: string;
    otp: string;
}

interface Order {
    order_id: string;
    order_number: string;
    order_date: string;
    total_amount: number;
    status: string;
    delivery_address: string;
    customer_name: string;
    items: OrderItem[];
    estimated_completion: string | null;
    redeemed_points?: number;
    earned_points?: number;
}

interface OrderItem {
    product_id: string;
    quantity: number;
    product_name?: string | null;
    sub_total?: number;
}
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

const handleApiError = (response: ApiResponse, logout?: () => void): string => {
    if (!response.success) {
        console.error('API Error:', response);
        switch (response.error) {
            case 'DATA_NOT_FOUND':
                return 'Customer data not found';
            case 'BAD_REQUEST':
                return response.message || 'Invalid input provided. Please check your data and try again';
            case 'ALREADY_EXISTS':
                return response.message || 'Customer with this email already exists';
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
                return 'A customer with this email already exists';
            case 'INVALID_ID':
                return 'Invalid customer identifier provided';
            case 'INVALID_OTP':
                return 'Invalid or expired OTP code';
            case 'OTP_EXPIRED':
                return 'OTP code has expired. Please request a new one';
            case 'EMAIL_NOT_FOUND':
                return 'Email address not found';
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
                throw new Error('Unauthorized - Invalid credentials or session expired');
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

// Helper function to extract store details from different structures
export const getStoreDetails = (store?: StoreDetails) => {
    if (!store) return { id: 'default_admin_id', logo: null, name: 'Store' };

    // Check if store has nested store structure (from API response)
    if (store.store) {
        return {
            id: store.store.id || 'default_admin_id',
            logo: store.store.logo,
            name: store.store.name || 'Store'
        };
    }

    // Fallback to original structure
    return {
        id: store.id || 'default_admin_id',
        logo: store.store_logo,
        name: store.store_name || 'Store'
    };
};

// Create customer and send OTP
export const createCustomerAndSendOTP = async (
    email: string,
    store?: StoreDetails
): Promise<void> => {
    try {
        if (!email || !email.trim()) {
            throw new Error('Email is required');
        }

        const storeDetails = getStoreDetails(store);
        const requestBody: CreateCustomerRequest = {
            email: email.trim().toLowerCase(),
            created_by: storeDetails.id,
        };

        const response = await fetch(`${API_BASE_URL}/users/api/v1/create-customer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data));
        }

        if (!data.success || data.type !== 1) {
            throw new Error('Failed to send OTP');
        }
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to send OTP. Please check your connection and try again');
    }
};

// Verify OTP and login
export const verifyOTPAndLogin = async (
    email: string,
    otp: string
): Promise<any> => {
    try {
        if (!email || !email.trim()) {
            throw new Error('Email is required');
        }

        if (!otp || !otp.trim()) {
            throw new Error('OTP code is required');
        }

        const requestBody: LoginRequest = {
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
        };

        const response = await fetch(`${API_BASE_URL}/users/api/v1/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data));
        }

        if (data.success && data.type === 1 && data.data) {
            return data.data;
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to verify OTP. Please try again');
    }
};

// Fetch customer details
export const fetchCustomerDetails = async (
    token: string,
    logout?: () => void
): Promise<CustomerDetails> => {
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
            if (logout) logout();
            throw new Error('Session expired. Please log in again');
        }

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data, logout));
        }

        if (data.success) {
            // Handle the nested data structure properly
            const customerData = data.data?.data?.data || data.data?.data || data.data;

            if (!customerData) {
                throw new Error('No customer data found in API response');
            }

            // Ensure all required fields exist
            return {
                name: customerData.name || '',
                phone_number: customerData.phone_number || '',
                addresses: customerData.addresses || []
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

// Update customer profile
export const updateCustomerProfile = async (
    token: string,
    profileData: UpdateCustomerProfileRequest,
    logout?: () => void
): Promise<any> => {
    try {
        if (!token) {
            throw new Error('Authentication token is required');
        }

        if (!profileData.name || !profileData.name.trim()) {
            throw new Error('Name is required');
        }

        // Client-side validation
        const trimmedName = profileData.name.trim();
        const trimmedPhone = profileData.phone_number.trim();
        const trimmedAddresses = profileData.addresses.filter(addr => addr.trim());

        if (trimmedName.length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }

        if (trimmedName.length > 50) {
            throw new Error('Name must not exceed 50 characters');
        }

        if (trimmedPhone && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,6}$/.test(trimmedPhone)) {
            throw new Error('Please enter a valid phone number');
        }

        const requestBody: UpdateCustomerProfileRequest = {
            name: trimmedName,
            phone_number: trimmedPhone,
            addresses: trimmedAddresses
        };

        const response = await fetch(`${API_BASE_URL}/users/api/v1/customer-profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (response.status === 401) {
            if (logout) logout();
            throw new Error('Session expired. Please log in again');
        }

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data, logout));
        }

        if (data.success && data.data) {
            return data.data?.data || data.data;
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to update customer profile. Please try again');
    }
};

// Validation utility functions

export const validateEmail = (email: string): string[] => {
    const errors: string[] = [];
    if (!email.trim()) {
        errors.push('Email is required');
    } else {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) errors.push('Please enter a valid email address');
        if (email.length > 254) errors.push('Email address is too long');
        if (email.includes('..')) errors.push('Email cannot contain consecutive dots');
    }
    return errors;
};

export const validateName = (name: string): string[] => {
    const errors: string[] = [];
    if (!name.trim()) {
        errors.push('Name is required');
    } else {
        if (name.length < 2) errors.push('Name must be at least 2 characters long');
        if (name.length > 50) errors.push('Name must be less than 50 characters');
        if (!/^[A-Za-z\s'-]+$/.test(name)) errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
        if (/^\s|\s$/.test(name)) errors.push('Name cannot start or end with spaces');
        if (/\s{2,}/.test(name)) errors.push('Name cannot contain multiple consecutive spaces');
    }
    return errors;
};

export const validatePhoneNumber = (phoneNumber: string): string[] => {
    if (!phoneNumber.trim()) return [];
    const errors: string[] = [];
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,6}$/;
    if (!phoneRegex.test(phoneNumber)) errors.push('Please enter a valid phone number (e.g., +1234567890, (123) 456-7890)');
    return errors;
};

export const validateAddress = (address: string): string[] => {
    if (!address.trim()) return [];
    const errors: string[] = [];
    if (address.length < 5) errors.push('Address must be at least 5 characters long');
    if (address.length > 500) errors.push('Address must be less than 500 characters');
    return errors;
};

export const validateOTP = (otp: string): string[] => {
    const errors: string[] = [];
    if (!otp.trim()) {
        errors.push('OTP code is required');
    } else {
        if (otp.length < 4) errors.push('OTP code must be at least 4 characters');
        if (otp.length > 10) errors.push('OTP code must not exceed 10 characters');

    }
    return errors;
};

export const fetchStoreInfo = async (slug: string): Promise<Store> => {
    try {
        if (!slug) {
            throw new Error('Store slug is required');
        }

        const response = await fetch(`${API_BASE_URL}/users/api/v1/public/store/${slug}`);
        const data = await validateResponse(response);

        if (!data.success || !data.data?.data?.store) {
            throw new Error(handleApiError(data, () => {}));
        }

        const storeInfo = data.data.data.store;
        return {
            ...storeInfo,
            slug,
            store_name: storeInfo.name,
            store_logo: storeInfo.logo
        };
    } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to fetch store info');
    }
};

export const fetchCustomerorderDetails = async (token: string, logout: () => void): Promise<CustomerDetails> => {
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

        const customerData = data.data?.data?.data || data.data?.data || data.data;
        if (!customerData) {
            throw new Error('No customer data found in response');
        }

        return {
            ...customerData,
            orders: customerData.orders || [],
            addresses: customerData.addresses || [],
            loyalty_points: customerData.loyalty_points ?? 0
        };
    } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to fetch customer details');
    }
};

export const updateCustomerAddress = async (
    token: string,
    logout: () => void,
    name: string,
    phone_number: string,
    addresses: string[]
): Promise<void> => {
    try {
        if (!token) {
            throw new Error('Authentication token is required');
        }

        if (!addresses[0]?.trim()) {
            throw new Error('Address is required');
        }

        const response = await fetch(`${API_BASE_URL}/users/api/v1/customer-profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name.trim(),
                phone_number: phone_number.trim(),
                addresses: [addresses[0].trim()]
            }),
        });

        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please log in again');
        }

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data, logout));
        }
    } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to update address');
    }
};

export const placeOrder = async (
    token: string,
    logout: () => void,
    orderData: {
        items: { product_id: string; quantity: number }[];
        delivery_address: string;
        phone_number: string;
        rider_note?: string;
        use_redeem_points?: boolean;
    }
): Promise<Order> => {
    try {
        if (!token) {
            throw new Error('Authentication token is required');
        }

        if (!orderData.items.length) {
            throw new Error('Cart is empty');
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
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                items: orderData.items,
                delivery_address: orderData.delivery_address.trim(),
                phone_number: orderData.phone_number.trim(),
                rider_note: orderData.rider_note?.trim(),
                use_redeem_points: orderData.use_redeem_points
            }),
        });

        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please log in again');
        }

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data, logout));
        }

        const order = data.data?.data;
        if (!order) {
            throw new Error('Invalid order data received');
        }

        return order;
    } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Failed to place order');
    }
};