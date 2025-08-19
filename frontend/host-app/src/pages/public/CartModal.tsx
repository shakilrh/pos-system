import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://192.168.18.107:3000';

export default function CartModal({ isOpen, onClose, store, onOrderSuccess }) {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [orderLoading, setOrderLoading] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [riderNote, setRiderNote] = useState('');
    const [showCheckout, setShowCheckout] = useState(false);
    const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const { user, token } = useAuth();

    useEffect(() => {
        if (isOpen) {
            loadCart();
            fetchCustomerDetails();
        }
    }, [isOpen, user, token]);

    const fetchCustomerDetails = async () => {
        if (!token) {
            console.error('No token available');
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/orders/api/v1/customer/details`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch customer details');
            }

            if (data.success) {
                // Handle nested data structure - check both levels
                let customerData = null;

                if (data.data?.data?.data) {
                    // Triple nested structure
                    customerData = data.data.data.data;
                } else if (data.data?.data) {
                    // Double nested structure
                    customerData = data.data.data;
                } else if (data.data) {
                    // Single nested structure
                    customerData = data.data;
                }

                if (customerData) {
                    // Set delivery address - use first address if available
                    if (customerData.addresses && customerData.addresses.length > 0) {
                        setDeliveryAddress(customerData.addresses[0]);
                    }

                    // Set phone number
                    if (customerData.phone_number) {
                        setPhoneNumber(customerData.phone_number);
                    }

                    // Set loyalty points
                    if (customerData.loyalty_points !== undefined && customerData.loyalty_points !== null) {
                        setLoyaltyPoints(customerData.loyalty_points);
                    }

                    console.log('Customer data loaded successfully:', customerData);
                } else {
                    console.warn('Customer data structure not recognized:', data);
                }
            } else {
                throw new Error(data.message || 'Failed to retrieve customer data');
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);
            // Don't show alert for API errors, just log them
            console.warn('Could not load customer details, using defaults');
        } finally {
            setLoading(false);
        }
    };

    const loadCart = () => {
        try {
            const savedCart = localStorage.getItem(`cart_${store?.slug || 'default'}`);
            if (savedCart) {
                setCart(JSON.parse(savedCart));
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            setCart([]);
        }
    };

    const saveCart = (newCart) => {
        try {
            localStorage.setItem(`cart_${store?.slug || 'default'}`, JSON.stringify(newCart));
            setCart(newCart);
            window.dispatchEvent(new CustomEvent('cartUpdated', { detail: newCart }));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }
        const updatedCart = cart.map(item =>
            item._id === productId ? { ...item, quantity: newQuantity } : item
        );
        saveCart(updatedCart);
    };

    const removeFromCart = (productId) => {
        const updatedCart = cart.filter(item => item._id !== productId);
        saveCart(updatedCart);
    };

    const clearCart = () => {
        saveCart([]);
    };

    const getSubtotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getLoyaltyDiscount = () => {
        if (!useLoyaltyPoints || loyaltyPoints === 0) return 0;
        const subtotal = getSubtotal();
        // 100 loyalty points = 1 currency unit
        const maxDiscount = loyaltyPoints / 100;
        return Math.min(maxDiscount, subtotal);
    };

    const getTotalAmount = () => {
        const subtotal = getSubtotal();
        const discount = getLoyaltyDiscount();
        return Math.max(0, subtotal - discount);
    };

    const getPointsToUse = () => {
        if (!useLoyaltyPoints) return 0;
        const subtotal = getSubtotal();
        const maxDiscount = loyaltyPoints / 100;
        const actualDiscount = Math.min(maxDiscount, subtotal);
        return Math.floor(actualDiscount * 100);
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const getCurrencySymbol = () => {
        if (store?.currency === 'dollar') return '$';
        if (store?.currency === 'euro') return '€';
        return 'PKR ';
    };

    const handlePlaceOrder = async () => {
        if (!deliveryAddress.trim()) {
            alert('Please enter delivery address');
            return;
        }
        if (!phoneNumber.trim()) {
            alert('Please enter phone number');
            return;
        }
        if (!token) {
            alert('Please log in to place an order');
            return;
        }

        setOrderLoading(true);
        try {
            const orderData = {
                items: cart.map(item => ({
                    product_id: item._id,
                    quantity: item.quantity
                })),
                delivery_address: deliveryAddress.trim(),
                phone_number: phoneNumber.trim(),
                payment_method: 'cash'
            };

            // Add redeem_points only if loyalty points are being used
            if (useLoyaltyPoints && getPointsToUse() > 0) {
                orderData.redeem_points = getPointsToUse();
            }

            // Only add rider_note if it's not empty
            if (riderNote.trim()) {
                orderData.rider_note = riderNote.trim();
            }

            const response = await fetch(`${API_BASE_URL}/orders/api/v1/online-create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();

            if (result.success) {
                clearCart();
                setShowCheckout(false);
                setUseLoyaltyPoints(false);
                setRiderNote('');
                onClose();
                onOrderSuccess(result.data.data);
            } else {
                throw new Error(result.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            alert(error.message || 'Failed to place order. Please try again.');
        } finally {
            setOrderLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <i className="fas fa-shopping-cart text-2xl"></i>
                            <div>
                                <h2 className="text-2xl font-bold">
                                    {showCheckout ? 'Checkout' : 'Your Cart'}
                                </h2>
                                <p className="opacity-90">
                                    {showCheckout ? 'Complete your order' : `${getTotalItems()} items in cart`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto max-h-[calc(90vh-120px)]">
                    {!showCheckout ? (
                        <div className="p-6">
                            {cart.length === 0 ? (
                                <div className="text-center py-12">
                                    <i className="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h3>
                                    <p className="text-gray-500">Add some delicious items to get started!</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div key={item._id} className="flex items-center bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                                            <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                                                {item.pictureUrl ? (
                                                    <img
                                                        src={item.pictureUrl}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-yellow-100 flex items-center justify-center">
                                                        <i className="fas fa-utensils text-yellow-500"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 ml-4">
                                                <h4 className="font-semibold text-gray-800 capitalize">{item.name}</h4>
                                                <p className="text-yellow-600 font-bold">
                                                    {getCurrencySymbol()}{item.price} each
                                                </p>
                                                {item.description && (
                                                    <p className="text-gray-500 text-sm line-clamp-1">{item.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center bg-white rounded-lg border-2 border-gray-200">
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                        className="px-3 py-2 text-gray-600 hover:text-red-500 transition-colors"
                                                    >
                                                        <i className="fas fa-minus"></i>
                                                    </button>
                                                    <span className="px-4 py-2 font-semibold min-w-[50px] text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                        className="px-3 py-2 text-gray-600 hover:text-green-500 transition-colors"
                                                    >
                                                        <i className="fas fa-plus"></i>
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-800">
                                                        {getCurrencySymbol()}{(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                    <button
                                                        onClick={() => removeFromCart(item._id)}
                                                        className="text-red-500 hover:text-red-700 text-sm transition-colors"
                                                    >
                                                        <i className="fas fa-trash mr-1"></i>Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white mt-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-lg">Total Items:</span>
                                            <span className="font-bold text-xl">{getTotalItems()}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-xl">Total Amount:</span>
                                            <span className="font-bold text-2xl text-yellow-400">
                                                {getCurrencySymbol()}{getTotalAmount().toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Loyalty Points Notification */}
                                        {loyaltyPoints > 0 && (
                                            <div className="mb-4 p-4 bg-blue-900 bg-opacity-50 rounded-lg border border-blue-400">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <i className="fas fa-star text-yellow-400"></i>
                                                    <span className="text-sm font-medium">You have {loyaltyPoints} loyalty points!</span>
                                                </div>
                                                <p className="text-xs text-blue-200">
                                                    Use them at checkout to get discounts (100 points = {getCurrencySymbol()}1 off)
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex space-x-3">
                                            <button
                                                onClick={clearCart}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors"
                                            >
                                                <i className="fas fa-trash mr-2"></i>Clear Cart
                                            </button>
                                            <button
                                                onClick={() => setShowCheckout(true)}
                                                className="flex-[2] bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 rounded-xl transition-colors"
                                            >
                                                <i className="fas fa-credit-card mr-2"></i>Proceed to Checkout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-12">
                                    <i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                                    <p className="mt-2 text-gray-600">Loading details...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                                            <i className="fas fa-list-alt mr-2"></i>Order Summary
                                        </h3>
                                        <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-auto">
                                            {cart.map((item) => (
                                                <div key={item._id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                                    <div className="flex-1">
                                                        <span className="font-medium capitalize">{item.name}</span>
                                                        <span className="text-gray-500 ml-2">× {item.quantity}</span>
                                                    </div>
                                                    <span className="font-bold text-yellow-600">
                                                        {getCurrencySymbol()}{(item.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}

                                            {/* Pricing breakdown */}
                                            <div className="pt-4 mt-4 border-t border-gray-300 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">Subtotal:</span>
                                                    <span className="font-medium">
                                                        {getCurrencySymbol()}{getSubtotal().toFixed(2)}
                                                    </span>
                                                </div>

                                                {useLoyaltyPoints && getLoyaltyDiscount() > 0 && (
                                                    <div className="flex justify-between items-center text-green-600">
                                                        <span>Loyalty Discount ({getPointsToUse()} points):</span>
                                                        <span>-{getCurrencySymbol()}{getLoyaltyDiscount().toFixed(2)}</span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center pt-2 border-t-2 border-yellow-400">
                                                    <span className="text-xl font-bold">Total:</span>
                                                    <span className="text-xl font-bold text-yellow-600">
                                                        {getCurrencySymbol()}{getTotalAmount().toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Loyalty Points Section */}
                                            {loyaltyPoints > 0 && (
                                                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-2">
                                                            <i className="fas fa-star text-yellow-500"></i>
                                                            <span className="font-medium text-gray-700">
                                                                Use Loyalty Points
                                                            </span>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={useLoyaltyPoints}
                                                                onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </label>
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <p>Available: <span className="font-medium text-blue-600">{loyaltyPoints} points</span></p>
                                                        <p>Conversion: <span className="font-medium">100 points = {getCurrencySymbol()}1 discount</span></p>
                                                        {useLoyaltyPoints && (
                                                            <p className="mt-2 text-green-600 font-medium">
                                                                Using {getPointsToUse()} points for {getCurrencySymbol()}{getLoyaltyDiscount().toFixed(2)} discount
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-4">
                                            <i className="fas fa-map-marker-alt mr-2"></i>Delivery Details
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Delivery Address *
                                                </label>
                                                <textarea
                                                    value={deliveryAddress}
                                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                                    placeholder="Enter your complete delivery address"
                                                    rows={3}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Phone Number *
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    placeholder="+923001234567"
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Special Instructions (Optional)
                                                </label>
                                                <textarea
                                                    value={riderNote}
                                                    onChange={(e) => setRiderNote(e.target.value)}
                                                    placeholder="Any special instructions for the delivery rider (optional)"
                                                    rows={2}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                                                />
                                            </div>
                                            <div className="bg-green-50 rounded-xl p-4">
                                                <div className="flex items-center space-x-3">
                                                    <i className="fas fa-money-bill-wave text-green-600 text-xl"></i>
                                                    <div>
                                                        <h4 className="font-semibold text-green-800">Cash on Delivery</h4>
                                                        <p className="text-sm text-green-600">Pay when you receive your order</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex space-x-4 mt-8 pt-6 border-t">
                                <button
                                    onClick={() => setShowCheckout(false)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors"
                                >
                                    <i className="fas fa-arrow-left mr-2"></i>Back to Cart
                                </button>
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={orderLoading || !deliveryAddress.trim() || !phoneNumber.trim() || !token}
                                    className="flex-[2] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {orderLoading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>Placing Order...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-check mr-2"></i>Place Order ({getCurrencySymbol()}{getTotalAmount().toFixed(2)})
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}