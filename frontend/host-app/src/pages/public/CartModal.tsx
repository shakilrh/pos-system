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
    const [loyaltyProgramEnabled, setLoyaltyProgramEnabled] = useState(false);
    const { user, token } = useAuth();

    useEffect(() => {
        if (isOpen) {
            loadCart();
            fetchCustomerDetails();
            checkLoyaltyProgramStatus();
        }
    }, [isOpen, user, token, store]);

    const checkLoyaltyProgramStatus = async () => {
        if (!store?.slug) return;

        try {
            const response = await fetch(`${API_BASE_URL}/users/api/v1/public/store/${store.slug}`);
            const data = await response.json();

            if (data.success && data.data?.data?.store?.loyaltyprogram === 'enable') {
                setLoyaltyProgramEnabled(true);
            } else {
                setLoyaltyProgramEnabled(false);
            }
        } catch (error) {
            console.error('Error checking loyalty program status:', error);
            setLoyaltyProgramEnabled(false);
        }
    };

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
                let customerData = null;

                if (data.data?.data?.data) {
                    customerData = data.data.data.data;
                } else if (data.data?.data) {
                    customerData = data.data.data;
                } else if (data.data) {
                    customerData = data.data;
                }

                if (customerData) {
                    if (customerData.addresses && customerData.addresses.length > 0) {
                        setDeliveryAddress(customerData.addresses[0]);
                    }

                    if (customerData.phone_number) {
                        setPhoneNumber(customerData.phone_number);
                    }

                    if (customerData.loyalty_points !== undefined && customerData.loyalty_points !== null) {
                        setLoyaltyPoints(customerData.loyalty_points);
                    }
                }
            } else {
                throw new Error(data.message || 'Failed to retrieve customer data');
            }
        } catch (error) {
            console.error('Error fetching customer details:', error);
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

            if (useLoyaltyPoints && getPointsToUse() > 0) {
                orderData.redeem_points = getPointsToUse();
            }

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
                if (useLoyaltyPoints && getPointsToUse() > 0) {
                    alert(`You redeemed ${getPointsToUse()} points for a discount of ${getCurrencySymbol()}${getLoyaltyDiscount().toFixed(2)}!`);
                } else if (loyaltyProgramEnabled && loyaltyPoints === 0) {
                    alert('You have no loyalty points yet. Earn points with this order!');
                }

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
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 md:p-6 text-white flex-shrink-0">

                <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 md:space-x-3">
                            <i className="fas fa-shopping-cart text-xl md:text-2xl"></i>
                            <div>
                                <h2 className="text-lg md:text-2xl font-bold">
                                    {showCheckout ? 'Checkout' : 'Your Cart'}
                                </h2>
                                <p className="opacity-90 text-sm">
                                    {showCheckout ? 'Complete your order' : `${getTotalItems()} items in cart`}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1 md:p-2 transition-all duration-200"
                        >
                            <i className="fas fa-times text-lg md:text-xl"></i>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6">
                    {!showCheckout ? (
                        <div>
                            {/* Loyalty Info at Cart View */}
                            {loyaltyProgramEnabled && loyaltyPoints > 0 && (

                                <div className="mb-3 md:mb-4 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-400">
                                    <div className="flex items-center space-x-2 mb-1 md:mb-2">
                                        <i className="fas fa-star text-yellow-400 text-sm md:text-base"></i>
                                        <span className="text-xs md:text-sm font-medium">
                                            {loyaltyPoints > 0
                                                ? `You have ${loyaltyPoints} loyalty points!`
                                                : `Earn loyalty points with this order!`}
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-600">
                                        100 points = {getCurrencySymbol()}1 discount
                                    </p>
                                </div>
                            )}
                            {cart.length === 0 ? (
                                <div className="text-center py-8 md:py-12">
                                    <i className="fas fa-shopping-cart text-4xl md:text-6xl text-gray-300 mb-4"></i>
                                    <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">Your cart is empty</h3>
                                    <p className="text-gray-500 text-sm md:text-base">Add some delicious items to get started!</p>
                                </div>
                            ) : (
                                <div className="space-y-3 md:space-y-4">
                                    {cart.map((item) => (
                                        <div key={item._id} className="flex items-center bg-gray-50 rounded-xl p-3 md:p-4 hover:bg-gray-100 transition-colors">
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                                                {item.pictureUrl ? (
                                                    <img
                                                        src={item.pictureUrl}
                                                        alt={item.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-yellow-100 flex items-center justify-center">
                                                        <i className="fas fa-utensils text-yellow-500 text-sm md:text-base"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 ml-3 md:ml-4 min-w-0">
                                                <h4 className="font-semibold text-gray-800 text-sm md:text-base capitalize truncate">{item.name}</h4>
                                                <p className="text-yellow-600 font-bold text-sm md:text-base">
                                                    {getCurrencySymbol()}{item.price} each
                                                </p>
                                                {item.description && (
                                                    <p className="text-gray-500 text-xs md:text-sm truncate">{item.description}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2 md:space-x-3">
                                                <div className="flex items-center bg-white rounded-lg border border-gray-200">
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                        className="px-2 py-1 md:px-3 md:py-2 text-gray-600 hover:text-red-500 transition-colors text-xs md:text-sm"
                                                    >
                                                        <i className="fas fa-minus"></i>
                                                    </button>
                                                    <span className="px-2 md:px-4 py-1 md:py-2 font-semibold min-w-[30px] md:min-w-[50px] text-center text-xs md:text-sm">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                        className="px-2 py-1 md:px-3 md:py-2 text-gray-600 hover:text-green-500 transition-colors text-xs md:text-sm"
                                                    >
                                                        <i className="fas fa-plus"></i>
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-800 text-sm md:text-base">
                                                        {getCurrencySymbol()}{(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                    <button
                                                        onClick={() => removeFromCart(item._id)}
                                                        className="text-red-500 hover:text-red-700 text-xs transition-colors"
                                                    >
                                                        <i className="fas fa-trash mr-1"></i>Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-4 md:p-6 text-white mt-4 md:mt-6">
                                        <div className="flex justify-between items-center mb-3 md:mb-4">
                                            <span className="text-sm md:text-lg">Total Items:</span>
                                            <span className="font-bold text-base md:text-xl">{getTotalItems()}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-4 md:mb-6">
                                            <span className="text-base md:text-xl">Total Amount:</span>
                                            <span className="font-bold text-lg md:text-2xl text-yellow-400">
                                                {getCurrencySymbol()}{getTotalAmount().toFixed(2)}
                                            </span>
                                        </div>

                                        {loyaltyProgramEnabled && loyaltyPoints > 0 && (
                                            <div className="mb-3 md:mb-4 p-3 md:p-4 bg-blue-900 bg-opacity-50 rounded-lg border border-blue-400">
                                                <div className="flex items-center space-x-2 mb-1 md:mb-2">
                                                    <i className="fas fa-star text-yellow-400 text-sm md:text-base"></i>
                                                    <span className="text-xs md:text-sm font-medium">You have {loyaltyPoints} loyalty points!</span>
                                                </div>
                                                <p className="text-xs text-blue-200">
                                                    Use them at checkout to get discounts (100 points = {getCurrencySymbol()}1 off)
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex space-x-2 md:space-x-3">
                                            <button
                                                onClick={clearCart}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 md:py-3 rounded-xl transition-colors text-xs md:text-sm"
                                            >
                                                <i className="fas fa-trash mr-1 md:mr-2"></i>Clear Cart
                                            </button>
                                            <button
                                                onClick={() => setShowCheckout(true)}
                                                className="flex-[2] bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 md:py-3 rounded-xl transition-colors text-xs md:text-sm"
                                            >
                                                <i className="fas fa-credit-card mr-1 md:mr-2"></i>Checkout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            {loading ? (
                                <div className="text-center py-8 md:py-12 flex-1 flex items-center justify-center">
                                    <div>
                                        <i className="fas fa-spinner fa-spin text-3xl md:text-4xl text-gray-400"></i>
                                        <p className="mt-2 text-gray-600 text-sm md:text-base">Loading details...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-auto">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pb-20">
                                        <div>
                                            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">
                                                <i className="fas fa-list-alt mr-2"></i>Order Summary
                                            </h3>
                                            <div className="bg-gray-50 rounded-xl p-3 md:p-4 max-h-48 md:max-h-64 overflow-auto">
                                                {cart.map((item) => (
                                                    <div key={item._id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                                        <div className="flex-1 truncate">
                                                            <span className="font-medium text-sm md:text-base capitalize">{item.name}</span>
                                                            <span className="text-gray-500 ml-2 text-xs md:text-sm">× {item.quantity}</span>
                                                        </div>
                                                        <span className="font-bold text-yellow-600 text-sm md:text-base">
                                                            {getCurrencySymbol()}{(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}

                                                <div className="pt-3 md:pt-4 mt-3 md:mt-4 border-t border-gray-300 space-y-1 md:space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600 text-sm md:text-base">Subtotal:</span>
                                                        <span className="font-medium text-sm md:text-base">
                                                            {getCurrencySymbol()}{getSubtotal().toFixed(2)}
                                                        </span>
                                                    </div>

                                                    {useLoyaltyPoints && getLoyaltyDiscount() > 0 && (
                                                        <div className="flex justify-between items-center text-green-600 text-sm md:text-base">
                                                            <span>Loyalty Discount ({getPointsToUse()} points):</span>
                                                            <span>-{getCurrencySymbol()}{getLoyaltyDiscount().toFixed(2)}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-center pt-2 border-t-2 border-yellow-400">
                                                        <span className="text-lg md:text-xl font-bold">Total:</span>
                                                        <span className="text-lg md:text-xl font-bold text-yellow-600">
                                                            {getCurrencySymbol()}{getTotalAmount().toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {loyaltyProgramEnabled && loyaltyPoints > 0 && (
                                                    <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                                                        <div className="flex items-center justify-between mb-2 md:mb-3">
                                                            <div className="flex items-center space-x-2">
                                                                <i className="fas fa-star text-yellow-500 text-sm md:text-base"></i>
                                                                <span className="font-medium text-gray-700 text-sm md:text-base">
                                                                Use Loyalty Points
                                                            </span>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={useLoyaltyPoints}
                                                                    onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                                                                    disabled={loyaltyPoints === 0}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className={`w-9 h-5 md:w-11 md:h-6 rounded-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 md:after:h-5 md:after:w-5 after:transition-all ${
                                                                    loyaltyPoints === 0 ? 'bg-gray-300' : 'bg-gray-200 peer-checked:bg-blue-600'
                                                                }`}></div>
                                                            </label>
                                                        </div>
                                                        <div className="text-xs md:text-sm text-gray-600">
                                                            <p>Available: <span className="font-medium text-blue-600">{loyaltyPoints} points</span></p>
                                                            <p> <span className="font-medium">100 points = {getCurrencySymbol()}1 discount</span></p>
                                                            {useLoyaltyPoints && loyaltyPoints > 0 && (
                                                                <p className="mt-1 md:mt-2 text-green-600 font-medium">
                                                                    Using {getPointsToUse()} points for {getCurrencySymbol()}{getLoyaltyDiscount().toFixed(2)} discount
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">
                                                <i className="fas fa-map-marker-alt mr-2"></i>Delivery Details
                                            </h3>
                                            <div className="space-y-3 md:space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                                        Delivery Address *
                                                    </label>
                                                    <textarea
                                                        value={deliveryAddress}
                                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                                        placeholder="Enter your complete delivery address"
                                                        rows={2}
                                                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm md:text-base"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                                        Phone Number *
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={phoneNumber}
                                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                                        placeholder="+923001234567"
                                                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm md:text-base"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                                        Special Instructions (Optional)
                                                    </label>
                                                    <textarea
                                                        value={riderNote}
                                                        onChange={(e) => setRiderNote(e.target.value)}
                                                        placeholder="Any special instructions for the delivery rider (optional)"
                                                        rows={2}
                                                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm md:text-base"
                                                    />
                                                </div>
                                                <div className="bg-green-50 rounded-xl p-3 md:p-4">
                                                    <div className="flex items-center space-x-2 md:space-x-3">
                                                        <i className="fas fa-money-bill-wave text-green-600 text-lg md:text-xl"></i>
                                                        <div>
                                                            <h4 className="font-semibold text-green-800 text-sm md:text-base">Cash on Delivery</h4>
                                                            <p className="text-xs md:text-sm text-green-600">Pay when you receive your order</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="bg-white border-t pt-4 pb-2 mt-4 sticky bottom-0">
                                <div className="flex space-x-2 md:space-x-4">
                                    <button
                                        onClick={() => setShowCheckout(false)}
                                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 md:py-3 rounded-xl transition-colors text-sm md:text-base"
                                    >
                                        <i className="fas fa-arrow-left mr-1 md:mr-2"></i>Back to Cart
                                    </button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={orderLoading || !deliveryAddress.trim() || !phoneNumber.trim() || !token}
                                        className="flex-[2] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 md:py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                                    >
                                        {orderLoading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin mr-1 md:mr-2"></i>Placing Order...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-check mr-1 md:mr-2"></i>Place Order ({getCurrencySymbol()}{getTotalAmount().toFixed(2)})
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}