import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStore,
    faInfoCircle,
    faImage,
    faCheck,
    faTimes,
    faSpinner,
    faExclamationTriangle,
    faUpload,
    faHeart,
    faToggleOn,
    faToggleOff,
} from '@fortawesome/free-solid-svg-icons';

interface SiteSettingsProps {
    restaurantSlug?: string;
}

export default function SiteSettings({ restaurantSlug }: SiteSettingsProps) {
    const { isAuthenticated, isLoading, token, logout, user } = useAuth();
    const [aboutUs, setAboutUs] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isTogglingLoyalty, setIsTogglingLoyalty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const API_BASE_URL = 'http://192.168.18.37:3000';
    const PUBLIC_STORE_ENDPOINT = '/users/api/v1/public/store';
    // Fixed endpoint - this is the correct one from your message
    const STORE_UPDATE_ENDPOINT = '/users/api/v1/store-details';
    const LOYALTY_TOGGLE_ENDPOINT = '/orders/api/v1/loyalty/toggle';

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            window.location.href = '/pos-system/login';
            return;
        }
        if (isAuthenticated && user?.user_type === 'isadmin' && restaurantSlug) {
            loadStoreDetails(); // Only call this, it will load loyalty status too
            // loadLoyaltyStatus(); // Remove this line
        }
    }, [isAuthenticated, isLoading, user, restaurantSlug]);
    const loadStoreDetails = async () => {
        if (!restaurantSlug) {
            console.error('Missing restaurantSlug');
            return;
        }

        try {
            const url = `${API_BASE_URL}${PUBLIC_STORE_ENDPOINT}/${restaurantSlug}`;
            console.log('Fetching store details from:', url);

            // 🔸 Remove token for public endpoint
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    window.location.href = '/pos-system/login';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('API response:', data);

            if (data.success) {
                // 🔸 Handle multiple possible shapes of store data
                const storeData =
                    data.data?.store ||
                    data.data?.store_details ||
                    data.data?.data?.store ||
                    data.data?.data?.store_details ||
                    data.store ||
                    data.store_details;

                if (storeData) {
                    setAboutUs(storeData.aboutUs || '');
                    setImages(storeData.images || []);
                    setLoyaltyEnabled(storeData.loyaltyprogram === 'enable');
                } else {
                    console.warn('Store data not found in expected structure:', data);
                    setError('Store data not found');
                }
            } else {
                throw new Error(data.message || 'Failed to fetch store details');
            }
        } catch (error) {
            console.error('Error loading store details:', error);
            setError(error instanceof Error ? error.message : 'Failed to load store details');
        }
    };

    const loadLoyaltyStatus = async () => {
        if (!token) return;

        try {
            // Since the status endpoint doesn't exist, we'll skip loading the initial status
            // You can either create a GET endpoint or set a default value
            // For now, defaulting to false (disabled)
            console.log('Loyalty status endpoint not available, defaulting to disabled');
        } catch (error) {
            console.error('Error loading loyalty status:', error);
            // Don't show error for this, as the endpoint might not exist yet
        }
    };

    const toggleLoyaltyProgram = async () => {
        if (!token || user?.user_type !== 'isadmin') return;

        setIsTogglingLoyalty(true);
        setError(null);

        try {
            const newStatus = loyaltyEnabled ? 'disable' : 'enable';

            const response = await fetch(`${API_BASE_URL}${LOYALTY_TOGGLE_ENDPOINT}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    window.location.href = '/pos-system/login';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setLoyaltyEnabled(!loyaltyEnabled);
                setSuccess(`Loyalty program ${newStatus}d successfully`);
                setTimeout(() => setSuccess(null), 3000);
            } else {
                throw new Error(data.message || 'Failed to toggle loyalty program');
            }
        } catch (error) {
            console.error('Error toggling loyalty program:', error);
            setError(error instanceof Error ? error.message : 'Failed to toggle loyalty program');
        } finally {
            setIsTogglingLoyalty(false);
        }
    };

    // Updated to handle both image upload and text update in one function
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Create FormData with the image and existing data
        const formData = new FormData();
        formData.append('imagesToAdd', file); // Key as shown in your Postman screenshot
        formData.append('aboutUs', aboutUs);

        // Add existing images to prevent them from being removed
        images.forEach((imageUrl) => {
            formData.append('imagesToRemove', ''); // Empty if not removing any
        });

        setIsUpdating(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}${STORE_UPDATE_ENDPOINT}`, {
                method: 'PUT', // or POST based on your backend
                headers: {
                    Authorization: `Bearer ${token}`,
                    // Don't set Content-Type for FormData - let browser set it with boundary
                },
                body: formData,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    window.location.href = '/pos-system/login';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                // Update images from response - handle new structure
                const updatedStore = data.data?.data?.store_details || data.data?.data?.store;
                if (updatedStore?.images) {
                    setImages(updatedStore.images);
                } else {
                    // Fallback: reload store details to get updated images
                    await loadStoreDetails();
                }
                setSuccess('Image uploaded successfully');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                throw new Error(data.message || 'Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            setError(error instanceof Error ? error.message : 'Failed to upload image');
        } finally {
            setIsUpdating(false);
            event.target.value = ''; // Reset file input
        }
    };

    const handleImageRemove = async (imageUrl: string) => {
        const formData = new FormData();
        formData.append('imagesToRemove', imageUrl); // The URL to remove
        formData.append('aboutUs', aboutUs);

        setIsUpdating(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}${STORE_UPDATE_ENDPOINT}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    window.location.href = '/pos-system/login';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                // Update local state
                setImages(images.filter(img => img !== imageUrl));
                setSuccess('Image removed successfully');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                throw new Error(data.message || 'Failed to remove image');
            }
        } catch (error) {
            console.error('Error removing image:', error);
            setError(error instanceof Error ? error.message : 'Failed to remove image');
        } finally {
            setIsUpdating(false);
        }
    };

    const saveStoreDetails = async () => {
        if (!token || user?.user_type !== 'isadmin') return;

        setIsUpdating(true);
        setError(null);
        setSuccess(null);

        try {
            // For text-only updates, you might still use FormData or JSON
            const formData = new FormData();
            formData.append('aboutUs', aboutUs);

            const response = await fetch(`${API_BASE_URL}${STORE_UPDATE_ENDPOINT}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    logout();
                    window.location.href = '/pos-system/login';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setSuccess('Store details updated successfully');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                throw new Error(data.message || 'Failed to update store details');
            }
        } catch (error) {
            console.error('Error saving store details:', error);
            setError(error instanceof Error ? error.message : 'Failed to update store details');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <FontAwesomeIcon icon={faSpinner} spin className="text-[var(--primary-color)] h-12 w-12" />
            </div>
        );
    }

    if (!isAuthenticated || user?.user_type !== 'isadmin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-[var(--error-color)]">Access denied. Admins only.</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background-color)] transition-colors duration-300">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--text-color)] mb-2 flex items-center">
                        <FontAwesomeIcon icon={faStore} className="mr-3 text-[var(--primary-color)]" />
                        Site Settings
                    </h1>
                    <p className="text-[var(--text-secondary)]">Manage store details, carousel images, and loyalty program</p>
                    {error && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-600 dark:text-red-400 text-sm">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                                <strong>Error:</strong> {error}
                            </p>
                        </div>
                    )}
                    {success && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-green-600 dark:text-green-400 text-sm">
                                <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                {success}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Loyalty Program Toggle Section */}
                    <div className="bg-[var(--background-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-color)] flex items-center">
                                    <FontAwesomeIcon icon={faHeart} className="mr-2 text-[var(--primary-color)]" />
                                    Loyalty Program
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {loyaltyEnabled ? 'Loyalty program is currently active' : 'Loyalty program is currently inactive'}
                                </p>
                            </div>
                            <button
                                onClick={toggleLoyaltyProgram}
                                disabled={isTogglingLoyalty}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                                    loyaltyEnabled
                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                } ${isTogglingLoyalty ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {isTogglingLoyalty ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={loyaltyEnabled ? faToggleOn : faToggleOff} />
                                        <span>{loyaltyEnabled ? 'Enabled' : 'Disabled'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* About Us Section */}
                    <div className="bg-[var(--background-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-color)] flex items-center">
                                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-[var(--primary-color)]" />
                                    About Us
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)]">Describe your store</p>
                            </div>
                        </div>
                        <textarea
                            value={aboutUs}
                            onChange={(e) => setAboutUs(e.target.value)}
                            className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/60"
                            rows={5}
                            placeholder="Enter About Us description..."
                        />
                    </div>

                    {/* Carousel Images Section */}
                    <div className="bg-[var(--background-secondary)] rounded-xl shadow-sm border border-[var(--border-color)] p-6 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--text-color)] flex items-center">
                                    <FontAwesomeIcon icon={faImage} className="mr-2 text-[var(--primary-color)]" />
                                    Carousel Images
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)]">Upload or remove images for the website carousel</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex space-x-3">
                                <label className="flex-1 p-3 rounded-lg border border-[var(--border-color)] bg-[var(--surface-color)] text-[var(--text-color)] cursor-pointer flex items-center justify-center">
                                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                                    Upload Image
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        disabled={isUpdating}
                                    />
                                </label>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {images.map((image, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={image}
                                            alt={`Carousel ${index + 1}`}
                                            className="w-24 h-24 object-cover rounded-lg border border-[var(--border-color)]"
                                        />
                                        <button
                                            onClick={() => handleImageRemove(image)}
                                            disabled={isUpdating}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {images.length === 0 && (
                                <div className="text-center py-8 text-[var(--text-secondary)]">
                                    <FontAwesomeIcon icon={faImage} className="text-4xl mb-2 opacity-50" />
                                    <p>No carousel images uploaded yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={saveStoreDetails}
                            disabled={isUpdating}
                            className={`px-6 py-3 rounded-lg bg-[var(--primary-color)] text-white hover:bg-[var(--primary-color)]/90 transition-colors duration-200 flex items-center ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isUpdating ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faCheck} className="mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}