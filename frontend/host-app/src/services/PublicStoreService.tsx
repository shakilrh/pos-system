export interface Product {
    _id: string;
    name: string;
    description?: string;
    price: number;
    pictureUrl?: string;
    category_id?: {
        _id: string;
        name: string;
    };
    quantity?: number;
}
export interface OrderData {
    _id: string;
    order_number: string;
    total_amount: number;
    status: string;
    items: Array<{
        product: Product;
        quantity: number;
        price: number;
    }>;
    delivery_address?: string;
    created_at: string;
}

interface CustomerDetails {
    name: string;
    phone_number: string;
    addresses: string[];
}

interface Category {
    _id: string;
    name: string;
    description?: string;
}

export interface Store {
    _id?: string; // Made optional to fix the type error
    name?: string; // Made optional to fix the type error
    store_name?: string;
    logo?: string;
    store_logo?: string;
    images?: string[];
    aboutUs?: string;
    currency?: string;
    address?: string;
    slug?: string;
}

export interface CartItem extends Product {
    quantity: number; // required in cart
}

interface ApiResponse<T = any> {
    statusCode: number;
    message: string;
    success: boolean;
    error?: string;
    type: number;
    data?: { data?: T } | T;
}

interface OrderData {
    _id: string;
    order_number: string;
    total_amount: number;
    status: string;
    items: Array<{
        product: Product;
        quantity: number;
        price: number;
    }>;
    delivery_address?: string;
    created_at: string;
}

interface OrderRequest {
    items: Array<{
        product_id: string;
        quantity: number;
        price: number;
    }>;
    delivery_address?: string;
    notes?: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.18.37:3000';

const handleApiError = (response: ApiResponse, logout?: () => void): string => {
    if (!response.success) {
        console.error('API Error:', response);
        switch (response.error) {
            case 'DATA_NOT_FOUND':
                return 'Data not found';
            case 'BAD_REQUEST':
                return response.message || 'Invalid request. Please check your input';
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

// Fetch products for a specific store
export const fetchProducts = async (slug: string): Promise<Product[]> => {
    try {
        if (!slug || !slug.trim()) {
            throw new Error('Store slug is required');
        }

        const response = await fetch(`${API_BASE_URL}/products/api/v1/public/list/${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data));
        }

        if (data.success && data.data && 'data' in data.data) {
            return (data.data as { data: Product[] }).data || [];
        }

        return [];
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to fetch products. Please check your connection and try again');
    }
};

// Fetch categories for a specific store
export const fetchCategories = async (slug: string): Promise<Category[]> => {
    try {
        if (!slug || !slug.trim()) {
            throw new Error('Store slug is required');
        }

        const response = await fetch(`${API_BASE_URL}/categories/api/v1/public/list/${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data));
        }

        if (data.success && data.data && 'data' in data.data) {
            return (data.data as { data: Category[] }).data || [];
        }

        return [];
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to fetch categories. Please check your connection and try again');
    }
};

// Fetch store information
export const fetchStore = async (slug: string): Promise<Store | null> => {
    try {
        if (!slug || !slug.trim()) {
            throw new Error('Store slug is required');
        }

        const response = await fetch(`${API_BASE_URL}/users/api/v1/public/store/${slug}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        const data = await validateResponse(response);

        if (!data.success) {
            throw new Error(handleApiError(data));
        }

        if (data.success && data.data && 'data' in data.data) {
            const storeData = (data.data as { data: { store: Store } }).data;
            const storeInfo = storeData?.store || null;

            if (storeInfo) {
                return {
                    ...storeInfo,
                    slug: slug,
                    store_name: storeInfo.name,
                    store_logo: storeInfo.logo
                };
            }
        }

        return null;
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to fetch store information. Please check your connection and try again');
    }
};

// Fetch all store data at once
export const fetchStoreData = async (slug: string): Promise<{
    products: Product[];
    categories: Category[];
    store: Store | null;
}> => {
    try {
        if (!slug || !slug.trim()) {
            throw new Error('Store slug is required');
        }

        const [productsRes, categoriesRes, storeRes] = await Promise.all([
            fetch(`${API_BASE_URL}/products/api/v1/public/list/${slug}`),
            fetch(`${API_BASE_URL}/categories/api/v1/public/list/${slug}`),
            fetch(`${API_BASE_URL}/users/api/v1/public/store/${slug}`)
        ]);

        const [productsData, categoriesData, storeData] = await Promise.all([
            validateResponse(productsRes),
            validateResponse(categoriesRes),
            validateResponse(storeRes)
        ]);

        // Handle products
        let products: Product[] = [];
        if (productsData.success && productsData.data && 'data' in productsData.data) {
            products = (productsData.data as { data: Product[] }).data || [];
        }

        // Handle categories
        let categories: Category[] = [];
        if (categoriesData.success && categoriesData.data && 'data' in categoriesData.data) {
            categories = (categoriesData.data as { data: Category[] }).data || [];
        }

        // Handle store
        let store: Store | null = null;
        if (storeData.success && storeData.data && 'data' in storeData.data) {
            const storeInfo = (storeData.data as { data: { store: Store } }).data?.store || null;
            if (storeInfo) {
                store = {
                    ...storeInfo,
                    slug: slug,
                    store_name: storeInfo.name,
                    store_logo: storeInfo.logo
                };
            }
        }

        return { products, categories, store };
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to fetch store data. Please check your connection and try again');
    }
};

// Create an order
export const createOrder = async (
    token: string,
    logout: () => void,
    orderData: OrderRequest,
    storeSlug: string
): Promise<OrderData> => {
    try {
        if (!token) {
            throw new Error('Authentication token is required');
        }

        if (!storeSlug || !storeSlug.trim()) {
            throw new Error('Store slug is required');
        }

        if (!orderData.items || orderData.items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        // Validate order items
        for (const item of orderData.items) {
            if (!item.product_id || !item.product_id.trim()) {
                throw new Error('Product ID is required for all items');
            }
            if (!item.quantity || item.quantity <= 0) {
                throw new Error('Quantity must be greater than 0 for all items');
            }
            if (!item.price || item.price <= 0) {
                throw new Error('Price must be greater than 0 for all items');
            }
        }

        const response = await fetch(`${API_BASE_URL}/orders/api/v1/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                ...orderData,
                store_slug: storeSlug
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

        if (data.success && data.type === 1 && data.data) {
            return data.data as OrderData;
        }

        throw new Error('Invalid response format from server');
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to create order. Please try again');
    }
};

// Fetch order history for authenticated user
export const fetchOrderHistory = async (
    token: string,
    logout: () => void,
    storeSlug?: string
): Promise<OrderData[]> => {
    try {
        if (!token) {
            throw new Error('Authentication token is required');
        }

        let url = `${API_BASE_URL}/orders/api/v1/history`;
        if (storeSlug && storeSlug.trim()) {
            url += `?store_slug=${encodeURIComponent(storeSlug)}`;
        }

        const response = await fetch(url, {
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
            return (data.data as { data: OrderData[] }).data || [];
        }

        return [];
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        throw new Error('Failed to fetch order history. Please check your connection and try again');
    }
};

// Cart management utilities
export const getCartKey = (slug: string): string => {
    return `cart_${slug || 'default'}`;
};

export const getCartFromStorage = (slug: string): CartItem[] => {
    try {
        const savedCart = localStorage.getItem(getCartKey(slug));
        if (savedCart) {
            return JSON.parse(savedCart);
        }
        return [];
    } catch (error) {
        console.error('Error loading cart:', error);
        return [];
    }
};

export const saveCartToStorage = (slug: string, cart: CartItem[]): void => {
    try {
        localStorage.setItem(getCartKey(slug), JSON.stringify(cart));
        // Dispatch custom event for cart updates
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
    } catch (error) {
        console.error('Error saving cart:', error);
        throw new Error('Failed to save cart');
    }
};

export const addToCart = (slug: string, product: Product): CartItem[] =>{
    try {
        const cart = getCartFromStorage(slug);
        const existingItemIndex = cart.findIndex(item => item._id === product._id);

        if (existingItemIndex >= 0) {
            cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 0) + 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        saveCartToStorage(slug, cart);
        return cart;
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw new Error('Failed to add item to cart');
    }
};

export const removeFromCart = (slug: string, productId: string): CartItem[] => {
    try {
        const cart = getCartFromStorage(slug);
        const updatedCart = cart.filter(item => item._id !== productId);
        saveCartToStorage(slug, updatedCart);
        return updatedCart;
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw new Error('Failed to remove item from cart');
    }
};

export const updateCartItemQuantity = (
    slug: string,
    productId: string,
    quantity: number
): CartItem[] =>{
    try {
        if (quantity <= 0) {
            return removeFromCart(slug, productId);
        }

        const cart = getCartFromStorage(slug);
        const itemIndex = cart.findIndex(item => item._id === productId);

        if (itemIndex >= 0) {
            cart[itemIndex].quantity = quantity;
            saveCartToStorage(slug, cart);
        }

        return cart;
    } catch (error) {
        console.error('Error updating cart quantity:', error);
        throw new Error('Failed to update cart quantity');
    }
};

export const clearCart = (slug: string): void => {
    try {
        localStorage.removeItem(getCartKey(slug));
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
    } catch (error) {
        console.error('Error clearing cart:', error);
        throw new Error('Failed to clear cart');
    }
};

export const getCartItemCount = (slug: string): number => {
    try {
        const cart = getCartFromStorage(slug);
        return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    } catch (error) {
        console.error('Error getting cart count:', error);
        return 0;
    }
};

// Utility functions
export const getCurrencySymbol = (currency?: string): string => {
    switch (currency) {
        case 'dollar':
            return '$';
        case 'euro':
            return '€';
        default:
            return 'PKR ';
    }
};

export const formatPrice = (price: number, currency?: string): string => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price.toFixed(2)}`;
};

export const validateSlug = (slug: string): boolean => {
    return !!(slug && slug.trim() && slug.length > 0);
};

