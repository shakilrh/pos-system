import { useEffect, useState } from 'react';

export default function OrderSuccessModal({ isOpen, onClose, orderData, currency }) {
    const [showDetails, setShowDetails] = useState(true);

    if (!isOpen || !orderData) return null;

    const getCurrencySymbol = () => {
        if (currency === 'dollar') return '$';
        if (currency === 'euro') return '€';
        return 'PKR ';
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'TBD';
        if (timeString.includes('AM') || timeString.includes('PM')) {
            return timeString;
        }
        try {
            return new Date(timeString).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return timeString || 'TBD';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-up">
                {/* Compact Success Header */}
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-4 text-center text-white">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold">Order Confirmed!</h2>
                    <p className="text-white/90 text-sm">We're preparing your meal</p>
                </div>

                <div className="p-4">
                    {/* Order Number */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-center">
                        <div className="text-xs text-gray-600 mb-1">Order Number</div>
                        <div className="text-lg font-bold text-gray-900 font-mono">
                            #{orderData.order_number}
                        </div>
                    </div>

                    {/* Key Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-blue-600 mb-1">Ready by</div>
                            <div className="text-sm font-bold text-blue-700">{formatTime(orderData.estimated_completion)}</div>
                        </div>

                        <div className="bg-emerald-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-emerald-600 mb-1">Total</div>
                            <div className="text-sm font-bold text-emerald-700">{getCurrencySymbol()}{orderData.total_amount}</div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="bg-orange-50 rounded-lg p-3 mb-4 text-center border border-orange-200">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-orange-800 capitalize">{orderData.status}</span>
                        </div>
                        <div className="text-xs text-orange-600 mt-1">Kitchen is working on your order</div>
                    </div>

                    {/* Items Summary */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-800">Items Ordered</span>
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-blue-600 text-xs font-medium flex items-center space-x-1"
                            >
                                <span>{showDetails ? 'Hide' : 'Show'}</span>
                                <svg className={`w-3 h-3 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="space-y-2">
                                {orderData.items?.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        {item.product_id?.pictureUrl && (
                                            <img
                                                src={item.product_id.pictureUrl}
                                                alt={item.product_id.name}
                                                className="w-8 h-8 rounded object-cover"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-medium text-gray-900 capitalize truncate">
                                                    {item.product_id?.name} x{item.quantity}
                                                </span>
                                                <span className="text-xs font-semibold text-gray-700 ml-2">
                                                    {getCurrencySymbol()}{item.sub_total}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {showDetails && orderData.delivery_address && (
                                    <div className="pt-2 mt-2 border-t border-gray-200">
                                        <div className="flex items-start space-x-1">
                                            <svg className="w-3 h-3 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            <div>
                                                <span className="text-xs font-medium text-gray-700">Address:</span>
                                                <p className="text-xs text-gray-600">{orderData.delivery_address}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-green-50 rounded-lg p-3 mb-4 text-center border border-green-200">
                        <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-sm font-medium text-green-800">Cash on Delivery</span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">Pay when your order arrives</div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                // Add tracking logic here
                            }}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
                        >
                            Track Order
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-scale-up {
                    animation: scaleUp 0.3s ease-out;
                }
                @keyframes scaleUp {
                    0% { 
                        transform: scale(0.9) translateY(10px); 
                        opacity: 0; 
                    }
                    100% { 
                        transform: scale(1) translateY(0); 
                        opacity: 1; 
                    }
                }
            `}</style>
        </div>
    );
}