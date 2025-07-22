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
import ReceiptModal from './ReceiptModal';

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
  const [showReceipt, setShowReceipt] = useState(false);
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

        if (token) {
          // const userProfile = await fetchUserProfile(token, logout);

        }
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
      setShowReceipt(true);
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
      setShowReceipt(true);
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

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setCreatedOrder(null);
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
        <div className="lg:col-span-3">
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
            />
          </div>
        </div>
        <div className="lg:col-span-7">
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
      {showReceipt && createdOrder && (
        <ReceiptModal
          customerName={customerName}
          serviceType={serviceType}
          order={createdOrder}
          receivedAmount={receivedAmount}
          changeAmount={changeAmount}
          onPrint={() => {}}
          onClose={handleCloseReceipt}
          autoClose={false}
          paymentMethod={paymentMethod}
          showButtons={true}
          title={isAddToOrder ? "Items Added to Order" : "Order Confirmed"}
          selectedTable={selectedTable}
          selectedWaiter={selectedWaiter}

        />
      )}
    </div>
  );
}
