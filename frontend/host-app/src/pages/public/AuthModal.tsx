import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setCurrentStep('email');
            setError('');
            setSuccess('');
            setEmail('');
            setOtpCode('');
        }
    }, [isOpen]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!email || !email.trim()) {
                throw new Error('Email is required');
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Please enter a valid email address');
            }

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

            // Use AuthContext's login function
            const customerData = await login(email.trim().toLowerCase(), otpCode.trim(), true);

            setSuccess('Account verified successfully! You are now logged in.');

            if (onLoginSuccess) {
                onLoginSuccess(customerData, localStorage.getItem('authToken') || '');
            }

            setTimeout(() => {
                onClose();
            }, 1500);
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
        setLoading(true);
        setError('');
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
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        {store?.store_logo && (
                            <img
                                src={store.store_logo}
                                alt={store.store_name}
                                className="w-10 h-10 object-contain"
                            />
                        )}
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">
                                {store?.store_name || 'Cheezious'}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-500 text-2xl transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">

                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Please Sign-In to Place an Order</h3>
                    <p className="text-gray-600 text-sm mb-6">
                        {currentStep === 'email' ? 'Please enter your email address' : `Enter the OTP sent to ${email}`}
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                            <i className="fas fa-check-circle mr-2"></i>
                            {success}
                        </div>
                    )}

                    {currentStep === 'email' && (
                        <div className="space-y-4">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Enter your email"
                                onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSendOtp(e)}
                            />
                            <button
                                onClick={handleSendOtp}
                                disabled={loading}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
                                        SENDING OTP...
                                    </>
                                ) : (
                                    'SEND OTP'
                                )}
                            </button>
                        </div>
                    )}

                    {currentStep === 'otp' && (
                        <div className="mt-6">
                            <input
                                type="text"
                                required
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-center text-lg font-mono tracking-wider"
                                placeholder="Enter OTP Code"
                                maxLength={10}
                                onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleVerifyOtp(e)}
                            />
                            <button
                                onClick={handleVerifyOtp}
                                disabled={loading}
                                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg mt-4 transition-colors flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2"></div>
                                        VERIFYING...
                                    </>
                                ) : (
                                    'VERIFY & LOGIN'
                                )}
                            </button>
                            <div className="text-center mt-4">
                                <button
                                    onClick={resendOtp}
                                    disabled={loading}
                                    className="text-yellow-600 hover:text-yellow-700 text-sm font-medium disabled:text-gray-400"
                                >
                                    Didn't receive code? Resend
                                </button>
                            </div>
                            <div className="text-center mt-2">
                                <button
                                    onClick={() => setCurrentStep('email')}
                                    className="text-gray-500 hover:text-gray-700 text-sm"
                                >
                                    ← Change email
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}