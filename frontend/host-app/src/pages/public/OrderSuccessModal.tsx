import { useEffect, useState } from 'react';

export default function OrderSuccessModal({ isOpen, onClose, orderData, currency }) {
    const [showDetails, setShowDetails] = useState(true);

    if (!isOpen || !orderData) return null;

    const getCurrencySymbol = () => {
        if (currency === 'dollar') return '$';
        if (currency === 'euro') return 'â‚¬';
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
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-up relative">
                {/* Order Number Tag */}
                <div className="absolute top-3 right-3 bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-mono font-bold z-10 shadow-lg">
                    #{orderData.order_number}
                </div>

                {/* Compact Success Header */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 text-center text-gray-900">
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                        <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold">Order Confirmed!</h2>

                    {/* Success Message */}
                    {orderData?.successMessage && (
                        <div className="mt-2 px-3 py-1.5 bg-white/20 rounded-lg border border-white/30 shadow-sm">
                            <p className="text-xs text-gray-800 font-medium">{orderData.successMessage}</p>
                        </div>
                    )}
                </div>

                <div className="p-4">
                    {/* Key Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-gray-100 rounded-lg p-3 text-center border border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Ready by</div>
                            <div className="text-sm font-bold text-gray-800">{formatTime(orderData.estimated_completion)}</div>
                        </div>

                        <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
                            <div className="text-xs text-yellow-700 mb-1">Total</div>
                            <div className="text-sm font-bold text-yellow-800">{getCurrencySymbol()}{orderData.total_amount}</div>
                        </div>
                    </div>

                    {/* Order Status */}
                    <div className="bg-gradient-to-r from-yellow-50 to-gray-50 rounded-lg p-3 mb-3 text-center border border-yellow-200 shadow-sm">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse shadow-sm"></div>
                            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Order Status</span>
                        </div>
                        <div className="text-sm font-bold text-gray-800 capitalize bg-white/50 rounded-full px-3 py-1 inline-block">
                            {orderData.status}
                        </div>
                    </div>

                    {/* Items Summary */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-800">Items Ordered</span>
                        </div>

                        <div className="bg-gray-100 rounded-lg p-2.5 border border-gray-200">
                            <div className="space-y-1.5">
                                {orderData.items?.map((item, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        {item.product_id?.pictureUrl && (
                                            <img
                                                src={item.product_id.pictureUrl}
                                                alt={item.product_id.name}
                                                className="w-7 h-7 rounded object-cover border border-gray-200"
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
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-green-50 rounded-lg p-2.5 mb-3 text-center border border-green-200">
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
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors border border-gray-300"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                // Add tracking logic here
                            }}
                            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors shadow-sm"
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