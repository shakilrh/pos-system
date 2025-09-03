import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchCustomerDetails, updateCustomerAddress } from '../../services/CustomerService';

interface CustomerDetails {
    name: string;
    phone_number: string;
    addresses: string[];
}

interface AddressConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    subtitle?: string;
}

export default function AddressConfirmationModal({
                                                     isOpen,
                                                     onClose,
                                                     onConfirm,
                                                     title = "Confirm Delivery Address",
                                                     subtitle = "Where should we deliver your order?"
                                                 }: AddressConfirmationModalProps) {
    const { user, token, refreshUserProfile, logout } = useAuth();
    const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editAddress, setEditAddress] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (isOpen && token) {
            fetchCustomerDetailsData();
        }
    }, [isOpen, token]);

    const fetchCustomerDetailsData = async () => {
        try {
            setLoading(true);
            setError('');

            if (!token) {
                setError('Authentication token is missing');
                return;
            }

            const customerData = await fetchCustomerDetails(token, logout);
            setCustomerDetails(customerData);
            setEditAddress(customerData.addresses?.[0] || '');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch customer details';
            setError(errorMessage);
            console.error('Error fetching customer details:', err);
        } finally {
            setLoading(false);
        }
    };
    const handleUpdateAddress = async () => {
        if (!editAddress.trim()) {
            setError('Please enter a valid address');
            return;
        }

        if (!token) {
            setError('Authentication token is missing');
            return;
        }

        try {
            setUpdating(true);
            setError('');
            await updateCustomerAddress(
                token,
                logout,
                customerDetails?.name || user?.name || '',
                customerDetails?.phone_number || user?.phone_number || '',
                [editAddress]
            );
            await refreshUserProfile();
            await fetchCustomerDetailsData();
            setIsEditing(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update address';
            setError(errorMessage);
            console.error('Error updating address:', err);
        } finally {
            setUpdating(false);
        }
    };

    const handleConfirmAddress = () => {
        onConfirm();
        onClose();
    };

    useEffect(() => {
        if (!isOpen) {
            setError('');
            setIsEditing(false);
            setEditAddress('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-slideUp">
                <div className="bg-gradient-to-br from-[#F4B400] via-[#F4B400] to-yellow-500 text-[#1E1E1E] p-5 rounded-t-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F4B400]/20 to-yellow-400/20"></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-[#1E1E1E]/20 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{title}</h2>
                                <p className="text-[#1E1E1E]/80 text-xs font-medium mt-1">{subtitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[#1E1E1E]/60 hover:text-[#1E1E1E] hover:bg-[#1E1E1E]/10 p-3 rounded-full transition-all duration-200 hover:rotate-90"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="relative">
                                <div className="w-10 h-10 border-4 border-gray-300 rounded-full animate-spin"></div>
                                <div className="absolute top-0 left-0 w-10 h-10 border-4 border-[#F4B400] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="mt-3 text-gray-600 text-sm">Loading...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {customerDetails && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center">
                                        <div className="bg-[#F4B400]/20 p-1.5 rounded-lg mr-2">
                                            <svg className="w-3 h-3 text-[#F4B400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        Customer Information
                                    </h3>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex">
                                            <span className="text-gray-500 w-12">Name:</span>
                                            <span className="text-gray-800 font-medium">
                                                {customerDetails.name || 'Not provided'}
                                            </span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-500 w-12">Phone:</span>
                                            <span className="text-gray-800 font-medium">
                                                {customerDetails.phone_number || 'Not provided'}
                                            </span>
                                        </div>
                                        <div className="flex">
                                            <span className="text-gray-500 w-12">Address:</span>
                                            <span className="text-gray-800 font-medium">
                                                {customerDetails.addresses?.[0] || 'Not provided'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                                    <div className="flex items-start">
                                        <div className="bg-red-100 p-1 rounded-full mr-2 mt-0.5">
                                            <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-red-800 font-semibold text-sm">Error</h3>
                                            <p className="text-red-700 text-xs">{error}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={fetchCustomerDetailsData}
                                        className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="flex items-center text-xs font-semibold text-gray-700">
                                        <div className="bg-blue-500/20 p-1 rounded mr-1.5">
                                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        Delivery Address
                                    </label>
                                    {!isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center text-[#F4B400] hover:text-[#F4B400]/80 text-xs font-medium"
                                        >
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Edit
                                        </button>
                                    )}
                                </div>
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <textarea
                                                value={editAddress}
                                                onChange={(e) => setEditAddress(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F4B400] focus:border-[#F4B400] transition-all duration-200 text-gray-800 placeholder-gray-400 resize-none text-sm"
                                                placeholder="Enter your complete delivery address..."
                                                rows={3}
                                                disabled={updating}
                                            />
                                            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                                {editAddress.length}/500
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditAddress(customerDetails?.addresses?.[0] || '');
                                                    setError('');
                                                }}
                                                disabled={updating}
                                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateAddress}
                                                disabled={updating || !editAddress.trim()}
                                                className="flex-1 bg-[#F4B400] hover:bg-[#F4B400]/90 text-[#1E1E1E] font-bold py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg disabled:opacity-50 text-sm"
                                            >
                                                {updating ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#1E1E1E] border-t-transparent mr-1"></div>
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Save
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                                        {customerDetails?.addresses?.[0] ? (
                                            <p className="text-gray-800 text-sm leading-relaxed">
                                                {customerDetails.addresses[0]}
                                            </p>
                                        ) : (
                                            <div className="text-center py-4">
                                                <div className="bg-gray-200 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-500 text-xs mb-2">No address provided</p>
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="text-[#F4B400] hover:text-[#F4B400]/80 text-xs font-medium"
                                                >
                                                    Add Address
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {!isEditing && (
                                <div className="flex space-x-2 pt-3">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-3 rounded-lg transition-all duration-200 text-sm"
                                    >
                                        Skip for Now
                                    </button>
                                    <button
                                        onClick={handleConfirmAddress}
                                        disabled={!customerDetails?.addresses?.[0]}
                                        className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg text-sm"
                                    >
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Confirm & Continue
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style jsx>{`
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-slideUp {
                    animation: slideUp 0.4s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { 
                        opacity: 0; 
                        transform: translateY(30px) scale(0.95); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }
            `}</style>
        </div>
    );
}