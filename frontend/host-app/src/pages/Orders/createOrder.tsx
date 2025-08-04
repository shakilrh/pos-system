import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { createOrder, getAllOrders, processPayment, addToExistingOrder } from '../../services/orderService';
import { fetchProducts } from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
import { fetchFreeTables, Table } from '../../services/floorTableService';
import { fetchFreeWaiters } from '../../services/orderService';
import { getUserDetails } from '../../services/UserService';
import FlashMessage from '../FlashMessage';
import OrderDetails from './OrderDetails';
import OrderMenu from './OrderMenu';
import toast from 'react-hot-toast';
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';

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
  table_id?: string;
  waiter_id?: string;
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
    const fetchStoreData = async () => {
      if (!token) {
        setStoreInfo({
          storeName: user?.store_name || user?.name || 'POS Store',
          phoneNumber: user?.phone_number || null,
          address: user?.address || null,
          store_logo: user?.store_logo || user?.logoUrl,
        });
        return;
      }

      try {
        const response = await getUserDetails(token);
        setStoreInfo({
          storeName: response.store_name || response.name || 'POS Store',
          phoneNumber: response.phone_number || null,
          address: response.address || null,
          store_logo: response.store_logo || response.logoUrl,
        });
      } catch (err) {
        console.error('Fetch store data error:', err);
        setStoreInfo({
          storeName: user?.store_name || user?.name || 'POS Store',
          phoneNumber: user?.phone_number || null,
          address: user?.address || null,
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

    const fetchData = async () => {
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

      const updatedOrder: Order = {
        _id: paymentResponse._id,
        items: orderData.order_items.map((item) => ({
          product_id: item.product_id,
          product: item.product || { name: `Product ${item.product_id}`, price: 0 },
          quantity: item.quantity,
          sub_total: item.sub_total || 0,
        })),
        order_type: paymentResponse.order_type,
        customer_name: paymentResponse.customer_name,
        service_type: paymentResponse.service_type,
        total_amount: paymentResponse.total_amount,
        order_number: paymentResponse.order_number,
        createdAt: paymentResponse.createdAt,
        status: paymentResponse.status,
        payment_status: paymentResponse.payment_status,
        estimated_completion: paymentResponse.estimated_completion,
        table_id: paymentResponse.table_id,
        waiter_id: paymentResponse.waiter_id,
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
          product_id: item.product_id,
          product: item.product || { name: `Product ${item.product_id}`, price: 0 },
          quantity: item.quantity,
          sub_total: item.sub_total || 0,
        })),
        estimated_completion: response.estimated_completion,
        status: orderData.service_type === 'take_away' ? 'confirmed' : 'pending',
        table_id: response.table_id,
        waiter_id: response.waiter_id,
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

    const storeName = storeInfo.storeName;
    const storePhone = storeInfo.phoneNumber;
    const storeAddress = storeInfo.address;
    const tableNumber = getTableNumber(createdOrder.table_id);
    const waiterName = getWaiterName(createdOrder.waiter_id);
    const storeLogo = storeInfo.store_logo || storeInfo.logoUrl;
    const isPaymentProcessed = createdOrder.payment_status === 'paid';
    const shouldShowPaymentMethod = paymentMethod && isPaymentProcessed;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
<html>
<head>
<title>Receipt - Order #${createdOrder.order_number}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --background-color: #ffffff;
    --surface-color: #ffffff;
    --text-color: #1a202c;
    --text-secondary: #4a5568;
    --border-color: #e2e8f0;
    --focus-ring: #3182ce;
    --error-color: #e53e3e;
    --background-secondary: #edf2f7;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, monospace, sans-serif;
    margin: 0;
    padding: 6px;
    font-size: 10px;
    line-height: 1.2;
    color: var(--text-color);
    background: var(--background-color);
  }

  .receipt-container {
    max-width: 72mm;
    margin: 0 auto;
    background: var(--surface-color);
    padding: 6px;
    border: 1px solid var(--border-color);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-color);
    gap: 8px;
  }

  .store-logo {
    width: 35px;
    height: 35px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .store-name {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    color: var(--text-color);
  }

  .order-header {
    text-align: center;
    margin: 6px 0;
    font-weight: 700;
    font-size: 12px;
    padding-bottom: 3px;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-color);
  }

  .order-details {
    font-size: 9px;
    margin: 6px 0;
    line-height: 1.2;
    color: var(--text-secondary);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    margin: 1px 0;
    padding: 1px 0;
  }

  .detail-row span:first-child {
    font-weight: 600;
  }

  .completion-time {
    text-align: center;
    font-weight: 700;
    margin: 6px 0;
    font-size: 9px;
    border: 1px solid var(--border-color);
    padding: 4px;
    background: var(--background-secondary);
  }

  .items-section {
    margin: 6px 0;
    padding-bottom: 3px;
  }

  .items-header {
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 3px;
    padding-bottom: 2px;
  }

  .items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }

  .items-table th {
    padding: 2px;
    text-align: left;
    font-weight: 700;
    color: var(--text-color);
  }

  .items-table td {
    padding: 2px;
    vertical-align: top;
    color: var(--text-secondary);
  }

  .item-name {
    max-width: 100px;
    word-wrap: break-word;
  }

  .item-center {
    text-align: center;
    width: 25px;
  }

  .item-right {
    text-align: right;
    width: 40px;
  }

  .total-section {
    margin: 6px 0;
    padding-top: 3px;
    border-top: 1px solid var(--border-color);
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    margin: 1px 0;
    font-size: 10px;
    padding: 1px 0;
    color: var(--text-color);
  }

  .total-row.grand-total {
    font-weight: 700;
    font-size: 12px;
    border-top: 1px solid var(--border-color);
    padding-top: 3px;
    margin-top: 3px;
  }

  .payment-info {
    text-align: center;
    font-size: 9px;
    margin: 4px 0;
    font-weight: 700;
    border: 1px solid var(--border-color);
    padding: 3px;
    background: var(--background-secondary);
    color: var(--text-color);
  }

  .thank-you {
    text-align: center;
    font-weight: 700;
    font-size: 10px;
    margin: 8px 0;
    text-transform: uppercase;
    color: var(--text-color);
  }

  .footer {
    text-align: center;
    font-size: 8px;
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid var(--border-color);
    color: var(--text-secondary);
  }

  .store-contact {
    font-size: 8px;
    margin-top: 3px;
    line-height: 1.2;
  }

  .divider {
    text-align: center;
    margin: 6px 0;
    font-size: 10px;
    font-weight: 700;
    color: var(--text-color);
  }

  @media print {
    body {
      margin: 0;
      padding: 0;
    }
    .receipt-container {
      max-width: none;
      width: 100%;
    }
  }
</style>
</head>
<body>
<div class="receipt-container">
  <div class="header">
    ${storeLogo ? `<img src="${storeLogo}" class="store-logo" alt="Store Logo" />` : ''}
    <div class="store-name">${storeName}</div>
  </div>

  <div class="order-header">
    ORDER #${createdOrder.order_number}
  </div>

  <div class="order-details">
    <div class="detail-row">
      <span>Date:</span>
      <span>${new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Karachi',
    })}</span>
    </div>
    <div class="detail-row">
      <span>Customer:</span>
      <span>${createdOrder.customer_name}</span>
    </div>
    <div class="detail-row">
      <span>Type:</span>
      <span>${createdOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</span>
    </div>
    ${createdOrder.service_type === 'dine_in' && createdOrder.table_id && tableNumber ? `
    <div class="detail-row">
      <span>Table:</span>
      <span>${tableNumber}</span>
    </div>` : ''}
    ${createdOrder.service_type === 'dine_in' && createdOrder.waiter_id && waiterName ? `
    <div class="detail-row">
      <span>Waiter:</span>
      <span>${waiterName}</span>
    </div>` : ''}
    ${shouldShowPaymentMethod ? `
    <div class="detail-row">
      <span>Payment:</span>
      <span>${paymentMethod.toUpperCase()}</span>
    </div>` : ''}
  </div>

  ${createdOrder.estimated_completion ? `
  <div class="completion-time">
    ESTIMATED COMPLETION: ${createdOrder.estimated_completion}
  </div>` : ''}

  <div class="divider">----------</div>

  <div class="items-section">
    <table class="items-table">
      <thead>
        <tr class="items-header">
          <th class="item-name">Item</th>
          <th class="item-center">Qty</th>
          <th class="item-right">Price</th>
          <th class="item-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${createdOrder.items.map(item => `
          <tr>
            <td class="item-name">${item.product?.name || 'Unknown Item'}</td>
            <td class="item-center">${item.quantity}</td>
            <td class="item-right">${formatPrice(item.product?.price || 0, activeCurrency)}</td>
            <td class="item-right">${formatPrice(item.sub_total || 0, activeCurrency)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="total-section">
    <div class="total-row grand-total">
      <span>TOTAL</span>
      <span>${formatPrice(createdOrder.total_amount || 0, activeCurrency)}</span>
    </div>
    ${changeAmount > 0 && isPaymentProcessed ? `
    <div class="total-row">
      <span>Change Given:</span>
      <span>${formatPrice(changeAmount, activeCurrency)}</span>
    </div>` : ''}
  </div>

  ${isPaymentProcessed ? `
  <div class="payment-info">
    PAYMENT CONFIRMED ✓
  </div>` : ''}

  <div class="thank-you">
    THANK YOU!
  </div>

  <div class="footer">
    <div>${new Date().toLocaleDateString()} | ${storeName}</div>
    ${(storeAddress || storePhone) ? `
    <div class="store-contact">
      ${storeAddress ? `${storeAddress}` : ''}
      ${storeAddress && storePhone ? '<br/>' : ''}
      ${storePhone ? `Tel: ${storePhone}` : ''}
    </div>` : ''}
  </div>
</div>
</body>
</html>
`);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    toast.success('Receipt printed successfully!');
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
          <div className="lg:col-span-4">
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
        {createdOrder && (
            <div className="flex gap-4 mt-6 justify-center">

            </div>
        )}
      </div>
  );
}