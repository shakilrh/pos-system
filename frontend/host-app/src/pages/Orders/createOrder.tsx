import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { createOrder, getAllOrders, processPayment } from '../../services/orderService';
import { fetchProducts } from '../../services/productService';
import { fetchCategories } from '../../services/categoryService';
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
    console.log('CreateOrder token:', token, 'user:', user?._id);

    const fetchData = async () => {
      setLocalLoading(true);
      try {
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

  const handleCreateOrder = async () => {
    if (!isAuthenticated) {
      setFlashMessage({ message: 'Authentication failed, please log in again', type: 'error' });
      return;
    }
    console.log('Creating order with token:', token, 'user:', user?._id);

    setLocalLoading(true);
    try {
      const orderData = {
        items: orderItems.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        order_type: 'physical',
        customer_name: customerName,
        service_type: serviceType,
      };

      const response = await createOrder(token, logout, orderData.items, {
        order_type: orderData.order_type,
        customer_name: orderData.customer_name,
        service_type: orderData.service_type,
      });

      const paymentResponse = serviceType === 'take_away' ? await processPayment(token, logout, response._id, receivedAmount, paymentMethod) : { ...response, payment_status: 'pending' };

      const totalAmount = calculateTotalOrderAmount();
      const change = serviceType === 'take_away' ? receivedAmount - totalAmount : 0;
      setChangeAmount(change > 0 ? change : 0);

      const updatedOrder: Order = {
        ...paymentResponse,
        items: orderItems.map((item) => ({
          product_id: item.product_id,
          product: item.product || { name: `Product ${item.product_id}`, price: 0 },
          quantity: item.quantity,
          sub_total: item.sub_total || 0,
        })),
        estimated_completion: response.estimated_completion,
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

  const handlePrintReceipt = () => {
    if (!createdOrder) return;

    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Karachi',
    });

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; max-width: 300px; margin: 0 auto; padding: 10px; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { padding: 4px 2px; text-align: left; border-bottom: 1px solid #ddd; font-size: 12px; }
              .header { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #f59e0b; }
              .subheader { font-size: 18px; font-weight: bold; margin: 10px 0; color: #d97706; }
              .total-row { font-weight: bold; border-top: 2px solid #000; background-color: #fefcbf; }
              .completion-time { background-color: #fefcbf; padding: 5px; margin: 10px 0; border: 2px solid #d97706; border-radius: 5px; }
              hr { border: none; border-top: 2px solid #d97706; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="header">Rasnat Restaurant</div>
            <p>123 Main Street, City<br/>Phone: (123) 456-7890</p>
            <hr />
            <p class="subheader">Order #: ${createdOrder.order_number}</p>
            <p>Date: ${currentDate}</p>
            <p>Customer: ${createdOrder.customer_name}</p>
            <p>Type: ${createdOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
            <p>Payment: ${createdOrder.payment_status}</p>
            ${createdOrder.estimated_completion ?
        `<div class="completion-time">
                <strong>Estimated Completion:</strong><br/>
                ${createdOrder.estimated_completion}
              </div>` : ''
      }
            <hr />
            <table>
              <thead>
                <tr>
                  <th style="color: #d97706;">Item</th>
                  <th style="color: #d97706;">Qty</th>
                  <th style="color: #d97706;">Price</th>
                  <th style="color: #d97706;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${createdOrder.items
        .map(
          (item) => `
                      <tr>
                        <td>${item.product.name}</td>
                        <td>${item.quantity}</td>
                        <td>$${item.product.price.toFixed(2)}</td>
                        <td>$${item.sub_total.toFixed(2)}</td>
                      </tr>
                    `
        )
        .join('')}
                <tr class="total-row">
                  <td colspan="3"><strong>Total</strong></td>
                  <td><strong>$${createdOrder.total_amount.toFixed(2)}</strong></td>
                </tr>
                ${changeAmount > 0 ?
        `<tr>
                    <td colspan="3">Change</td>
                    <td>$${changeAmount.toFixed(2)}</td>
                  </tr>` : ''
      }
              </tbody>
            </table>
            <hr />
            <p><strong>Thank you for dining with us!</strong></p>
            <p>Please visit again</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const filteredProducts = products.filter(
    (product: Product) =>
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

  if (isLoading || localLoading) {
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
        className="rounded-lg shadow-md border w-full mt-6"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.cardBorder,
          color: themeColors.cardText,
        }}
      >
        <div className="p-8">
          <h1 className="text-2xl font-semibold mb-8" style={{ color: themeColors.headingText }}>
            Create Order
          </h1>
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
                  handleCreateOrder={handleCreateOrder}
                  localLoading={localLoading}
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