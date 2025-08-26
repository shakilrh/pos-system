import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

interface OrderItem {
    product_name: string | null;
    quantity: number;
    sub_total: number;
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
}

interface CustomerDetails {
    name: string;
    phone_number: string;
    addresses: string[];
    email: string | null;
    created_by: string;
    loyalty_points: number | null;
    orders: Order[];
}

interface ApiResponse {
    statusCode: number;
    message: string;
    success: boolean;
    type: number;
    data: {
        data: CustomerDetails;
    };
}

export default function OrderSummary() {
    const router = useRouter();
    const { slug } = router.query;
    const { isAuthenticated, user, token } = useAuth();
    const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isClient, setIsClient] = useState(false);

    // Ensure we're on the client side before doing anything
    useEffect(() => {
        setIsClient(true);
    }, []);

    const fetchStoreInfo = async () => {
        try {
            if (!slug) return;

            const response = await fetch(`http://192.168.18.107:3000/users/api/v1/public/store/${slug}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch store info: ${response.status}`);
            }

            const storeData = await response.json();
            const storeInfo = storeData.data?.data?.store || null;

            const storeWithSlug = storeInfo ? {
                ...storeInfo,
                slug: slug,
                store_name: storeInfo.name,
                store_logo: storeInfo.logo
            } : null;

            setStore(storeWithSlug);
        } catch (error) {
            console.error('Error fetching store info:', error);
        }
    };

    const fetchCustomerDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(
                'http://192.168.18.107:3000/orders/api/v1/customer/details',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch customer details`);
            }

            const raw = await response.json();
            console.log('Full API Response:', raw);

            // Normalize like AuthModal does
            let customerData = null;

            if (raw?.data?.data?.data) {
                customerData = raw.data.data.data;
            } else if (raw?.data?.data) {
                customerData = raw.data.data;
            } else if (raw?.data) {
                customerData = raw.data;
            }

            console.log('Normalized Customer Data:', customerData);

            if (!customerData) {
                throw new Error('No customer data found in API response');
            }

            setCustomerDetails(customerData);
        } catch (error: any) {
            console.error('Error fetching customer details:', error);
            setError(error.message || 'Failed to load customer details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only run on client side after hydration
        if (!isClient) return;

        if (!isAuthenticated || user?.user_type !== 'customer') {
            router.push('/');
            return;
        }

        if (token && slug) {
            fetchStoreInfo();
            fetchCustomerDetails();
        }
    }, [isAuthenticated, user, router, token, isClient, slug]);

    const getCurrencySymbol = () => {
        if (store?.currency === 'dollar') return '$';
        if (store?.currency === 'euro') return '€';
        return 'PKR ';
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'confirmed':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'ready':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'shipped':
            case 'out_for_delivery':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'cancelled':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'clock';
            case 'confirmed':
                return 'check-circle';
            case 'ready':
                return 'box';
            case 'shipped':
            case 'out_for_delivery':
                return 'truck';
            case 'completed':
                return 'check-double';
            case 'cancelled':
                return 'x-circle';
            default:
                return 'help-circle';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return `${getCurrencySymbol()}${amount.toFixed(2)}`;
    };

    const getProductDisplayName = (item: OrderItem, index: number) => {
        if (item.product_name && item.product_name.trim()) {
            return item.product_name;
        }
        return `Item #${index + 1}`;
    };

    const filteredOrders = customerDetails?.orders?.filter(order => {
        const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
        const matchesSearch = searchTerm === '' ||
            order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    }) || [];

    const statusOptions = ['all', 'pending', 'confirmed', 'ready', 'shipped', 'out_for_delivery', 'completed', 'cancelled'];

    // Show loading state during hydration
    if (!isClient) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading your order history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Orders</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => {
                            fetchStoreInfo();
                            fetchCustomerDetails();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!customerDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                    <p className="text-gray-600">No customer data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                ← Back
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
                                <p className="text-sm text-gray-600 mt-1">View and track all your orders</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Customer Info Card */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">{customerDetails.name}</h2>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p className="flex items-center">
                                    📱 {customerDetails.phone_number}
                                </p>
                                {customerDetails.email && (
                                    <p className="flex items-center">
                                        ✉️ {customerDetails.email}
                                    </p>
                                )}
                                <p className="flex items-center">
                                    📍 {customerDetails.addresses?.[0] || 'No address provided'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-blue-50 px-3 py-2 rounded-lg">
                                <p className="text-xs text-blue-600 font-medium">Total Orders</p>
                                <p className="text-2xl font-bold text-blue-700">{customerDetails.orders?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Filter by status:</h3>
                            <div className="flex flex-wrap gap-2">
                                {statusOptions.map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(status)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                                            selectedStatus === status
                                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                        }`}
                                    >
                                        {status.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="lg:w-80">
                            <label htmlFor="search" className="sr-only">Search orders</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="search"
                                    placeholder="Search by order number or address..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400">🔍</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-6">
                    {filteredOrders.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                            <div className="text-6xl text-gray-300 mb-4">📦</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                            <p className="text-gray-500">
                                {searchTerm || selectedStatus !== 'all'
                                    ? 'Try adjusting your filters or search terms.'
                                    : "You haven't placed any orders yet."}
                            </p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div key={order.order_id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                                {/* Order Header */}
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Order #{order.order_number}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Placed on {formatDate(order.order_date)}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                <span className="mr-1">{order.status === 'completed' ? '✅' :
                                                    order.status === 'cancelled' ? '❌' :
                                                        order.status === 'pending' ? '⏱️' :
                                                            order.status === 'confirmed' ? '✔️' :
                                                                order.status === 'ready' ? '📦' :
                                                                    (order.status === 'shipped' || order.status === 'out_for_delivery') ? '🚚' : '❓'}</span>
                                                {order.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Details */}
                                <div className="px-6 py-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Delivery Info */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Delivery Information</h4>
                                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Customer:</span> {order.customer_name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Address:</span> {order.delivery_address}
                                                </p>
                                                {order.estimated_completion && (
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Estimated completion:</span>
                                                        <span className="text-green-600 ml-1">{order.estimated_completion}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">
                                                Order Items ({order.items.length})
                                            </h4>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <div className="space-y-2">
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className="flex justify-between items-center">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {getProductDisplayName(item, index)}
                                                                </p>
                                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                            </div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {formatCurrency(item.sub_total)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="border-t border-gray-200 mt-3 pt-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium text-gray-900">Total Amount</span>
                                                        <span className="text-lg font-bold text-gray-900">
                                                            {formatCurrency(order.total_amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order ID */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-500 text-center">
                                            Order ID: {order.order_id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Results Summary */}
                {filteredOrders.length > 0 && (
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            Showing {filteredOrders.length} of {customerDetails.orders?.length || 0} orders
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}