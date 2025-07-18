import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { createOrder, getAllOrders, processPayment } from '../../services/orderService';
import { fetchProducts } from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
import FlashMessage from '../FlashMessage';
import OrderDetails from './orderDetails';
import OrderMenu from './orderMenu';
import ReceiptModal from './ReceiptModal';

// Interface Definitions
interface Product {
  _id: string;
  name: string;
  price: number;
  category_id: string;
  categoryName: string;
  description: string;
  pictureUrl?: string | null;
  displayPrice: string;
  isActive: boolean;
  time_required?: number;
}

interface Category {
  _id: string;
  name: string;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  product?: Product;
  sub_total?: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  order_type: string;
  customer_name: string;
  service_type: 'dine_in' | 'take_away';
  total_amount: number;
  order_number: string;
  createdAt: string;
  status: string;
  payment_status: string;
  estimated_completion?: string;
}

export default function CreateOrder() {
  const { isAuthenticated, isLoading, token, logout, user } = useAuth();
  const router = useRouter();

  // State Management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [serviceType, setServiceType] = useState<'dine_in' | 'take_away'>('dine_in');
  const [customerName, setCustomerName] = useState('');
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [localLoading, setLocalLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [changeAmount, setChangeAmount] = useState(0);
  const [clientLoaded, setClientLoaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>('default');

  // Theme Management Effect
  useEffect(() => {
    setClientLoaded(true);
    const theme = document.querySelector('html')?.getAttribute('data-theme') || 'default';
    setCurrentTheme(theme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.querySelector('html')?.getAttribute('data-theme') || 'default';
          setCurrentTheme(newTheme);
        }
      });
    });

    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      observer.observe(htmlElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }

    return () => observer.disconnect();
  }, []);

  // Theme Color Logic
  const getThemeColors = () => {
    if (currentTheme === 'dark' || currentTheme === 'dark-pro') {
      return {
        cardBackground: '#1f2937',
        cardBorder: '#374151',
        cardText: '#ffffff',
        headingText: '#ffffff',
      };
    }
    switch (currentTheme) {
      case 'blue':
        return { cardBackground: '#ffffff', cardBorder: '#e5e7eb', cardText: '#1e3a8a', headingText: '#1e3a8a' };
      case 'green':
        return { cardBackground: '#ffffff', cardBorder: '#e5e7eb', cardText: '#064e3b', headingText: '#064e3b' };
      default:
        return { cardBackground: '#ffffff', cardBorder: '#e5e7eb', cardText: '#111827', headingText: '#111827' };
    }
  };

  const themeColors = getThemeColors();

  // Data Fetching Effect
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      setLocalLoading(true);
      try {
        if (!token) {
          setFlashMessage({ message: 'Authentication token not found. Please log in again.', type: 'error' });
          return;
        }
        const fetchedCategories = await fetchCategories(token, logout);
        setCategories(fetchedCategories);
        setSelectedCategory('');
        const fetchedProducts = await fetchProducts(token, logout, fetchedCategories);
        const activeProducts = fetchedProducts.filter((product) => product.isActive);
        setProducts(activeProducts);
      } catch (error) {
        console.error('Error fetching data:', error);
        setFlashMessage({ message: error instanceof Error ? error.message : 'Failed to fetch data', type: 'error' });
      } finally {
        setLocalLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isLoading, router, token, logout]);

  // Order Management Functions
  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find((item) => item.product_id === product._id);
    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.product_id === product._id
            ? { ...item, quantity: item.quantity + 1, sub_total: (item.product?.price || 0) * (item.quantity + 1) }
            : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        { product_id: product._id, quantity: 1, product: { ...product }, sub_total: product.price },
      ]);
    }
  };

  const calculateTotalOrderAmount = () => {
    return orderItems.reduce((sum, item) => sum + (item.sub_total || 0), 0);
  };

  useEffect(() => {
    const total = calculateTotalOrderAmount();
    if (serviceType === 'take_away' && (receivedAmount === 0 || receivedAmount < total)) {
      setReceivedAmount(total);
    }
  }, [orderItems, serviceType]);

  const handleCreateOrder = async () => {
    if (!isAuthenticated || !token) {
      setFlashMessage({ message: 'Authentication failed, please log in again', type: 'error' });
      return;
    }

    setLocalLoading(true);
    try {
      const response = await createOrder(token, logout,
        orderItems.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        {
          order_type: 'physical',
          customer_name: customerName || 'Guest',
          service_type: serviceType,
        }
      );

      const paymentResponse = serviceType === 'take_away' ? await processPayment(token, logout, response._id, receivedAmount, paymentMethod) : { ...response, payment_status: 'pending' };

      const totalAmount = calculateTotalOrderAmount();
      const change = serviceType === 'take_away' ? receivedAmount - totalAmount : 0;
      setChangeAmount(change > 0 ? change : 0);

      const updatedOrder: Order = {
        ...paymentResponse, // This already contains estimated_completion from the API response
        items: orderItems.map((item) => ({
          product_id: item.product_id,
          // Provide a full default product to satisfy the type
          product: item.product || { name: 'Product not found', price: 0, _id: item.product_id, category_id: '', categoryName: '', description: '', displayPrice: 'N/A', isActive: false },
          quantity: item.quantity,
          sub_total: item.sub_total || 0,
        })),
        // The `estimated_completion` property is now inherited from `...paymentResponse`
        status: serviceType === 'take_away' ? 'confirmed' : 'pending',
      };

      setCreatedOrder(updatedOrder);
      setShowReceipt(true);
      setFlashMessage({ message: 'Order created successfully', type: 'success' });
      await getAllOrders(token, logout);
    } catch (error) {
      console.error('Order creation error:', error);
      setFlashMessage({ message: error instanceof Error ? error.message : 'Failed to create order', type: 'error' });
    } finally {
      setLocalLoading(false);
    }
  };

  // Receipt and UI Functions
  const handlePrintReceipt = () => {
    if (!createdOrder) return;
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleString('en-US', { /* ... */ });
    if (printWindow) {
      // Receipt HTML generation code...
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      (!selectedCategory || product.category_id === selectedCategory) &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setCreatedOrder(null);
    setOrderItems([]);
    setCustomerName('');
    setServiceType('dine_in');
    setReceivedAmount(0);
    setPaymentMethod('cash');
    setChangeAmount(0);
  };

  // Render Logic
  if (!clientLoaded || isLoading || localLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--background-color)]">
        <div className="text-center p-6 max-w-md rounded-lg shadow-md border" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.cardBorder, color: themeColors.cardText }}>
          <div className="text-2xl mb-4" style={{ color: themeColors.headingText }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--background-color)]">
        <div className="text-center p-6 max-w-md rounded-lg shadow-md border" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.cardBorder, color: themeColors.cardText }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: themeColors.headingText }}>Access Denied</h2>
          <p className="mb-6" style={{ color: themeColors.cardText }}>Please log in to access the Order Creation Dashboard.</p>
          <button onClick={() => router.push('/pos-system/login')} className="px-4 py-2 bg-[var(--primary-color)] text-[var(--sidebar-text)] rounded-lg hover:bg-[var(--primary-700)] transition-colors">
            Go to Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen py-4 bg-[var(--background-color)]">
      {flashMessage && <FlashMessage message={flashMessage.message} type={flashMessage.type} onClose={() => setFlashMessage(null)} />}
      <div className="rounded-lg shadow-md border w-full mt-6" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.cardBorder, color: themeColors.cardText }}>
        <div className="p-8">
          <h1 className="text-2xl font-semibold mb-8" style={{ color: themeColors.headingText }}>Create Order</h1>
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
            <div className="lg:col-span-3">
              <div className="rounded-lg shadow-md border p-4" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.cardBorder, color: themeColors.cardText }}>
                <OrderDetails
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  serviceType={serviceType}
                  setServiceType={setServiceType}
                  receivedAmount={receivedAmount}
                  setReceivedAmount={setReceivedAmount}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  orderItems={orderItems}
                  setOrderItems={setOrderItems}
                  calculateTotalOrderAmount={calculateTotalOrderAmount}
                  handleCreateOrder={handleCreateOrder}
                  localLoading={localLoading}
                />
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="rounded-lg shadow-md border p-4" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.cardBorder, color: themeColors.cardText }}>
                <OrderMenu
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  categories={categories}
                  filteredProducts={filteredProducts}
                  addProductToOrder={addProductToOrder}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {showReceipt && createdOrder && (
        <ReceiptModal
          order={createdOrder}
          changeAmount={changeAmount}
          onPrint={handlePrintReceipt}
          onClose={handleCloseReceipt}
          autoClose={false}
          showButtons={true}
          title="Order Confirmed"
          paymentMethod={paymentMethod}
        />
      )}
    </div>
  );
}