import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = 'http://192.168.18.107:3000';

interface CustomerDetails {
    name: string;
    phone_number: string;
    addresses: string[];
}

interface CustomerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProfileUpdated: (updatedCustomer: any) => void;
}

export default function CustomerProfileModal({
                                                 isOpen,
                                                 onClose,
                                                 onProfileUpdated
                                             }: CustomerProfileModalProps) {
    const { user, token, refreshUserProfile } = useAuth();

    // State declarations
    const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        addresses: ''
    });

    // Fetch customer details when modal opens
    useEffect(() => {
        if (isOpen && token) {
            fetchCustomerDetails();
        }
    }, [isOpen, token]);

    const fetchCustomerDetails = async () => {
        try {
            setInitialLoading(true);
            setError('');

            const response = await fetch(`${API_BASE_URL}/orders/api/v1/customer/details`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            console.log('Full API Response:', data);

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: Failed to fetch customer details`);
            }

            if (data.success) {
                const customerData = data.data?.data || data.data;
                console.log('Customer Data:', customerData);

                setCustomerDetails(customerData);

                // Set form data with fetched customer details
                setFormData({
                    name: customerData?.name || user?.name || '',
                    phone_number: customerData?.phone_number || user?.phone_number || '',
                    addresses: customerData?.addresses?.[0] || ''
                });
            } else {
                throw new Error(data.message || 'Failed to fetch customer details');
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error fetching customer details:', err);

            // Fallback to user data from auth context
            setFormData({
                name: user?.name || '',
                phone_number: user?.phone_number || '',
                addresses: user?.addresses?.[0] || ''
            });
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Name is required');
            return;
        }

        setUpdating(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/users/api/v1/customer-profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    phone_number: formData.phone_number.trim(),
                    addresses: formData.addresses.trim() ? [formData.addresses.trim()] : []
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: Failed to update profile`);
            }

            if (data.success) {
                await refreshUserProfile();
                await fetchCustomerDetails(); // Refresh customer details
                onProfileUpdated(data.data?.data || data.data);
                onClose();
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error updating profile:', err);
        } finally {
            setUpdating(false);
        }
    };

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setError('');
            setFormData({
                name: '',
                phone_number: '',
                addresses: ''
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-slideUp">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#F4B400] via-[#F4B400] to-yellow-500 text-[#1E1E1E] p-5 rounded-t-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F4B400]/20 to-yellow-400/20"></div>
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-[#1E1E1E]/20 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Complete Your Profile</h2>
                                <p className="text-[#1E1E1E]/80 text-xs font-medium mt-1">
                                    Keep your information up to date
                                </p>
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
                    {initialLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="relative">
                                <div className="w-10 h-10 border-4 border-gray-300 rounded-full animate-spin"></div>
                                <div className="absolute top-0 left-0 w-10 h-10 border-4 border-[#F4B400] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <p className="mt-3 text-gray-600 text-sm">Loading...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Current Info Display (moved to top) */}
                            {customerDetails && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <h3 className="text-base font-bold text-gray-800 mb-2 flex items-center">
                                        <div className="bg-[#F4B400]/20 p-1.5 rounded-lg mr-2">
                                            <svg className="w-3 h-3 text-[#F4B400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        Current Information
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
                                        onClick={fetchCustomerDetails}
                                        className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-3">
                                {/* Full Name */}
                                <div>
                                    <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                                        <div className="bg-[#F4B400]/20 p-1 rounded mr-1.5">
                                            <svg className="w-3 h-3 text-[#F4B400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F4B400] focus:border-[#F4B400] transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                                        placeholder="Enter your full name"
                                        disabled={updating}
                                    />
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                                        <div className="bg-green-500/20 p-1 rounded mr-1.5">
                                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F4B400] focus:border-[#F4B400] transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm"
                                        placeholder="Enter your phone number"
                                        disabled={updating}
                                    />
                                </div>

                                {/* Address */}
                                <div>
                                    <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                                        <div className="bg-blue-500/20 p-1 rounded mr-1.5">
                                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        Delivery Address
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            value={formData.addresses}
                                            onChange={(e) => setFormData({ ...formData, addresses: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F4B400] focus:border-[#F4B400] transition-all duration-200 text-gray-800 placeholder-gray-400 resize-none text-sm"
                                            placeholder="Enter your address..."
                                            rows={2}
                                            disabled={updating}
                                        />
                                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                            {formData.addresses.length}/500
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2 pt-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={updating}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm"
                                    >
                                        Skip
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating || !formData.name.trim()}
                                        className="flex-1 bg-[#F4B400] hover:bg-[#F4B400]/90 text-[#1E1E1E] font-bold py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg disabled:opacity-50 text-sm"
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
                            </form>
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