
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
const API_BASE_URL = 'http://192.168.18.107:3000';

interface CustomerProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
    customer: any;
    onProfileUpdated: (updatedCustomer: any) => void;
}

export default function CustomerProfileModal({
                                                 isOpen,
                                                 onClose,
                                                 onProfileUpdated
                                             }: Omit<CustomerProfileModalProps, 'token' | 'customer'>) {
    const { user, token, refreshUserProfile } = useAuth();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone_number: user?.phone_number || '',
        addresses: user?.addresses?.[0] || ''
    });

    // Update useEffect to watch for user changes
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone_number: user.phone_number || '',
                addresses: user.addresses?.[0] || ''
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/users/api/v1/customer-profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone_number: formData.phone_number,
                    addresses: formData.addresses
                        ? [formData.addresses]
                        : []
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: Failed to update profile`);
            }

            if (data.success) {
                await refreshUserProfile(); // Refresh the user data in AuthContext
                onProfileUpdated(data.data?.data || data.data);
                onClose();
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error updating profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Complete Your Profile</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 text-2xl transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 text-sm mb-6">
                        Help us serve you better by completing your profile information.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Delivery Address
                            </label>
                            <textarea
                                value={formData.addresses}
                                onChange={(e) => setFormData({ ...formData, addresses: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Enter your full address"
                                rows={4}
                            />
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                Skip for Now
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formData.name.trim()}
                                className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Profile'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}