interface Customer {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    verified: boolean;
    created_at: string;
    updated_at: string;
}

interface ApiResponse {
    statusCode: number;
    message: string;
    success: boolean;
    error?: string;
    type: number;
    data?: { data?: Customer } | Customer;
}

interface VerifyCustomerRequest {
    email: string;
    code: string;
}

interface SignupCustomerRequest {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
}

interface LoginCustomerRequest {
    email: string;
    password: string;
}

interface OtpRequest {
    email: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.107:3000';

const handleApiError = (response: ApiResponse): string => {
    if (!response.success) {
        console.error('API Error:', response);
        switch (response.error) {
            case 'DATA_NOT_FOUND':
                return 'Customer not found';
            case 'BAD_REQUEST':
                return response.message || 'Invalid input provided. Please check your data and try again';
            case 'ALREADY_EXISTS':
                return response.message || 'An account with this email already exists';
            case 'CONFLICT':
                return response.message || 'Conflict occurred. Please refresh and try again';
            case 'FORBIDDEN':
                return 'You do not have permission to perform this action';
            case 'UNAUTHORIZED':
                return 'Invalid credentials. Please check your email and password';
            case 'MONGO_EXCEPTION':
                return 'Database error occurred. Please try again later';
            case 'DB_CHECK_FAIL':
                return response.message || 'Database validation failed';
            case 'VALIDATION_ERROR':
                return response.message || 'Please check your input and try again';
            case 'DUPLICATE_KEY':
                return 'An account with this email already exists';
            case 'INVALID_ID':
                return 'Invalid customer identifier provided';
            case 'INVALID_CODE':
                return 'Invalid or expired verification code. Please try again';
            case 'CODE_EXPIRED':
                return 'Verification code has expired. Please request a new one';
            case 'EMAIL_NOT_VERIFIED':
                return 'Please verify your email first';
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
                throw new Error('Invalid credentials');
            case 403:
                throw new Error('Access denied');
            case 404:
                throw new Error('Customer not found');
            case 409:
                throw new Error('Customer already exists');
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

// Customer Signup
export const signupCustomer = async (customerData: SignupCustomerRequest): Promise<Customer> => {
    try {
        // Client-side validation
        if (!customerData.name || !customerData.name.trim()) {
            throw new Error('Name is required');
        }
        if (!customerData.email || !customerData.email.trim()) {
            throw new Error('Email is required');
        }
        if (!customerData.phone || !customerData.phone.trim()) {
            throw new Error('Phone is required');
        }
        if (!customerData.password || customerData.password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerData.email)) {
            throw new Error('Please enter a valid email address');
        }

        const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
        if (!phoneRegex.test(customerData.phone)) {
            throw new Error('Please enter a valid phone number');
        }

        const requestBody = {
            name: customerData.name.trim(),
            email: customerData.email.trim().toLowerCase(),
            phone: customerData.phone.trim(),
            password: customerData.password,
            address: customerData.address?.trim()
        };

        const response = await fetch(`${API_BASE_URL}/users/api/v1/customer-signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
        });

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data));
        }

        if (data.success && data.type === 1 && data.data) {
            return data.data as Customer;
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to create account. Please try again');
    }
};

// Customer Login
export const loginCustomer = async (credentials: LoginCustomerRequest): Promise<{ customer: Customer; token: string }> => {
    try {
        if (!credentials.email || !credentials.email.trim()) {
            throw new Error('Email is required');
        }
        if (!credentials.password) {
            throw new Error('Password is required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
            throw new Error('Please enter a valid email address');
        }

        const requestBody = {
            email: credentials.email.trim().toLowerCase(),
            password: credentials.password
        };

        const response = await fetch(`${API_BASE_URL}/users/api/v1/customer-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
        });

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data));
        }

        if (data.success && data.type === 1 && data.data) {
            const responseData = data.data as any;
            return {
                customer: responseData.customer || responseData,
                token: responseData.token || responseData.access_token
            };
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to login. Please try again');
    }
};

// Send OTP for verification
export const sendOtpCode = async (email: string): Promise<void> => {
    try {
        if (!email || !email.trim()) {
            throw new Error('Email is required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Please enter a valid email address');
        }

        const requestBody: OtpRequest = {
            email: email.trim().toLowerCase()
        };

        const response = await fetch(`${API_BASE_URL}/users/api/v1/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
        });

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data));
        }
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to send verification code. Please try again');
    }
};

// Verify Customer with OTP
export const verifyCustomer = async (verificationData: VerifyCustomerRequest): Promise<{ customer: Customer; token: string }> => {
    try {
        if (!verificationData.email || !verificationData.email.trim()) {
            throw new Error('Email is required');
        }
        if (!verificationData.code || !verificationData.code.trim()) {
            throw new Error('Verification code is required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(verificationData.email)) {
            throw new Error('Please enter a valid email address');
        }

        const requestBody = {
            email: verificationData.email.trim().toLowerCase(),
            code: verificationData.code.trim().toUpperCase()
        };

        const response = await fetch(`${API_BASE_URL}/users/api/v1/verify-customer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody),
        });

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data));
        }

        if (data.success && data.type === 1 && data.data) {
            const responseData = data.data as any;
            return {
                customer: responseData.customer || responseData,
                token: responseData.token || responseData.access_token
            };
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to verify account. Please try again');
    }
};

// Get Customer Details
export const getCustomerDetails = async (token: string): Promise<Customer> => {
    try {
        if (!token) {
            throw new Error('Authentication token is required');
        }

        const response = await fetch(`${API_BASE_URL}/users/api/v1/customer-details`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        });

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data));
        }

        if (data.success && data.type === 1 && data.data) {
            if ('data' in data.data) {
                return (data.data as { data: Customer }).data;
            }
            return data.data as Customer;
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to fetch customer details. Please try again');
    }
};

// Logout Customer (clear local storage)
export const logoutCustomer = (): void => {
    // Since we can't use localStorage in artifacts, this would be handled by the parent component
    // by clearing the state and any stored tokens
};

// Validation helper functions
export const validateEmail = (email: string): string | null => {
    if (!email || !email.trim()) {
        return 'Email is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return 'Please enter a valid email address';
    }

    return null;
};

export const validatePhone = (phone: string): string | null => {
    if (!phone || !phone.trim()) {
        return 'Phone number is required';
    }

    const phoneRegex = /^[+]?[\d\s\-\(\)]{10,15}$/;
    if (!phoneRegex.test(phone.trim())) {
        return 'Please enter a valid phone number';
    }

    return null;
};

export const validatePassword = (password: string): string | null => {
    if (!password) {
        return 'Password is required';
    }

    if (password.length < 6) {
        return 'Password must be at least 6 characters long';
    }

    if (password.length > 50) {
        return 'Password must not exceed 50 characters';
    }

    return null;
};

export const validateName = (name: string): string | null => {
    if (!name || !name.trim()) {
        return 'Name is required';
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
        return 'Name must be at least 2 characters long';
    }

    if (trimmedName.length > 50) {
        return 'Name must not exceed 50 characters';
    }

    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
        return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }

    return null;
};

export const validateOtpCode = (code: string): string | null => {
    if (!code || !code.trim()) {
        return 'Verification code is required';
    }

    const trimmedCode = code.trim();

    if (trimmedCode.length < 3) {
        return 'Verification code must be at least 3 characters long';
    }

    if (trimmedCode.length > 10) {
        return 'Verification code is too long';
    }

    return null;
};