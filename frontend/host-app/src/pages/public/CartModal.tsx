import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchStoreInfo, fetchCustomerDetails, placeOrder } from '../../services/CustomerService';

export default function CartModal({ isOpen, onClose, store, onOrderSuccess }) {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [orderLoading, setOrderLoading] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [riderNote, setRiderNote] = useState('');
    const [showCheckout, setShowCheckout] = useState(false);
    const [useRedeemPoints, setUseRedeemPoints] = useState(false);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [loyaltyProgramEnabled, setLoyaltyProgramEnabled] = useState(false);
    const { user, token, logout } = useAuth();

    useEffect(() => {
        if (isOpen) {
            loadCart();
            fetchCustomerDetailsAndStore();
        }
    }, [isOpen, user, token, store]);

    const fetchCustomerDetailsAndStore = async () => {
        try {
            setLoading(true);
            if (store?.slug) {
                const storeData = await fetchStoreInfo(store.slug);
                setLoyaltyProgramEnabled(storeData.loyaltyprogram === 'enable');
            }
            if (token) {
                const customerData = await fetchCustomerDetails(token, logout);
                setDeliveryAddress(customerData.addresses?.[0] || '');
                setPhoneNumber(customerData.phone_number || '');
                setLoyaltyPoints(customerData.loyalty_points || 0);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoyaltyProgramEnabled(false);
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
                rider_note: riderNote.trim() || undefined,
                use_redeem_points: useRedeemPoints
            };

            const result = await placeOrder(token, logout, orderData);

            let successMessage = 'Order placed successfully!';
            if (result.redeemed_points && result.redeemed_points > 0) {
                successMessage += ` You redeemed ${result.redeemed_points} loyalty points!`;
            }
            if (result.earned_points && result.earned_points > 0) {
                successMessage += ` You earned ${result.earned_points} new loyalty points with this order!`;
            }

            clearCart();
            setShowCheckout(false);
            setUseRedeemPoints(false);
            setRiderNote('');
            onClose();
            onOrderSuccess({ ...result, successMessage });
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
                            {loyaltyProgramEnabled && loyaltyPoints > 0 && (
                                <div className="mb-3 md:mb-4 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-l-4 border-blue-400 shadow-sm">
                                    <div className="flex items-center space-x-2 mb-1 md:mb-2">
                                        <i className="fas fa-star text-yellow-500 text-sm md:text-base"></i>
                                        <span className="text-sm md:text-base font-semibold text-gray-800">
                                            You have {loyaltyPoints} loyalty points!
                                        </span>
                                    </div>
                                    <p className="text-xs md:text-sm text-blue-700">
                                        Use them at checkout to save money on your order 💰
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
                                        <div key={item._id} className="flex items-center bg-gray-50 rounded-xl p-3 md:p-4 hover:bg-gray-100 transition-colors shadow-sm">
                                            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
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
                                                <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
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
                                                <button
                                                    onClick={() => removeFromCart(item._id)}
                                                    className="text-red-500 hover:text-red-600 transition-colors p-1 md:p-2"
                                                >
                                                    <i className="fas fa-trash text-xs md:text-sm"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="bg-gray-50 rounded-xl p-3 md:p-4 mt-3 md:mt-4 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm md:text-base font-semibold text-gray-800">Subtotal ({getTotalItems()} items):</span>
                                            <span className="text-base md:text-lg font-bold text-yellow-600">{getCurrencySymbol()}{getSubtotal().toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={() => setShowCheckout(true)}
                                            className="w-full mt-3 md:mt-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold py-2 md:py-3 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105"
                                        >
                                            <i className="fas fa-credit-card mr-1 md:mr-2"></i>Proceed to Checkout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            {loading ? (
                                <div className="text-center py-8 md:py-12 flex-1 flex items-center justify-center">
                                    <div>
                                        <i className="fas fa-spinner fa-spin text-3xl md:text-4xl text-yellow-500"></i>
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
                                            <div className="bg-gray-50 rounded-xl p-3 md:p-4 max-h-48 md:max-h-64 overflow-auto shadow-sm">
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
                                                    <div className="flex justify-between items-center pt-2 border-t-2 border-yellow-400">
                                                        <span className="text-lg md:text-xl font-bold">Total:</span>
                                                        <span className="text-lg md:text-xl font-bold text-yellow-600">
                                                            {getCurrencySymbol()}{getSubtotal().toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {loyaltyProgramEnabled && loyaltyPoints > 0 && (
                                                    <div className="mt-3 md:mt-4 p-3 md:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-l-4 border-blue-400 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2 md:mb-3">
                                                            <div className="flex items-center space-x-2">
                                                                <i className="fas fa-star text-yellow-500 text-sm md:text-base"></i>
                                                                <span className="font-semibold text-gray-800 text-sm md:text-base">
                                                                    Use Loyalty Points
                                                                </span>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={useRedeemPoints}
                                                                    onChange={(e) => setUseRedeemPoints(e.target.checked)}
                                                                    disabled={loyaltyPoints === 0}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className={`w-11 h-6 rounded-full peer-focus:ring-4 peer-focus:ring-blue-300 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                                                                    loyaltyPoints === 0 ? 'bg-gray-300' : useRedeemPoints ? 'bg-blue-600' : 'bg-gray-200'
                                                                }`}></div>
                                                            </label>
                                                        </div>
                                                        <div className="text-xs md:text-sm text-gray-700">
                                                            <p className="mb-1">Available: <span className="font-semibold text-blue-600">{loyaltyPoints} points</span></p>
                                                            <p className="text-gray-600">Backend will calculate your discount automatically</p>
                                                            {useRedeemPoints && (
                                                                <div className="mt-2 p-2 bg-green-100 rounded-lg">
                                                                    <p className="text-green-700 font-medium text-xs">
                                                                        ✅ Your loyalty points will be applied to this order
                                                                    </p>
                                                                </div>
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
                                                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm md:text-base shadow-sm"
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
                                                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm md:text-base shadow-sm"
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
                                                        className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors text-sm md:text-base shadow-sm"
                                                    />
                                                </div>
                                                <div className="bg-green-50 rounded-xl p-3 md:p-4 border border-green-200 shadow-sm">
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
                            <div className="bg-white border-t pt-4 pb-2 mt-4 sticky bottom-0 shadow-lg">
                                <div className="flex space-x-2 md:space-x-4">
                                    <button
                                        onClick={() => {
                                            setShowCheckout(false);
                                            setUseRedeemPoints(false);
                                        }}
                                        className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 md:py-3 rounded-xl transition-colors text-sm md:text-base shadow-md"
                                    >
                                        <i className="fas fa-arrow-left mr-1 md:mr-2"></i>Back to Cart
                                    </button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={orderLoading || !deliveryAddress.trim() || !phoneNumber.trim() || !token}
                                        className="flex-[2] bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 md:py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base shadow-lg transform hover:scale-105"
                                    >
                                        {orderLoading ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin mr-1 md:mr-2"></i>Placing Order...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-check mr-1 md:mr-2"></i>Place Order ({getCurrencySymbol()}{getSubtotal().toFixed(2)})
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