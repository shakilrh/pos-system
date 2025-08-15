import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AddressConfirmationModal from './AddressConfirmationModal';

const API_BASE_URL = 'http://192.168.18.107:3000';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    store?: {
        id?: string;
        store_logo?: string;
        store_name?: string;
    };
    onLoginSuccess: (customerData: any, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, store, onLoginSuccess }: AuthModalProps) {
    const { login } = useAuth();
    const [currentStep, setCurrentStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [emailErrors, setEmailErrors] = useState<string[]>([]);
    const [touchedFields, setTouchedFields] = useState(new Set<string>());
    const [showAddressModal, setShowAddressModal] = useState(false);

    // Auto-hide success message after 5 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (!isOpen) {
            setCurrentStep('email');
            setError('');
            setSuccess('');
            setEmail('');
            setOtpCode('');
            setEmailErrors([]);
            setTouchedFields(new Set());
            setShowAddressModal(false);
        }
    }, [isOpen]);

    const validateEmail = (email: string): string[] => {
        const errors: string[] = [];
        if (!email.trim()) {
            errors.push('Email is required');
        } else {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) errors.push('Please enter a valid email address');
            if (email.length > 254) errors.push('Email address is too long');
            if (email.includes('..')) errors.push('Email cannot contain consecutive dots');
        }
        return errors;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);

        // Validate email in real-time if field has been touched
        if (touchedFields.has('email')) {
            setEmailErrors(validateEmail(value));
        }
    };

    const handleEmailFocus = () => {
        setTouchedFields(prev => new Set(prev).add('email'));
    };

    const handleEmailBlur = () => {
        setEmailErrors(validateEmail(email));
    };

    const renderFieldErrors = (errors: string[]) => {
        if (errors.length === 0 || !touchedFields.has('email')) return null;

        return (
            <div className="mt-1 space-y-1">
                {errors.map((error, index) => (
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

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate email before sending
        const validationErrors = validateEmail(email);
        if (validationErrors.length > 0) {
            setEmailErrors(validationErrors);
            setTouchedFields(prev => new Set(prev).add('email'));
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const createdBy = store?.id || 'default_admin_id';
            const requestBody = {
                email: email.trim().toLowerCase(),
                created_by: createdBy,
            };

            const response = await fetch(`${API_BASE_URL}/users/api/v1/create-customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: Failed to send OTP`);
            }

            if (data.success) {
                setSuccess('OTP sent to your email successfully!');
                setCurrentStep('otp');
            } else {
                throw new Error(data.message || 'Failed to send OTP');
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error sending OTP:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!otpCode || !otpCode.trim()) {
                throw new Error('OTP code is required');
            }

            const customerData = await login(email.trim().toLowerCase(), otpCode.trim(), true);

            setSuccess('Account verified successfully! You are now logged in.');

            // Close the auth modal first
            onClose();

            // Then show the address confirmation modal after a short delay
            setTimeout(() => {
                setShowAddressModal(true);
            }, 300);

            if (onLoginSuccess) {
                onLoginSuccess(customerData, localStorage.getItem('authToken') || '');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message);
            if (err.message.includes('401')) {
                setError('Unauthorized: Invalid OTP or session expired');
            }
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        setResendLoading(true);
        setError('');
        setSuccess('');
        try {
            const createdBy = store?.id || 'default_admin_id';
            const requestBody = {
                email: email.trim().toLowerCase(),
                created_by: createdBy,
            };

            const response = await fetch(`${API_BASE_URL}/users/api/v1/create-customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: Failed to resend OTP`);
            }

            if (data.success) {
                setSuccess('OTP sent to your email again!');
            } else {
                throw new Error(data.message || 'Failed to resend OTP');
            }
        } catch (err: any) {
            setError(err.message);
            console.error('Error resending OTP:', err);
        } finally {
            setResendLoading(false);
        }
    };

    const handleAddressConfirm = () => {
        setShowAddressModal(false);
    };

    if (!isOpen && !showAddressModal) return null;

    return (
        <>
            {/* Auth Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-slideUp">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-[#F4B400] via-[#F4B400] to-yellow-500 text-[#1E1E1E] p-5 rounded-t-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#F4B400]/20 to-yellow-400/20"></div>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-[#1E1E1E]/20 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                                        {store?.store_logo ? (
                                            <img
                                                src={store.store_logo}
                                                alt={store.store_name}
                                                className="w-6 h-6 object-contain"
                                            />
                                        ) : (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">
                                            {currentStep === 'email' ? 'Sign In Required' : 'Verify Your Email'}
                                        </h2>
                                        <p className="text-[#1E1E1E]/80 text-xs font-medium mt-1">
                                            {currentStep === 'email'
                                                ? 'Enter your email to get started'
                                                : 'Check your email for the code'
                                            }
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

                        <div className="p-5">
                            <div className="space-y-4">
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
                                    </div>
                                )}

                                {success && (
                                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                        <div className="flex items-start">
                                            <div className="bg-green-100 p-1 rounded-full mr-2 mt-0.5">
                                                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-green-800 font-semibold text-sm">Success</h3>
                                                <p className="text-green-700 text-xs">{success}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 'email' && (
                                    <form onSubmit={handleSendOtp} className="space-y-3">
                                        <div>
                                            <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                                                <div className="bg-blue-500/20 p-1 rounded mr-1.5">
                                                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={handleEmailChange}
                                                onFocus={handleEmailFocus}
                                                onBlur={handleEmailBlur}
                                                className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:ring-1 focus:ring-[#F4B400] focus:border-[#F4B400] transition-all duration-200 text-gray-800 placeholder-gray-400 text-sm ${
                                                    touchedFields.has('email') && emailErrors.length > 0
                                                        ? 'border-red-400 ring-2 ring-red-200'
                                                        : 'border-gray-300'
                                                }`}
                                                placeholder="john@example.com"
                                                disabled={loading}
                                            />
                                            {renderFieldErrors(emailErrors)}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading || emailErrors.length > 0}
                                            className="w-full bg-[#F4B400] hover:bg-[#F4B400]/90 text-[#1E1E1E] font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1E1E1E] border-t-transparent mr-2"></div>
                                                    Sending OTP...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    Send Verification Code
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}

                                {currentStep === 'otp' && (
                                    <form onSubmit={handleVerifyOtp} className="space-y-3">
                                        <div>
                                            <label className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                                                <div className="bg-green-500/20 p-1 rounded mr-1.5">
                                                    <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                Verification Code *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#F4B400] focus:border-[#F4B400] text-center text-lg font-mono tracking-wider transition-all duration-200 text-gray-800 placeholder-gray-400"
                                                placeholder="Enter 6-digit code"
                                                maxLength={10}
                                                disabled={loading}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-[#F4B400] hover:bg-[#F4B400]/90 text-[#1E1E1E] font-bold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1E1E1E] border-t-transparent mr-2"></div>
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Verify & Sign In
                                                </>
                                            )}
                                        </button>

                                        <div className="flex flex-col items-center space-y-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={resendOtp}
                                                disabled={resendLoading}
                                                className="text-[#F4B400] hover:text-[#F4B400]/80 text-sm font-medium disabled:text-gray-400 transition-colors duration-200 min-h-[20px]"
                                            >
                                                {resendLoading ? "Resending..." : "Didn't receive the code? Resend"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentStep('email')}
                                                className="flex items-center justify-center text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200 min-h-[20px]"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                Change email address
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
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
            )}

            {/* Address Confirmation Modal */}
            <AddressConfirmationModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onConfirm={handleAddressConfirm}
                title="Welcome! Let's Confirm Your Address"
                subtitle="We need to know where to deliver your delicious order"
            />
        </>
    );
}