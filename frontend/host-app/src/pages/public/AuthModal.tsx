import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AddressConfirmationModal from './AddressConfirmationModal';
import {
    createCustomerAndSendOTP,
    verifyOTPAndLogin,
    validateEmail,
    validateOTP,
    getStoreDetails
} from '../../services/CustomerService';
import type { Store } from "../../services/PublicStoreService";
interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    store?: Store | null;
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
    const [otpErrors, setOtpErrors] = useState<string[]>([]);
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
            setOtpErrors([]);
            setTouchedFields(new Set());
            setShowAddressModal(false);
        }
    }, [isOpen]);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);

        // Validate email in real-time if field has been touched
        if (touchedFields.has('email')) {
            setEmailErrors(validateEmail(value));
        }
    };

    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setOtpCode(value);

        // Validate OTP in real-time if field has been touched
        if (touchedFields.has('otp')) {
            setOtpErrors(validateOTP(value));
        }
    };

    const handleEmailFocus = () => {
        setTouchedFields(prev => new Set(prev).add('email'));
    };

    const handleEmailBlur = () => {
        setEmailErrors(validateEmail(email));
    };

    const handleOtpFocus = () => {
        setTouchedFields(prev => new Set(prev).add('otp'));
    };

    const handleOtpBlur = () => {
        setOtpErrors(validateOTP(otpCode));
    };

    const renderFieldErrors = (errors: string[]) => {
        if (errors.length === 0 || (!touchedFields.has('email') && !touchedFields.has('otp'))) return null;

        return (
            <div className="mt-2 space-y-1">
                {errors.map((error, index) => (
                    <p key={index} className="text-red-500 text-xs flex items-center animate-shake">
                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
            // Convert Store to StoreDetails format
            const storeDetails = store ? {
                id: store._id || 'default_store_id',
                store_logo: store.logo || store.store_logo,
                store_name: store.name || store.store_name
            } : undefined;

            await createCustomerAndSendOTP(email, storeDetails);
            setSuccess('OTP sent to your email successfully!');
            setCurrentStep('otp');
        } catch (err: any) {
            setError(err.message);
            console.error('Error sending OTP:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate OTP before verifying
        const validationErrors = validateOTP(otpCode);
        if (validationErrors.length > 0) {
            setOtpErrors(validationErrors);
            setTouchedFields(prev => new Set(prev).add('otp'));
            return;
        }

        setLoading(true);
        setError('');

        try {
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
            // Convert Store to StoreDetails format
            const storeDetails = store ? {
                id: store._id || 'default_store_id',
                store_logo: store.logo || store.store_logo,
                store_name: store.name || store.store_name
            } : undefined;

            await createCustomerAndSendOTP(email, storeDetails);
            setSuccess('OTP sent to your email again!');
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

    // Transform Store into StoreDetails-compatible object
    const storeDetails = getStoreDetails(
        store
            ? {
                id: store._id || 'default_store_id',
                store_logo: store.logo || store.store_logo,
                store_name: store.name || store.store_name,
            }
            : undefined
    );


    return (
        <>
            {/* Auth Modal */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-modalSlide relative">
                        {/* Decorative gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-white to-yellow-50 opacity-50"></div>

                        {/* Header */}
                        <div className="relative bg-gradient-to-r from-[#F4B400] via-[#F4B400] to-yellow-500 px-6 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-white/30 rounded-full blur-sm"></div>
                                        <div className="relative bg-white/20 backdrop-blur-sm p-2.5 rounded-full border border-white/30">
                                            {storeDetails.logo ? (
                                                <img
                                                    src={storeDetails.logo}
                                                    alt={storeDetails.name}
                                                    className="w-5 h-5 object-contain"
                                                />
                                            ) : (
                                                <svg className="w-5 h-5 text-[#1E1E1E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[#1E1E1E]">
                                            {currentStep === 'email' ? 'Welcome Back' : 'Verify Email'}
                                        </h2>
                                        <p className="text-[#1E1E1E]/80 text-xs">
                                            {currentStep === 'email'
                                                ? `Sign in to ${storeDetails.name}`
                                                : 'Check your inbox for the code'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-[#1E1E1E]/70 hover:text-[#1E1E1E] hover:bg-[#1E1E1E]/10 p-2 rounded-full transition-all duration-200 hover:rotate-90"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="relative p-6 space-y-4">
                            {/* Status Messages */}
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg animate-slideIn">
                                    <div className="flex items-center">
                                        <div className="bg-red-100 p-1 rounded-full mr-3">
                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-red-700 text-sm font-medium">{error}</p>
                                    </div>
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r-lg animate-slideIn">
                                    <div className="flex items-center">
                                        <div className="bg-green-100 p-1 rounded-full mr-3">
                                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="text-green-700 text-sm font-medium">{success}</p>
                                    </div>
                                </div>
                            )}

                            {/* Email Step */}
                            {currentStep === 'email' && (
                                <form onSubmit={handleSendOtp} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-semibold text-[#333333]">
                                            <div className="bg-[#F4B400]/20 p-1 rounded-full mr-2">
                                                <svg className="w-3 h-3 text-[#F4B400]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={handleEmailChange}
                                                onFocus={handleEmailFocus}
                                                onBlur={handleEmailBlur}
                                                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-[#F4B400] focus:border-[#F4B400] transition-all duration-200 text-gray-800 placeholder-gray-400 ${
                                                    touchedFields.has('email') && emailErrors.length > 0
                                                        ? 'border-red-400 ring-2 ring-red-200'
                                                        : 'border-gray-200 hover:border-[#F4B400]/50'
                                                }`}
                                                placeholder="Enter your email address"
                                                disabled={loading}
                                            />
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                                </svg>
                                            </div>
                                        </div>
                                        {renderFieldErrors(emailErrors)}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || emailErrors.length > 0}
                                        className="w-full bg-[#F4B400] hover:bg-[#F4B400]/90 text-[#1E1E1E] font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none disabled:hover:shadow-lg"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1E1E1E] border-t-transparent mr-2"></div>
                                                Sending Code...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                                Send Verification Code
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* OTP Step */}
                            {currentStep === 'otp' && (
                                <form onSubmit={handleVerifyOtp} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="flex items-center text-sm font-semibold text-[#333333]">
                                            <div className="bg-green-100 p-1 rounded-full mr-2">
                                                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            Verification Code
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={otpCode}
                                            onChange={handleOtpChange}
                                            onFocus={handleOtpFocus}
                                            onBlur={handleOtpBlur}
                                            className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-xl focus:ring-2 focus:ring-[#F4B400] focus:border-[#F4B400] text-center text-xl font-mono tracking-widest transition-all duration-200 text-gray-800 placeholder-gray-400 ${
                                                touchedFields.has('otp') && otpErrors.length > 0
                                                    ? 'border-red-400 ring-2 ring-red-200'
                                                    : 'border-gray-200 hover:border-[#F4B400]/50'
                                            }`}
                                            placeholder="• • • • • •"
                                            maxLength={10}
                                            disabled={loading}
                                        />
                                        {renderFieldErrors(otpErrors)}
                                        <p className="text-xs text-gray-500 text-center">
                                            Code sent to <span className="font-medium">{email}</span>
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || otpErrors.length > 0}
                                        className="w-full bg-[#F4B400] hover:bg-[#F4B400]/90 text-[#1E1E1E] font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1E1E1E] border-t-transparent mr-2"></div>
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Verify & Continue
                                            </>
                                        )}
                                    </button>

                                    <div className="flex flex-col items-center space-y-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={resendOtp}
                                            disabled={resendLoading}
                                            className="text-[#F4B400] hover:text-[#F4B400]/80 text-sm font-medium disabled:text-[#F4B400]/50 disabled:cursor-not-allowed transition-colors duration-200 min-h-[20px] flex items-center justify-center"
                                        >
                                            {resendLoading ? (
                                                <span className="flex items-center text-[#F4B400]/70">
                                                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#F4B400]/70 border-t-transparent mr-2"></div>
                                                    Resending...
                                                </span>
                                            ) : (
                                                "Didn't receive code? Resend"
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCurrentStep('email')}
                                            className="flex items-center text-[#333333] hover:text-[#1E1E1E] text-sm transition-colors duration-200"
                                        >
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Change email
                                        </button>
                                    </div>
                                </form>
                            )}

                        </div>
                    </div>
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

            <style jsx>{`
                .animate-fadeIn {
                    animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .animate-modalSlide {
                    animation: modalSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }
                
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
                
                @keyframes fadeIn {
                    from { 
                        opacity: 0; 
                    }
                    to { 
                        opacity: 1; 
                    }
                }
                
                @keyframes modalSlide {
                    from { 
                        opacity: 0; 
                        transform: translateY(40px) scale(0.9); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0) scale(1); 
                    }
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-2px); }
                    75% { transform: translateX(2px); }
                }
            `}</style>
        </>
    );
}