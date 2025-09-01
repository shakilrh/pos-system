import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import FlashMessage from '../FlashMessage';
import {
    fetchCustomerDetails,
    updateCustomerProfile,
    validateName,
    validatePhoneNumber,
    validateAddress
} from '../../services/CustomerService';

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
    const { user, token, refreshUserProfile, logout } = useAuth();

    // State declarations
    const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [updating, setUpdating] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        addresses: ''
    });
    const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
    const [touchedFields, setTouchedFields] = useState(new Set<string>());

    const getFieldErrors = (fieldName: string): string[] => {
        switch (fieldName) {
            case 'name':
                return validateName(formData.name);
            case 'phone_number':
                return validatePhoneNumber(formData.phone_number);
            case 'addresses':
                return validateAddress(formData.addresses);
            default:
                return [];
        }
    };

    const isFormValid = (): boolean => {
        const requiredFields = ['name'];
        const requiredFieldsValid = requiredFields.every(field => getFieldErrors(field).length === 0);
        const optionalFieldsValid = ['phone_number', 'addresses'].every(field => getFieldErrors(field).length === 0);
        return requiredFieldsValid && optionalFieldsValid;
    };

    // Update errors on formData change
    useEffect(() => {
        const allFields = ['name', 'phone_number', 'addresses'];
        const newErrors: { [key: string]: string[] } = {};
        allFields.forEach(field => {
            newErrors[field] = getFieldErrors(field);
        });
        setErrors(newErrors);
    }, [formData]);

    // Fetch customer details when modal opens
    useEffect(() => {
        if (isOpen && token) {
            loadCustomerDetails();
        }
    }, [isOpen, token]);

    const loadCustomerDetails = async () => {
        try {
            setInitialLoading(true);
            setFlashMessage(null);

            const customerData = await fetchCustomerDetails(token!, logout);
            setCustomerDetails(customerData);

            setFormData({
                name: customerData?.name || user?.name || '',
                phone_number: customerData?.phone_number || user?.phone_number || '',
                addresses: customerData?.addresses?.[0] || ''
            });
        } catch (err: any) {
            setFlashMessage({ message: err.message, type: 'error' });
            console.error('Error fetching customer details:', err);

            // Fallback to user data
            setFormData({
                name: user?.name || '',
                phone_number: user?.phone_number || '',
                addresses: user?.addresses?.[0] || ''
            });
        } finally {
            setInitialLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setTouchedFields(prev => new Set(prev).add(name));
    };

    const handleFocus = (fieldName: string) => {
        setTouchedFields(prev => new Set(prev).add(fieldName));
    };

    const handleBlur = (fieldName: string) => {
        setTouchedFields(prev => new Set(prev).add(fieldName));
    };

    const renderFieldErrors = (fieldName: string) => {
        const fieldErrors = errors[fieldName] || [];
        if (fieldErrors.length === 0 || !touchedFields.has(fieldName)) return null;

        return (
            <div className="mt-1 space-y-1">
                {fieldErrors.map((error, index) => (
                    <p key={index} className="text-red-500 text-xs flex items-start">
                        <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                ))}
            </div>
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const allFields = ['name', 'phone_number', 'addresses'];
        setTouchedFields(new Set(allFields));
        const allErrors: { [key: string]: string[] } = {};

        allFields.forEach(field => {
            allErrors[field] = getFieldErrors(field);
        });
        setErrors(allErrors);

        const hasErrors = Object.values(allErrors).some(fieldErrors => fieldErrors.length > 0);
        if (hasErrors) {
            setFlashMessage({ message: 'Please fix all errors before submitting', type: 'error' });
            return;
        }

        setUpdating(true);
        setFlashMessage(null);

        try {
            const profileData = {
                name: formData.name.trim(),
                phone_number: formData.phone_number.trim(),
                addresses: formData.addresses.trim() ? [formData.addresses.trim()] : []
            };

            const updatedProfile = await updateCustomerProfile(token!, profileData, logout);

            await refreshUserProfile();
            await loadCustomerDetails();
            onProfileUpdated(updatedProfile);
            setFlashMessage({ message: 'Profile updated successfully!', type: 'success' });
        } catch (err: any) {
            setFlashMessage({ message: err.message, type: 'error' });
            console.error('Error updating profile:', err);
        } finally {
            setUpdating(false);
        }
    };

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFlashMessage(null);
            setErrors({});
            setTouchedFields(new Set());
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
                        <div className="flex items-center justify-center py-8">
                            <svg className="animate-spin h-5 w-5 text-[#F4B400]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="ml-2 text-gray-600 text-sm">Loading...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {flashMessage && (
                                <FlashMessage
                                    message={flashMessage.message}
                                    type={flashMessage.type}
                                    onClose={() => setFlashMessage(null)}
                                    className="mb-6"
                                />
                            )}

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

                            <form onSubmit={handleSubmit} className="space-y-3">
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
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        onFocus={() => handleFocus('name')}
                                        onBlur={() => handleBlur('name')}
                                        className={`w-full px-3 py-2 bg-gray-50 border-2 ${errors.name && errors.name.length > 0 && touchedFields.has('name') ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-300'} rounded-lg focus:ring-1 focus:ring-[#F4B400] focus:border-[#F4B400] transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm`}
                                        placeholder="Enter your full name"
                                        disabled={updating}
                                    />
                                    {renderFieldErrors('name')}
                                </div>

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
                                        name="phone_number"
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        onFocus={() => handleFocus('phone_number')}
                                        onBlur={() => handleBlur('phone_number')}
                                        className={`w-full px-3 py-2 bg-gray-50 border-2 ${errors.phone_number && errors.phone_number.length > 0 && touchedFields.has('phone_number') ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-300'} rounded-lg focus:ring-1 focus:ring-[#F4B400] focus:border-[#F4B400] transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm`}
                                        placeholder="Enter your phone number"
                                        disabled={updating}
                                    />
                                    {renderFieldErrors('phone_number')}
                                </div>

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
                                            name="addresses"
                                            value={formData.addresses}
                                            onChange={handleInputChange}
                                            onFocus={() => handleFocus('addresses')}
                                            onBlur={() => handleBlur('addresses')}
                                            className={`w-full px-3 py-2 bg-gray-50 border-2 ${errors.addresses && errors.addresses.length > 0 && touchedFields.has('addresses') ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-300'} rounded-lg focus:ring-1 focus:ring-[#F4B400] focus:border-[#F4B400] transition-all duration-200 text-gray-800 placeholder-gray-400 resize-none text-sm`}
                                            placeholder="Enter your address..."
                                            rows={2}
                                            disabled={updating}
                                        />
                                        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                            {formData.addresses.length}/500
                                        </div>
                                        {renderFieldErrors('addresses')}
                                    </div>
                                </div>

                                <div className="flex space-x-2 pt-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        disabled={updating}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating || !isFormValid()}
                                        className={`flex-1 bg-[#F4B400] hover:bg-[#F4B400]/90 text-[#1E1E1E] font-bold py-2.5 px-3 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg disabled:opacity-50 text-sm ${!isFormValid() ? 'cursor-not-allowed' : ''}`}
                                    >
                                        {updating ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#1E1E1E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Saving...
                                            </span>
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
        </div>
    );
}