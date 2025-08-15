import { useEffect, useState } from 'react';

export default function OrderSuccessModal({ isOpen, onClose, orderData }) {
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => onClose(), 10000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen || !orderData) return null;

    const getCurrencySymbol = () => 'PKR ';
    const formatTime = (timeString) => (timeString ? new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
            <div className="bg-white rounded-xl shadow-lg max-w-sm w-full overflow-hidden animate-bounce-in">
                {/* Success Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-center text-white">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto">
                        <i className="fas fa-check text-2xl text-green-500"></i>
                    </div>
                    <h2 className="text-xl font-bold mt-2">Order Placed!</h2>
                    <p className="text-sm opacity-90">Thank you</p>
                </div>

                <div className="p-4 text-sm">
                    {/* Order Details */}
                    <div className="text-center mb-3">
                        <div className="bg-gray-50 rounded p-3 mb-3">
                            <h3 className="text-base font-semibold text-gray-800">Order #</h3>
                            <p className="text-lg font-bold text-green-600 font-mono">
                                {orderData.order_number}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-blue-50 rounded p-2">
                                <i className="fas fa-clock text-blue-500 text-sm"></i>
                                <p className="font-semibold text-blue-800">Est. Time</p>
                                <p className="text-blue-600">{formatTime(orderData.estimated_completion)}</p>
                            </div>
                            <div className="bg-yellow-50 rounded p-2">
                                <i className="fas fa-money-bill-wave text-yellow-500 text-sm"></i>
                                <p className="font-semibold text-yellow-800">Total</p>
                                <p className="text-yellow-600">{getCurrencySymbol()}{orderData.total_amount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Status */}
                    <div className="bg-orange-50 rounded p-3 mb-3 border border-orange-200">
                        <div className="flex items-center justify-center space-x-1">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            <span className="font-semibold text-orange-800 text-sm capitalize">
                                {orderData.status}
                            </span>
                        </div>
                        <p className="text-center text-orange-600 text-xs">Being prepared</p>
                    </div>

                    {/* Toggle Details */}
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-sm font-medium py-1.5 px-3 rounded mt-2 flex items-center justify-center space-x-1"
                    >
                        <span>{showDetails ? 'Hide' : 'Show'} Details</span>
                        <i className={`fas fa-chevron-${showDetails ? 'up' : 'down'} text-sm`}></i>
                    </button>

                    {/* Order Details (Collapsible) */}
                    {showDetails && (
                        <div className="bg-gray-50 rounded p-3 mt-2 space-y-2 max-h-40 overflow-auto text-sm">
                            <h4 className="font-semibold text-gray-800 border-b border-gray-200 pb-1">Items</h4>
                            {orderData.items?.map((item, index) => (
                                <div key={index} className="flex justify-between">
                                    <span className="capitalize">{item.product?.name} x{item.quantity}</span>
                                    <span className="text-green-600">{getCurrencySymbol()}{item.sub_total}</span>
                                </div>
                            ))}
                            {orderData.delivery_address && (
                                <div className="pt-2">
                                    <span className="font-semibold text-gray-700">Address:</span>
                                    <p className="text-gray-600">{orderData.delivery_address}</p>
                                </div>
                            )}
                            {orderData.rider_note && (
                                <div>
                                    <span className="font-semibold text-gray-700">Note:</span>
                                    <p className="text-gray-600">{orderData.rider_note}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payment Info */}
                    <div className="bg-green-50 rounded p-3 mb-3 border border-green-200">
                        <div className="flex items-center justify-center space-x-1">
                            <i className="fas fa-money-bill-wave text-green-600 text-sm"></i>
                            <span className="font-semibold text-green-800 text-sm">Cash on Delivery</span>
                        </div>
                        <p className="text-center text-green-600 text-xs">Pay on arrival</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 mt-3">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-3 rounded text-sm"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                // Optional: Add redirect logic here
                            }}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded text-sm"
                        >
                            Track
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-bounce-in {
                    animation: bounceIn 0.5s ease-out;
                }
                @keyframes bounceIn {
                    0% { transform: scale(0.7); opacity: 0; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}