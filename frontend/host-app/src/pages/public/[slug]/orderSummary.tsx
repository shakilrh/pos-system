import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { fetchStoreInfo, fetchCustomerorderDetails } from '../../../services/CustomerService';
import type { Store } from "../../../services/PublicStoreService";

interface OrderItem {
    product_id: string;
    quantity: number;
    product_name?: string | null;
    sub_total?: number;
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

interface CustomerDetails {
    name: string;
    phone_number: string;
    addresses: string[];
    email?: string | null;
    loyalty_points?: number | null;
    orders?: Order[];
}


export default function OrderSummary() {
    const router = useRouter();
    const { slug } = router.query;
    const { isAuthenticated, user, token, logout } = useAuth();
    const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
    const [store, setStore] = useState<Store | null>(null); // Add Store type
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            if (slug) {
                const storeData = await fetchStoreInfo(slug as string);
                setStore(storeData);
            }
            if (token) {
                const customerData = await fetchCustomerorderDetails(token, logout);
                setCustomerDetails(customerData);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
            setError(errorMessage);
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isClient) return;
        if (!isAuthenticated || user?.user_type !== 'customer') {
            router.push('/');
            return;
        }
        if (token && slug) {
            fetchData();
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
                return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'confirmed':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'ready':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'shipped':
            case 'out_for_delivery':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'completed':
                return 'bg-green-50 text-green-700 border-green-200';
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

    if (!isClient) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-t-4 border-b-4 border-[#F4B400] rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg font-semibold text-[#333333]">Loading...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-t-4 border-b-4 border-[#F4B400] rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg font-semibold text-[#333333]">Loading Order History...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md border border-[#CCCCCC]">
                    <div className="text-red-500 text-4xl mb-4">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2 className="text-xl font-semibold text-[#333333] mb-2">Unable to Load Orders</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={fetchData}
                        className="bg-[#F4B400] hover:bg-[#F4B400]/90 text-[#1E1E1E] px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        <i className="fas fa-refresh mr-2"></i>Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!customerDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center border border-[#CCCCCC]">
                    <p className="text-[#333333]">No customer data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-lg sticky top-0 z-40">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="bg-[#F4B400] hover:bg-[#F4B400]/90 text-[#1E1E1E] font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"
                            >
                                <i className="fas fa-arrow-left"></i>
                                <span>Back</span>
                            </button>
                            {store?.logo && (
                                <div className="h-14 w-auto flex-shrink-0">
                                    <img
                                        src={store.logo}
                                        alt={store.name || store.store_name}
                                        className="h-full w-auto object-contain"
                                    />
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl font-bold text-[#4c2c19] flex items-center">
                                    <i className="fas fa-receipt mr-3 text-[#F4B400]"></i>
                                    Order History
                                </h1>
                                <p className="text-[#F4B400] font-medium">Track all your delicious orders</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 py-6">
                <div className="bg-[#FAFAFA] rounded-xl shadow-lg border border-[#CCCCCC] p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-[#F4B400] rounded-full flex items-center justify-center">
                                <i className="fas fa-user text-lg text-[#1E1E1E]"></i>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#333333]">{customerDetails.name}</h2>
                                <p className="text-xs text-[#333333] flex items-center">
                                    <i className="fas fa-phone mr-1 text-[#F4B400]"></i>
                                    {customerDetails.phone_number}
                                </p>
                            </div>
                        </div>
                        <div className="bg-[#F4B400] px-4 py-2 rounded-xl text-center">
                            <p className="text-xs text-[#1E1E1E] font-medium">Orders</p>
                            <p className="text-xl font-bold text-[#1E1E1E]">{customerDetails.orders?.length || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#FAFAFA] rounded-xl shadow-lg border border-[#CCCCCC] p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`px-3 py-1 rounded-lg font-medium text-xs transition-all capitalize ${
                                        selectedStatus === status
                                            ? 'bg-[#F4B400] text-[#1E1E1E]'
                                            : 'bg-white text-[#333333] hover:bg-[#F4B400] hover:text-[#1E1E1E] border border-[#CCCCCC]'
                                    }`}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                        <div className="md:w-64">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-8 pr-3 py-2 border border-[#CCCCCC] rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:border-[#F4B400] text-sm"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i className="fas fa-search text-[#F4B400] text-xs"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    {filteredOrders.length === 0 ? (
                        <div className="bg-[#FAFAFA] rounded-xl shadow-lg border border-[#CCCCCC] p-8 text-center">
                            <div className="text-4xl text-[#F4B400] mb-3">
                                <i className="fas fa-box-open"></i>
                            </div>
                            <h3 className="text-lg font-bold text-[#333333] mb-2">No Orders Found</h3>
                            <p className="text-gray-500 text-sm">
                                {searchTerm || selectedStatus !== 'all'
                                    ? 'Try adjusting your filters or search terms.'
                                    : "You haven't placed any orders yet."}
                            </p>
                            {!searchTerm && selectedStatus === 'all' && (
                                <button
                                    onClick={() => router.push(`/public/${slug}`)}
                                    className="mt-4 bg-[#F4B400] hover:bg-[#F4B400]/90 text-[#1E1E1E] font-semibold py-2 px-6 rounded-lg transition-all"
                                >
                                    <i className="fas fa-utensils mr-2"></i>
                                    Explore Menu
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div key={order.order_id} className="bg-[#FAFAFA] rounded-xl shadow-lg border border-[#CCCCCC] hover:shadow-xl transition-all overflow-hidden">
                                <div className="bg-gradient-to-r from-[#F4B400] to-[#F4B400]/80 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-[#1E1E1E] flex items-center">
                                                <i className="fas fa-receipt mr-2"></i>
                                                Order #{order.order_number}
                                            </h3>
                                            <p className="text-[#1E1E1E]/80 text-sm">
                                                <i className="fas fa-calendar mr-1"></i>
                                                {formatDate(order.order_date)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="bg-[#1E1E1E] px-3 py-1 rounded-lg mb-2">
                                                <p className="text-lg font-bold text-[#F4B400]">{formatCurrency(order.total_amount)}</p>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(order.status)}`}>
                                                <i className={`fas fa-${getStatusIcon(order.status)} mr-1`}></i>
                                                {order.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-[#333333] mb-2 flex items-center">
                                                <i className="fas fa-truck mr-2 text-[#F4B400]"></i>
                                                Delivery Info
                                            </h4>
                                            <div className="bg-white rounded-lg border border-[#F4B400]/20 p-3 space-y-2">
                                                <p className="text-[#333333] text-sm flex items-start">
                                                    <i className="fas fa-user mr-2 text-[#F4B400] mt-0.5"></i>
                                                    <span className="font-medium">{order.customer_name}</span>
                                                </p>
                                                <p className="text-[#333333] text-sm flex items-start">
                                                    <i className="fas fa-map-marker-alt mr-2 text-[#F4B400] mt-0.5"></i>
                                                    <span className="line-clamp-2">{order.delivery_address}</span>
                                                </p>
                                                {order.estimated_completion && (
                                                    <p className="text-[#333333] text-sm flex items-center">
                                                        <i className="fas fa-clock mr-2 text-[#F4B400]"></i>
                                                        <span className="text-green-600 font-medium">{order.estimated_completion}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#333333] mb-2 flex items-center">
                                                <i className="fas fa-shopping-cart mr-2 text-[#F4B400]"></i>
                                                Items ({order.items.length})
                                            </h4>
                                            <div className="bg-white rounded-lg border border-[#F4B400]/20 p-3">
                                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className="flex justify-between items-center text-sm">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-[#333333] truncate">
                                                                    {getProductDisplayName(item, index)}
                                                                </p>
                                                                <p className="text-xs text-gray-600">
                                                                    Qty: {item.quantity}
                                                                </p>
                                                            </div>
                                                            <p className="font-bold text-[#F4B400] ml-2">
                                                                {formatCurrency(item.sub_total || 0)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 text-center">
                                            ID: {order.order_id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {filteredOrders.length > 0 && (
                    <div className="mt-6 text-center">
                        <div className="bg-[#FAFAFA] rounded-lg border border-[#CCCCCC] py-2 px-4 inline-block">
                            <p className="text-[#333333] text-sm">
                                <i className="fas fa-chart-bar mr-1 text-[#F4B400]"></i>
                                Showing <span className="font-bold text-[#F4B400]">{filteredOrders.length}</span> of{' '}
                                <span className="font-bold text-[#F4B400]">{customerDetails.orders?.length || 0}</span> orders
                            </p>
                        </div>
                    </div>
                )}
            </div>
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
                integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg=="
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
            />
        </div>
    );
}