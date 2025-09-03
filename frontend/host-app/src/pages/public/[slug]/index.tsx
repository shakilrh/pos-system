import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import AuthModal from '../AuthModal';
import CustomerProfileModal from '../CustomerProfileModal';
import AddressConfirmationModal from '../AddressConfirmationModal';
import CartModal from '../CartModal';
import OrderSuccessModal from '../OrderSuccessModal';
import { useAuth } from '../../../context/AuthContext';
import type { OrderData } from "../../../services/PublicStoreService";
import type { Product } from "../../../services/PublicStoreService";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";

interface Store {
    _id?: string;
    name?: string;
    store_name?: string;
    logo?: string;
    store_logo?: string;
    images?: string[];
    aboutUs?: string;
    currency?: string;
    address?: string;
    [key: string]: any; // Allow additional properties
}

import {
    fetchStoreData,
    addToCart,
    getCartItemCount,
    clearCart,
    getCurrencySymbol,
    validateSlug,
    createOrder,
    fetchOrderHistory
} from '../../../services/PublicStoreService';

interface Category {
    _id: string;
    name: string;
}

interface Store {
    _id?: string;
    name?: string;
    store_name?: string;
    logo?: string;
    store_logo?: string;
    images?: string[];
    aboutUs?: string;
    currency?: string;
    address?: string;

}

export default function PublicHome() {
    const router = useRouter();
    const { slug } = router.query;
    const [loading, setLoading] = useState(true);
    // Update the state declarations with explicit types:
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [store, setStore] = useState<Store | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAddressConfirmationModalOpen, setIsAddressConfirmationModalOpen] = useState(false);
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderData, setOrderData] = useState<OrderData | null>(null);


    const {
        isAuthenticated,
        user,
        login,
        logout,
        refreshUserProfile
    } = useAuth();

    useEffect(() => {
        const slugString = Array.isArray(slug) ? slug[0] : slug;
        if (slugString && validateSlug(slugString)) {
            fetchData();
            loadCartCount();
        }

        if (isAuthenticated && user?.user_type === 'customer') {
            refreshUserProfile();
        }
    }, [slug, isAuthenticated]);

    useEffect(() => {
        const storeData = store as Store | null;
        if (storeData?.images && storeData.images.length > 1) {
            const interval = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % (storeData.images?.length || 0));
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [store?.images]);

    useEffect(() => {
        const handleCartUpdate = (event: CustomEvent) => {
            const cart = event.detail || [];
            const totalItems = cart.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
            setCartCount(totalItems);
        };

        window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
        return () => window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
    }, []);

    const loadCartCount = () => {
        try {
            const slugString = Array.isArray(slug) ? slug[0] : slug;
            if (slugString && validateSlug(slugString)) {
                const count = getCartItemCount(slugString);
                setCartCount(count);
            }
        } catch (error) {
            console.error('Error loading cart count:', error);
            setError('Failed to load cart');
        }
    };

    useEffect(() => {
        if (isCartModalOpen) {
            document.body.style.overflow = 'hidden';
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.filter = 'blur(2px)';
                mainContent.style.transition = 'filter 0.3s ease-in-out';
            }
        } else {
            document.body.style.overflow = '';
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.filter = '';
            }
        }

        return () => {
            document.body.style.overflow = '';
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.filter = '';
            }
        };
    }, [isCartModalOpen]);

    const fetchData = async () => {
        try {
            const slugString = Array.isArray(slug) ? slug[0] : slug;
            if (!slugString || !validateSlug(slugString)) {
                setError('Invalid store identifier');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            const { products, categories, store } = await fetchStoreData(slugString);

            setProducts(products);
            setCategories(categories);
            setStore(store);

            if (!store) {
                setError('Store not found');
            }
        } catch (error: any) {
            console.error('Error fetching data:', error);
            setError(error.message || 'Failed to load store data')
        } finally {
            setLoading(false);
        }
    };

    const handleOrderHistoryClick = () => {
        router.push(`/public/${slug}/orderSummary`);
    };

    const handleLoginSuccess = () => {
        setIsAuthModalOpen(false);
        setTimeout(() => {
            setIsAddressConfirmationModalOpen(true);
        }, 500);
    };

    const handleAddressConfirmed = () => {
        if (!user?.name || !user.name.trim()) {
            setTimeout(() => {
                setIsProfileModalOpen(true);
            }, 500);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const categorySections = document.querySelectorAll('section[id^="category-"]');
            let currentCategory = null;
            categorySections.forEach(section => {
                const rect = section.getBoundingClientRect();
                if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
                    currentCategory = section.id.replace('category-', '');
                }
            });
            if (currentCategory && currentCategory !== selectedCategory) {
                setSelectedCategory(currentCategory);
            }

            // Sticky behavior for category bar
            const categoryBar = document.getElementById('category-scroll');
            const header = document.querySelector('header');
            if (categoryBar && header) {
                const headerHeight = header.offsetHeight;
                if (window.scrollY >= headerHeight) {
                    categoryBar.classList.add('sticky', 'top-0');
                    categoryBar.classList.remove('relative');
                } else {
                    categoryBar.classList.remove('sticky', 'top-0');
                    categoryBar.classList.add('relative');
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [selectedCategory]);

    const scrollCategories = (direction: "left" | "right") => {
        const container = document.getElementById("category-scroll");
        if (container) {
            const scrollAmount = 300;
            container.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            });
        }
    };

    const handleProfileUpdated = () => {
        refreshUserProfile();
    };

    const handleLogout = () => {
        logout();
        const slugString = Array.isArray(slug) ? slug[0] : slug;
        if (slugString && validateSlug(slugString)) {
            clearCart(slugString);
            setCartCount(0);
        }
    };

    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
    };

    interface CartItem extends Product {
        quantity: number;
    }

    const handleAddToCart = async (product: Product) => {
        if (!isAuthenticated || user?.user_type !== "customer") {
            setIsAuthModalOpen(true);
            return;
        }

        const slugString = Array.isArray(slug) ? slug[0] : slug;
        if (!slugString || !validateSlug(slugString)) {
            setError("Invalid store");
            return;
        }

        try {
            const updatedCart: CartItem[] = addToCart(slugString, product);
            const totalItems = updatedCart.reduce(
                (sum, item) => sum + item.quantity,
                0
            );
            setCartCount(totalItems);

            // Visual feedback
            const button = document.querySelector(
                `[data-product-id="${product._id}"]`
            );
            if (button) {
                const originalContent = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check mr-2"></i>Added!';
                button.classList.add("bg-green-500", "hover:bg-green-600");
                setTimeout(() => {
                    button.innerHTML = originalContent;
                    button.classList.remove("bg-green-500", "hover:bg-green-600");
                }, 2000);
            }
        } catch (err) {
            console.error("Error adding to cart:", err);
            setError(
                err instanceof Error ? err.message : "Failed to add item to cart"
            );
        }
    };

    const handleCartClick = () => {
        if (!isAuthenticated || user?.user_type !== 'customer') {
            setIsAuthModalOpen(true);
            return;
        }
        setIsCartModalOpen(true);
    };

    const handleOrderSuccess = (orderData: OrderData) => {
        setIsCartModalOpen(false);
        setOrderData(orderData); // ✅ no type error now
        setShowSuccessModal(true);
        setCartCount(0);
    };

    const sortedProducts = [...products].sort((a, b) => {
        if (selectedCategory && a.category_id?._id === selectedCategory && b.category_id?._id !== selectedCategory) {
            return -1;
        }
        if (selectedCategory && b.category_id?._id === selectedCategory && a.category_id?._id !== selectedCategory) {
            return 1;
        }
        return 0;
    });

    const nextSlide = () => {
        if (store?.images && store.images.length > 0) {
            setCurrentSlide((prev) => (prev + 1) % (store.images?.length ?? 1));
        }
    };


    const prevSlide = () => {
        if (store?.images && store.images.length > 0) {
            const length = store.images?.length ?? 1;
            setCurrentSlide((prev) => (prev - 1 + length) % length);
        }
    };


    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    const getDisplayName = () => {
        if (!isAuthenticated) return 'User';
        if (user?.name && user.name.trim()) {
            return user.name.split(' ')[0];
        }
        return user?.email ? user.email.split('@')[0] : 'User';
    };

    const groupedProducts = categories.map(cat => ({
        category: cat,
        products: products.filter(p => p.category_id?._id === cat._id)
    }));

    const getFullDisplayName = () => {
        if (!isAuthenticated) return 'User';
        if (user?.name && user.name.trim()) {
            return user.name;
        }
        return user?.email || 'User';
    };

    // Error state
    if (error && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <h1 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Store</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            fetchData();
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
                    <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
                </div>
            </div>
        );
    }

    const slugString = Array.isArray(slug) ? slug[0] : slug;

    if (!slugString || !validateSlug(slugString)) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Invalid store</h1>
                    <p className="text-gray-600">The store you are looking for does not exist.</p>
                </div>
            </div>
        );
    }

    // Product Card component
    const ProductCard = ({ product }: { product: Product }) => (
        <div className="group bg-[#FAFAFA] rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#CCCCCC] overflow-hidden transform hover:scale-105">
            <div className="relative h-48 overflow-hidden">
                {product.pictureUrl ? (
                    <img
                        src={product.pictureUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                        No Image
                    </div>
                )}
            </div>
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{product.description || "No description available"}</p>
                <p className="mt-2 text-base font-bold text-gray-900">{product.price} PKR</p>
            </div>
        </div>
    );

    return (
        <>
            <div id="main-content" className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-lg sticky top-0 z-40">
                    <div className="container mx-auto px-4 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    className="text-red-500 text-2xl focus:outline-none"
                                    onClick={() => setIsSidebarOpen(true)}
                                >
                                    <i className="fas fa-bars"></i>
                                </button>
                                {store?.logo && (
                                    <div className="h-14 w-auto flex-shrink-0">
                                        <img
                                            src={store.logo}
                                            alt={store.name || store.store_name}
                                            className="h-full w-auto object-contain"
                                        />
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-3xl font-bold text-[#4c2c19]">
                                        {store?.name || store?.store_name || slug}
                                    </h1>
                                    <p className="text-yellow-500 font-medium">Quality Food, Fast Delivery</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <button
                                        onClick={handleCartClick}
                                        className="bg-[#FFD700] hover:bg-yellow-400 text-black font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition-all duration-200 hover:scale-105"
                                    >
                                        <i className="fas fa-shopping-cart"></i>
                                        <span>CART</span>
                                    </button>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center animate-pulse">
                                            {cartCount}
                                        </span>
                                    )}
                                </div>
                                {isAuthenticated ? (
                                    <div className="relative group">
                                        <button className="bg-[#FFD700] hover:bg-yellow-400 text-black font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2">
                                            <i className="fas fa-user"></i>
                                            <span className="hidden sm:inline">{getDisplayName()}</span>
                                            <i className="fas fa-chevron-down text-xs"></i>
                                        </button>
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                            <div className="p-3 border-b border-gray-100">
                                                <span className="text-gray-800 font-medium">{getFullDisplayName()}</span>
                                                <p className="text-gray-500 text-xs">{user?.email}</p>
                                            </div>
                                            <button
                                                onClick={handleProfileClick}
                                                className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                                            >
                                                <i className="fas fa-user mr-2"></i>
                                                Profile
                                            </button>
                                            <button
                                                onClick={handleOrderHistoryClick}
                                                className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                                            >
                                                <i className="fas fa-receipt mr-2"></i>
                                                Order History
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
                                            >
                                                <i className="fas fa-sign-out-alt mr-2"></i>
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAuthModalOpen(true)}
                                        className="bg-[#FFD700] hover:bg-yellow-400 text-black font-semibold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2"
                                    >
                                        <i className="fas fa-user"></i>
                                        <span>Login</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Error notification */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-4 mt-4">
                        <div className="flex items-center justify-between">
                            <span className="block sm:inline">{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-2 text-red-700 hover:text-red-900"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                )}

                {isSidebarOpen && (
                    <>
                        <div
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        ></div>
                        <div className="fixed top-0 left-0 w-72 h-full bg-white shadow-lg z-50 flex flex-col">
                            <div className="flex items-center justify-between p-4 border-b">
                                {store?.store_logo && (
                                    <img
                                        src={store.store_logo}
                                        alt="Logo"
                                        className="h-10 w-auto"
                                    />
                                )}
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="text-gray-600 hover:text-gray-800 text-2xl"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            <div className="p-4 flex-1 flex flex-col space-y-4">
                                {isAuthenticated ? (
                                    <>
                                        <div className="text-gray-700 font-semibold">
                                            {getFullDisplayName()}
                                        </div>
                                        <div className="text-sm text-gray-500">{user?.phone_number}</div>
                                        <button
                                            onClick={handleLogout}
                                            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold"
                                        >
                                            Logout
                                        </button>
                                        <hr />
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsAuthModalOpen(true);
                                            setIsSidebarOpen(false);
                                        }}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-lg"
                                    >
                                        Login
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="flex items-center space-x-3 text-gray-700 hover:text-yellow-500"
                                >
                                    <i className="fas fa-utensils"></i>
                                    <span>Explore Menu</span>
                                </button>
                                <button
                                    onClick={() => {
                                        handleOrderHistoryClick();
                                        setIsSidebarOpen(false);
                                    }}
                                    className="flex items-center space-x-3 text-gray-700 hover:text-yellow-500"
                                >
                                    <i className="fas fa-receipt"></i>
                                    <span>Order History</span>
                                </button>
                                <button className="flex items-center space-x-3 text-gray-700 hover:text-yellow-500">
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>Branch Locator</span>
                                </button>
                                <button className="flex items-center space-x-3 text-gray-700 hover:text-yellow-500">
                                    <i className="fas fa-blog"></i>
                                    <span>Blog</span>
                                </button>
                                <button className="flex items-center space-x-3 text-gray-700 hover:text-yellow-500">
                                    <i className="fas fa-shield-alt"></i>
                                    <span>Privacy Policy</span>
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {store?.images && store.images.length > 0 && (
                    <section className="bg-white shadow-md">
                        <div className="relative h-72 md:h-96 lg:h-[550px] overflow-hidden">
                            <div
                                className="flex transition-transform duration-700 ease-in-out h-full"
                                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                            >
                                {store.images.map((image, index) => (
                                    <div key={index} className="w-full flex-shrink-0 h-full">
                                        <img
                                            src={image}
                                            alt={`${store.name || store.store_name} showcase ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                            {store.images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevSlide}
                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800/80 hover:bg-gray-800 text-white rounded-full p-3 transition-all duration-300 shadow-lg hover:scale-110"
                                    >
                                        <i className="fas fa-chevron-left"></i>
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800/80 hover:bg-gray-800 text-white rounded-full p-3 transition-all duration-300 shadow-lg hover:scale-110"
                                    >
                                        <i className="fas fa-chevron-right"></i>
                                    </button>
                                </>
                            )}
                            {store.images.length > 1 && (
                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                                    {store.images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToSlide(index)}
                                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                                currentSlide === index
                                                    ? 'bg-yellow-500 scale-125 shadow-lg'
                                                    : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {store?.aboutUs && (
                    <section className="py-8 bg-gray-100">
                        <div className="container mx-auto px-4">
                            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8 text-center max-w-3xl mx-auto">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3 flex items-center justify-center">
                                    <i className="fas fa-store text-yellow-400 mr-2"></i>
                                    About Us
                                </h2>
                                <div className="w-16 h-1 bg-yellow-400 mx-auto mb-4 rounded-full"></div>
                                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                                    {store.aboutUs}
                                </p>
                                <div className="flex justify-center mt-6 space-x-6 text-gray-700"></div>
                            </div>
                        </div>
                    </section>
                )}

                <div className="container mx-auto px-4 py-8">
                    <section className="mb-12">
                        {/* Enhanced Sticky Category Navigation */}
                        <div className="sticky top-28 z-40 bg-white/20 backdrop-blur-sm border-b border-gray-100/20 py-4 mb-8">
                            <div className="max-w-7xl mx-auto">
                                <div className="flex items-center">
                                    {/* Left Scroll Button */}
                                    <div className="flex-shrink-0 px-2">
                                        <button
                                            onClick={() => scrollCategories("left")}
                                            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600
                                 text-white rounded-xl p-3 shadow-lg transition-all duration-300 hover:scale-110
                                 focus:outline-none focus:ring-4 focus:ring-yellow-200/50"
                                        >
                                            <i className="fas fa-chevron-left text-sm"></i>
                                        </button>
                                    </div>

                                    {/* Categories Container */}
                                    <div className="flex-1 mx-4">
                                        <div
                                            id="category-scroll"
                                            className="flex overflow-x-auto scrollbar-hide space-x-4 py-2"
                                            style={{
                                                scrollbarWidth: 'none',
                                                msOverflowStyle: 'none'
                                            }}
                                        >
                                            {categories
                                                .filter(category =>
                                                    groupedProducts.some(
                                                        group =>
                                                            group.category._id === category._id &&
                                                            group.products?.length > 0
                                                    )
                                                )
                                                .map((category) => (
                                                    <button
                                                        key={category._id}
                                                        onClick={() => {
                                                            setSelectedCategory(category._id);

                                                            const target = document.getElementById(
                                                                `category-${category._id}`
                                                            );
                                                            if (target) {
                                                                target.scrollIntoView({
                                                                    behavior: "smooth",
                                                                    block: "start",
                                                                });
                                                            }
                                                        }}
                                                        className={`flex-shrink-0 px-6 py-3 rounded-2xl font-medium text-sm 
                                      transition-all duration-300 whitespace-nowrap 
                                      focus:outline-none focus:ring-2 focus:ring-yellow-400/30
                                      transform hover:scale-105 active:scale-95
                                      ${
                                                            selectedCategory === category._id
                                                                ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md scale-105"
                                                                : "bg-white/60 text-gray-700 border border-gray-200/30 hover:border-yellow-300/40 hover:bg-yellow-50/60 hover:shadow-sm hover:text-gray-800"
                                                        }`}
                                                    >
                                                        <i className="fas fa-tag mr-2 text-xs"></i>
                                                        {category.name}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>

                                    {/* Right Scroll Button */}
                                    <div className="flex-shrink-0 px-2">
                                        <button
                                            onClick={() => scrollCategories("right")}
                                            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600
                                 text-white rounded-xl p-3 shadow-lg transition-all duration-300 hover:scale-110
                                 focus:outline-none focus:ring-4 focus:ring-yellow-200/50"
                                        >
                                            <i className="fas fa-chevron-right text-sm"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Sections */}
                        <div className="container mx-auto px-4 py-8">
                            <div className="space-y-16">
                                {groupedProducts
                                    .filter(group => group.products && group.products.length > 0)
                                    .map(group => (
                                        <section
                                            id={`category-${group.category._id}`}
                                            key={group.category._id}
                                            className="scroll-mt-44"
                                        >
                                            {/* Enhanced Category Header */}
                                            <div className="relative mb-8">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        {/* Category Icon */}
                                                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-4 shadow-lg">
                                                            <i className="fas fa-tag text-white text-xl"></i>
                                                        </div>

                                                        {/* Category Title */}
                                                        <div>
                                                            <h3 className="text-3xl font-bold text-gray-800 mb-1">
                                                                {group.category.name}
                                                            </h3>
                                                            <p className="text-gray-500 text-sm font-medium">
                                                                {group.products.length}{" "}
                                                                {group.products.length === 1
                                                                    ? "item"
                                                                    : "items"}{" "}
                                                                available
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Decorative Line */}
                                                    <div className="flex-1 ml-6">
                                                        <div className="h-px bg-gradient-to-r from-yellow-400/50 to-transparent"></div>
                                                    </div>
                                                </div>

                                                {/* Category Badge */}
                                                <div className="mt-4">
                                <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-medium
                                               bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800
                                               border border-yellow-200/50 shadow-sm">
                                    <i className="fas fa-star mr-1 text-yellow-600"></i>
                                    Popular Choice
                                </span>
                                                </div>
                                            </div>

                                            {/* Products Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {group.products.map(product => (
                                                    <ProductCard key={product._id} product={product} />
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                            </div>

                            {/* Empty State */}
                            {groupedProducts.filter(group => group.products && group.products.length > 0).length === 0 && (
                                <div className="text-center py-16">
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-12 border border-gray-200/50">
                                        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                            <i className="fas fa-shopping-bag text-white text-2xl"></i>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-3">No Products Available</h3>
                                        <p className="text-gray-600 max-w-md mx-auto">
                                            We're working on adding amazing products to our catalog. Check back soon for exciting new items!
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                </div>

                <section className="bg-[#1E1E1E] py-12 relative">
                    <div className="absolute inset-0 bg-[#1E1E1E]/10"></div>
                    <div className="relative container mx-auto px-4 text-center text-[#E0E0E0]">
                        <h2 className="text-4xl font-bold mb-6">
                            <i className="fas fa-rocket mr-3"></i>
                            Ready to Order?
                        </h2>
                        <p className="text-xl mb-8 max-w-2xl mx-auto font-medium">
                            Join thousands of satisfied customers who trust us for delicious food!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center"></div>
                    </div>
                </section>

                <footer className="bg-[#1E1E1E] text-[#E0E0E0] py-8">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="md:col-span-2">
                                <div className="flex items-center space-x-3 mb-4">
                                    {store?.store_logo && (
                                        <div className="w-12 h-12 bg-[#FAFAFA] rounded-lg p-2">
                                            <img
                                                src={store.store_logo}
                                                alt={store.store_name}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xl font-bold text-[#F4B400]">{store?.store_name || slug}</h3>
                                        <p className="text-[#E0E0E0] text-sm">Quality Food, Fast Delivery</p>
                                    </div>
                                </div>
                                <p className="text-[#E0E0E0] text-sm mb-4 max-w-md">
                                    {store?.aboutUs || "We're passionate about serving you the finest quality food with exceptional taste and service."}
                                </p>
                                <div className="flex space-x-3">
                                    <div className="w-8 h-8 bg-[#F4B400] rounded-lg flex items-center justify-center hover:bg-[#F4B400]/90 transition-colors cursor-pointer">
                                        <i className="fab fa-facebook-f text-sm"></i>
                                    </div>
                                    <div className="w-8 h-8 bg-[#F4B400] rounded-lg flex items-center justify-center hover:bg-[#F4B400]/90 transition-colors cursor-pointer">
                                        <i className="fab fa-instagram text-sm"></i>
                                    </div>
                                    <div className="w-8 h-8 bg-[#F4B400] rounded-lg flex items-center justify-center hover:bg-[#F4B400]/90 transition-colors cursor-pointer">
                                        <i className="fab fa-youtube text-sm"></i>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4 text-[#F4B400]">Quick Links</h4>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><i className="fas fa-home mr-2"></i>Home</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><i className="fas fa-utensils mr-2"></i>Menu</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><i className="fas fa-info-circle mr-2"></i>About</a></li>
                                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors"><i className="fas fa-phone mr-2"></i>Contact</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-4 text-gray-300">Contact</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><i className="fas fa-map-marker-alt mr-2 text-yellow-500"></i>{store?.address || "123 Food Street, Karachi"}</li>
                                    <li><i className="fas fa-phone mr-2 text-yellow-500"></i>+92-XXX-XXXXXXX</li>
                                    <li><i className="fas fa-envelope mr-2 text-yellow-500"></i>info@{slug}.com</li>
                                    <li><i className="fas fa-clock mr-2 text-yellow-500"></i>24/7 Open</li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-gray-700 pt-4 text-center">
                            <p className="text-gray-400 text-sm">
                                © 2025 {store?.store_name || slug}. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                store={store}
                onLoginSuccess={handleLoginSuccess}
            />
            <AddressConfirmationModal
                isOpen={isAddressConfirmationModalOpen}
                onClose={() => setIsAddressConfirmationModalOpen(false)}
                onConfirm={handleAddressConfirmed}
                title="Confirm Delivery Address"
                subtitle="Please confirm your delivery address to continue ordering"
            />
            <CustomerProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onProfileUpdated={handleProfileUpdated}
            />
            <CartModal
                isOpen={isCartModalOpen}
                onClose={() => setIsCartModalOpen(false)}
                store={store}
                onOrderSuccess={handleOrderSuccess}
            />
            <OrderSuccessModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    setOrderData(null);
                }}
                orderData={orderData}
                currency={store?.currency}
            />
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
                integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg=="
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
            />
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async (
    context: GetServerSidePropsContext
) => {
    const { slug } = context.params as { slug: string };

    try {
        const { products, categories, store } = await fetchStoreData(slug);

        return {
            props: {
                initialProducts: products,
                initialCategories: categories,
                initialStore: store,
                slug
            }
        };
    } catch (error) {
        const err = error as Error;
        return {
            props: {
                initialProducts: [],
                initialCategories: [],
                initialStore: null,
                slug,
                error: err.message || "Failed to load store data",
            },
        };
    }

}