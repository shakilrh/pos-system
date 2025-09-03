import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { createOrder, getAllOrders, processPayment, addToExistingOrder } from '../../services/orderService';
import { fetchProducts } from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
import { ChartBarIcon, ShoppingBagIcon, XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { fetchFreeTables, Table } from '../../services/floorTableService';
import { fetchFreeWaiters } from '../../services/orderService';
import { getUserDetails } from '../../services/UserService';
import FlashMessage from '../FlashMessage';
import OrderDetails from './orderDetails';
import OrderMenu from './orderMenu';
import toast from 'react-hot-toast';
import { printReceipt } from './printReceipt';
// At the top of createOrder.tsx, add this import:
import { Order } from '../../services/orderService';

// Then remove the entire Order interface definition (around lines 58-75)
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

interface Waiter {
  _id: string;
  name: string;
  email: string;
  user_type: 'waiter';
  role: string | null;
  created_by: {
    id: string;
    name: string;
    email: string;
    store_name: string;
    logoUrl: string;
    store_logo: string;
  };
}

interface StoreInfo {
  storeName: string;
  phoneNumber: string | null;
  address: string | null;
  store_logo?: string;
  logoUrl?: string;
}

export default function CreateOrder() {
  const { isAuthenticated, isLoading, token, logout, user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [serviceType, setServiceType] = useState<'dine_in' | 'take_away'>('dine_in');
  const [customerName, setCustomerName] = useState('');
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [changeAmount, setChangeAmount] = useState(0);
  const [clientLoaded, setClientLoaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [freeTables, setFreeTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [waiterId, setWaiterId] = useState<string | null>(null);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [isAddToOrder, setIsAddToOrder] = useState(false);
  const [freeWaiters, setFreeWaiters] = useState<Waiter[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    storeName: 'POS Store',
    phoneNumber: null,
    address: null,
  });
  const [activeCurrency, setActiveCurrency] = useState('pkr');

  const getCurrencySymbol = (currency: string) => {
    const symbols = {
      pkr: '₨',
      dollar: '$',
      euro: '€',
    };
    return symbols[currency as keyof typeof symbols] || '₨';
  };

  const formatPrice = (price: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price.toFixed(2)}`;
  };

  const getCurrentCurrency = () => {
    const domCurrency = document.documentElement.getAttribute('data-currency');
    const storedCurrency = localStorage.getItem('appCurrency');
    return domCurrency || storedCurrency || 'pkr';
  };

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

    const handleCurrencyChange = (event: CustomEvent) => {
      const newCurrency = event.detail.currency;
      if (newCurrency && newCurrency !== activeCurrency) {
        setActiveCurrency(newCurrency);
      }
    };

    const handleSettingsLoaded = (event: CustomEvent) => {
      const newCurrency = event.detail.currency;
      if (newCurrency) {
        setActiveCurrency(newCurrency);
      }
    };

    const handleForceRerender = (event: CustomEvent) => {
      if (event.detail.type === 'currency') {
        const newCurrency = event.detail.value;
        setActiveCurrency(newCurrency);
      }
    };

    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    window.addEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
    window.addEventListener('forceRerender', handleForceRerender as EventListener);

    const initialCurrency = getCurrentCurrency();
    if (initialCurrency !== activeCurrency) {
      setActiveCurrency(initialCurrency);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
      window.removeEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
      window.removeEventListener('forceRerender', handleForceRerender as EventListener);
    };
  }, [activeCurrency]);

  useEffect(() => {
    // Replace the fetchStoreData function in createOrder.tsx (around line 207) with this version:

    const fetchStoreData = async () => {
      if (!token) {
        setStoreInfo({
          storeName: user?.store_name || user?.name || 'POS Store',
          phoneNumber: (user as any)?.phone_number || null,
          address: (user as any)?.address || null,
          store_logo: user?.store_logo || user?.logoUrl,
        });
        return;
      }

      try {
        const response = await getUserDetails(token);
        setStoreInfo({
          storeName: response.store_name || response.name || 'POS Store',
          phoneNumber: (response as any).phone_number || null,
          address: (response as any).address || null,
          store_logo: (response as any).store_logo || response.logoUrl,
        });
      } catch (err) {
        console.error('Fetch store data error:', err);
        setStoreInfo({
          storeName: user?.store_name || user?.name || 'POS Store',
          phoneNumber: (user as any)?.phone_number || null,
          address: (user as any)?.address || null,
          store_logo: user?.store_logo || user?.logoUrl,
        });
      }
    };

    fetchStoreData();
  }, [token, user]);

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
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#1e3a8a',
          headingText: '#1e3a8a',
        };
      case 'green':
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#064e3b',
          headingText: '#064e3b',
        };
      default:
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#111827',
          headingText: '#111827',
        };
    }
  };

  const themeColors = getThemeColors();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // In your createOrder.tsx, replace the fetchData function (around line 273) with this:

    const fetchData = async () => {
      // Add null check for token
      if (!token) {
        console.error('No authentication token available');
        setFlashMessage({ message: 'Authentication token not available', type: 'error' });
        return;
      }

      try {
        const fetchedCategories = await fetchCategories(token, logout);
        setCategories(fetchedCategories);
        setSelectedCategory('');
        const fetchedProducts = await fetchProducts(token, logout, fetchedCategories);
        const activeProducts = fetchedProducts.filter((product) => product.isActive);
        setProducts(activeProducts);
        if (serviceType === 'dine_in') {
          const fetchedFreeTables = await fetchFreeTables(token, logout);
          setFreeTables(fetchedFreeTables);
        } else {
          setFreeTables([]);
        }
        const waitersResponse = await fetchFreeWaiters(token, logout);
        setFreeWaiters(waitersResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
        setFlashMessage({ message: error instanceof Error ? error.message : 'Failed to fetch data', type: 'error' });
      }
    };

    fetchData();
  }, [isAuthenticated, isLoading, router, token, logout, serviceType]);

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
        {
          product_id: product._id,
          quantity: 1,
          product: { ...product },
          sub_total: product.price,
        },
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

  const isValidObjectId = (id: string | null | undefined): boolean => {
    return id ? /^[0-9a-fA-F]{24}$/.test(id) : false;
  };

  // In your createOrder.tsx, replace the handleCreateOrder function (around line 340) with this:

  const handleCreateOrder = async (orderData: {
    customer_name: string;
    service_type: 'dine_in' | 'take_away';
    order_items: OrderItem[];
    table_id?: string;
    parent_order_number?: string;
    waiter_id?: string;
    payment_method?: string;
    received_amount?: number;
  }) => {
    if (!isAuthenticated) {
      setFlashMessage({ message: 'Authentication failed, please log in again', type: 'error' });
      return;
    }

    // Add null check for token
    if (!token) {
      setFlashMessage({ message: 'Authentication token not available', type: 'error' });
      return;
    }

    try {
      console.log('Creating order with data:', orderData);
      const items = orderData.order_items.map((item) => ({ product_id: item.product_id, quantity: item.quantity }));

      if (orderData.table_id && !isValidObjectId(orderData.table_id)) {
        throw new Error('Invalid table_id: must be a 24-character hexadecimal string');
      }
      if (orderData.waiter_id && !isValidObjectId(orderData.waiter_id)) {
        throw new Error('Invalid waiter_id: must be a 24-character hexadecimal string');
      }

      const response = await createOrder(token, logout, items, {
        order_type: 'physical',
        customer_name: orderData.customer_name,
        service_type: orderData.service_type,
        table_id: orderData.table_id,
        waiter_id: orderData.waiter_id,
      });

      const paymentResponse = serviceType === 'take_away' ? await processPayment(token, logout, response._id, receivedAmount, paymentMethod) : { ...response, payment_status: 'pending' };

      const totalAmount = calculateTotalOrderAmount();
      const change = orderData.service_type === 'take_away' && orderData.received_amount ? orderData.received_amount - totalAmount : 0;
      setChangeAmount(change > 0 ? change : 0);

      // In your createOrder.tsx, replace the updatedOrder object creation (around line 393) with this:

      // In your createOrder.tsx, replace the updatedOrder object creation in handleCreateOrder with this:

      const updatedOrder: Order = {
        ...paymentResponse,
        items: orderData.order_items.map((item) => ({
          _id: '',
          order_id: paymentResponse._id,
          product_id: {
            _id: item.product?._id || item.product_id,
            name: item.product?.name || 'Unknown Item',
            price: item.product?.price || 0,
            pictureUrl: item.product?.pictureUrl || ''
          },
          quantity: item.quantity,
          sub_total: item.sub_total || 0,
          created_by: paymentResponse.created_by || '',
          createdAt: paymentResponse.createdAt,
          updatedAt: paymentResponse.updatedAt || paymentResponse.createdAt
        })),
        table_id: paymentResponse.table_id || null,    // Changed from undefined to null
        waiter_id: paymentResponse.waiter_id || null,  // Changed from undefined to null
      };

      const selectedTableData = orderData.table_id ? freeTables.find((t) => t._id === orderData.table_id) || null : null;
      const selectedWaiterData = orderData.waiter_id ? freeWaiters.find((w) => w._id === orderData.waiter_id) || null : null;
      setSelectedTable(selectedTableData);
      setSelectedWaiter(selectedWaiterData);

      setCreatedOrder(updatedOrder);
      setFlashMessage({ message: 'Order created successfully', type: 'success' });
      await getAllOrders(token, logout);
      if (orderData.service_type === 'dine_in' && orderData.table_id) {
        setFreeTables(freeTables.filter((table) => table._id !== orderData.table_id));
      }
    } catch (error) {
      console.error('Order creation error:', error);
      setFlashMessage({ message: error instanceof Error ? error.message : 'Failed to create order', type: 'error' });
    }
  };

  const handleAddToOrder = async (orderData: {
    customer_name: string;
    service_type: 'dine_in' | 'take_away';
    order_items: OrderItem[];
    table_id?: string;
    parent_order_number?: string;
    waiter_id?: string;
    payment_method?: string;
    received_amount?: number;
  }) => {
    if (!isAuthenticated) {
      setFlashMessage({ message: 'Authentication failed, please log in again', type: 'error' });
      return;
    }

    // Add null check for token
    if (!token) {
      setFlashMessage({ message: 'Authentication token not available', type: 'error' });
      return;
    }

    if (!orderData.parent_order_number) {
      setFlashMessage({ message: 'Parent order number is required to add to an existing order', type: 'error' });
      return;
    }

    try {
      console.log('Adding to order with data:', orderData);
      const items = orderData.order_items.map((item) => ({ product_id: item.product_id, quantity: item.quantity }));

      if (orderData.table_id && !isValidObjectId(orderData.table_id)) {
        throw new Error('Invalid table_id: must be a 24-character hexadecimal string');
      }
      if (orderData.waiter_id && !isValidObjectId(orderData.waiter_id)) {
        throw new Error('Invalid waiter_id: must be a 24-character hexadecimal string');
      }

      const response = await addToExistingOrder(token, logout, orderData.parent_order_number, items);

      let paymentResponse = response;
      if (orderData.service_type === 'take_away' && orderData.payment_method && orderData.received_amount) {
        paymentResponse = await processPayment(token, logout, response._id, orderData.received_amount, orderData.payment_method);
      } else {
        paymentResponse = { ...response, payment_status: 'pending' };
      }

      const totalAmount = calculateTotalOrderAmount();
      const change = orderData.service_type === 'take_away' && orderData.received_amount ? orderData.received_amount - totalAmount : 0;
      setChangeAmount(change > 0 ? change : 0);

      const updatedOrder: Order = {
        ...paymentResponse,
        items: orderData.order_items.map((item) => ({
          _id: '',
          order_id: paymentResponse._id,
          product_id: {
            _id: item.product?._id || item.product_id,
            name: item.product?.name || 'Unknown Item',
            price: item.product?.price || 0,
            pictureUrl: item.product?.pictureUrl || ''
          },
          quantity: item.quantity,
          sub_total: item.sub_total || 0,
          created_by: paymentResponse.created_by || '',
          createdAt: paymentResponse.createdAt,
          updatedAt: paymentResponse.updatedAt || paymentResponse.createdAt
        })),
        table_id: paymentResponse.table_id || null,    // Changed from undefined to null
        waiter_id: paymentResponse.waiter_id || null,  // Changed from undefined to null
      };
      const selectedTableData = orderData.table_id ? freeTables.find((t) => t._id === orderData.table_id) || null : null;
      const selectedWaiterData = orderData.waiter_id ? freeWaiters.find((w) => w._id === orderData.waiter_id) || null : null;
      setSelectedTable(selectedTableData);
      setSelectedWaiter(selectedWaiterData);

      setCreatedOrder(updatedOrder);
      setFlashMessage({ message: 'Items added to order successfully', type: 'success' });
      await getAllOrders(token, logout);
    } catch (error) {
      console.error('Add to order error:', error);
      setFlashMessage({ message: error instanceof Error ? error.message : 'Failed to add items to order', type: 'error' });
    }
  };

  const filteredProducts = products.filter(
      (product: Product) =>
          (!selectedCategory || product.category_id === selectedCategory) &&
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTableNumber = (tableId: string | undefined) => {
    if (!tableId || !selectedTable) return 'N/A';
    return selectedTable.number || 'N/A';
  };

  const getWaiterName = (waiterId: string | undefined) => {
    if (!waiterId || !selectedWaiter) return 'N/A';
    return selectedWaiter.name || 'N/A';
  };

  const handleClearOrder = () => {
    setOrderItems([]);
    setCustomerName('');
    setServiceType('dine_in');
    setReceivedAmount(0);
    setPaymentMethod('cash');
    setChangeAmount(0);
    setSelectedTableId(null);
    setSelectedTable(null);
    setWaiterId(null);
    setSelectedWaiter(null);
    setIsAddToOrder(false);
    setCreatedOrder(null);
    toast.success('Order cleared successfully');
  };

  const handleDirectPrint = () => {
    if (!createdOrder) {
      toast.error('No order to print. Please create an order first.');
      return;
    }

    printReceipt({
      createdOrder,
      storeInfo,
      activeCurrency,
      selectedTable,
      selectedWaiter,
      changeAmount,
      paymentMethod,
      formatPrice,
    });
  };

  if (!clientLoaded) {
    return (
        <div className="flex justify-center items-center h-screen bg-[var(--background-color)]">
          <div
              className="text-center p-6 max-w-md rounded-lg shadow-md border"
              style={{
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.cardBorder,
                color: themeColors.cardText,
              }}
          >
            <div className="text-2xl mb-4" style={{ color: themeColors.headingText }}>
              Loading...
            </div>
          </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return (
        <div className="flex justify-center items-center h-screen bg-[var(--background-color)]">
          <div
              className="text-center p-6 max-w-md rounded-lg shadow-md border"
              style={{
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.cardBorder,
                color: themeColors.cardText,
              }}
          >
            <h2 className="text-2xl font-bold mb-4" style={{ color: themeColors.headingText }}>
              Access Denied
            </h2>
            <p className="mb-6" style={{ color: themeColors.cardText }}>
              Please log in to access the Order Creation Dashboard.
            </p>
            <button
                onClick={() => window.location.href = '/pos-system/login'}
                className="px-4 py-2 bg-[var(--primary-color)] text-[var(--sidebar-text)] rounded-lg hover:bg-[var(--primary-700)] transition-colors"
            >
              Go to Log In
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="w-full min-h-screen py-4 bg-[var(--background-color)]">
        {flashMessage && (
            <FlashMessage
                message={flashMessage.message}
                type={flashMessage.type}
                onClose={() => setFlashMessage(null)}
            />
        )}
        <div
            className="rounded-lg shadow-md border w-full p-4 mb-6"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.cardBorder,
              color: themeColors.cardText,
            }}
        >
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
            <div className="mb-3 lg:mb-0">
              <h1 className="text-2xl font-bold" style={{ color: themeColors.headingText }}>Create Order</h1>
            </div>
            <div className="flex gap-4">
              <button
                  onClick={() => {
                    setIsAddToOrder(false);
                    setOrderItems([]);
                    setCustomerName('');
                    setServiceType('dine_in');
                    setReceivedAmount(0);
                    setPaymentMethod('cash');
                    setSelectedTableId(null);
                    setSelectedTable(null);
                    setWaiterId(null);
                    setSelectedWaiter(null);
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${!isAddToOrder ? 'bg-[var(--primary-color)] text-[var(--sidebar-text)]' : 'bg-[var(--background-secondary)] text-[var(--text-secondary)]'}`}
              >
                Create New Order
              </button>
              <button
                  onClick={() => {
                    setIsAddToOrder(true);
                    setOrderItems([]);
                    setCustomerName('');
                    setServiceType('dine_in');
                    setReceivedAmount(0);
                    setPaymentMethod('cash');
                    setSelectedTableId(null);
                    setSelectedTable(null);
                    setWaiterId(null);
                    setSelectedWaiter(null);
                  }}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${isAddToOrder ? 'bg-[var(--primary-color)] text-[var(--sidebar-text)]' : 'bg-[var(--background-secondary)] text-[var(--text-secondary)]'}`}
              >
                Add to Existing Order
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          <div className="lg:col-span-4 space-y-4">
            <div
                className="rounded-lg shadow-md border p-4"
                style={{
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.cardBorder,
                  color: themeColors.cardText,
                }}
            >
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
                  handleCreateOrder={isAddToOrder ? handleAddToOrder : handleCreateOrder}
                  freeTables={freeTables}
                  selectedTableId={selectedTableId}
                  setSelectedTableId={setSelectedTableId}
                  token={token}
                  logout={logout}
                  orders={[]}
                  waiterId={waiterId}
                  setWaiterId={setWaiterId}
                  freeWaiters={freeWaiters}
                  isAddToOrder={isAddToOrder}
                  currentTheme={currentTheme}
                  currentCurrency={activeCurrency}
                  createdOrder={createdOrder}
                  selectedTable={selectedTable}
                  selectedWaiter={selectedWaiter}
                  changeAmount={changeAmount}
              />
            </div>

            {/* Action Buttons - Now positioned below OrderDetails on the left side */}
            {createdOrder && (
                <div
                    className="rounded-lg shadow-md border p-4"
                    style={{
                      backgroundColor: themeColors.cardBackground,
                      borderColor: themeColors.cardBorder,
                    }}
                >
                  <div className="flex gap-3">
                    <button
                        onClick={handleDirectPrint}
                        className="flex-1 px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm transition-all duration-200 bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                    >
                      <PrinterIcon className="w-5 h-5" />
                      Print Receipt
                    </button>
                    <button
                        onClick={handleClearOrder}
                        className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm bg-red-600 text-white hover:bg-red-700 shadow-md transition-all duration-200"
                    >
                      Clear Order
                    </button>
                  </div>
                </div>
            )}
          </div>

          <div className="lg:col-span-6">
            <div
                className="rounded-lg shadow-md border p-4"
                style={{
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.cardBorder,
                  color: themeColors.cardText,
                }}
            >
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
  );
}