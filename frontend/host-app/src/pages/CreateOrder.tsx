import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { createOrder, getAllOrders, processPayment } from '../services/OrderService';
import { fetchProducts } from '../services/ProductService';
import { fetchCategories } from '../services/CategoryService';
import { MagnifyingGlassIcon, XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';

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

interface OrderItemResponse {
  product_id: string;
  product: Product;
  quantity: number;
  sub_total: number;
}

interface Order {
  _id: string;
  items: OrderItemResponse[];
  order_type: string;
  customer_name: string;
  service_type: 'dine_in' | 'take_away';
  total_amount: number;
  order_number: number;
  createdAt: string;
  status: string;
  payment_status: string;
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
  const [message, setMessage] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !token || !user?._id) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      setLocalLoading(true);
      try {
        console.log('Fetching categories and products with token:', token);
        const fetchedCategories = await fetchCategories(token, logout);
        setCategories(fetchedCategories);
        setSelectedCategory(''); // Default to "All Products"
        const fetchedProducts = await fetchProducts(token, logout, fetchedCategories);
        // Filter for active products only, matching products.tsx logic
        const activeProducts = fetchedProducts.filter((product) => product.isActive);
        setProducts(activeProducts);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to fetch data');
        setProducts([]);
        setCategories([]);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isLoading, token, user?._id, router, logout]);

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

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity >= 0) {
      if (quantity === 0) {
        setOrderItems(orderItems.filter((item) => item.product_id !== productId));
      } else {
        setOrderItems(
          orderItems.map((item) =>
            item.product_id === productId
              ? { ...item, quantity, sub_total: (item.product?.price || 0) * quantity }
              : item
          )
        );
      }
    }
  };

  const calculateTotalOrderAmount = () => {
    return orderItems.reduce((sum, item) => sum + (item.sub_total || 0), 0);
  };

  const handleIsPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsPaid(checked);
    if (checked) {
      const total = calculateTotalOrderAmount();
      setReceivedAmount(total);
    } else {
      setReceivedAmount(0);
    }
  };

  useEffect(() => {
    if (isPaid) {
      const total = calculateTotalOrderAmount();
      setReceivedAmount(total);
    }
  }, [orderItems, isPaid]);

  const handleCreateOrder = async () => {
    if (!token || !user?._id) {
      toast.error('Please log in to create order');
      router.push('/login');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setLocalLoading(true);
    try {
      const orderData = {
        items: orderItems.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        order_type: 'physical',
        customer_name: customerName,
        service_type: serviceType,
      };
      console.log('Creating order with data:', orderData);
      const response = await createOrder(token, logout, orderData.items, {
        order_type: orderData.order_type,
        customer_name: orderData.customer_name,
        service_type: orderData.service_type,
      });
      console.log('Order created response:', response);

      let updatedOrder: Order = { ...response, items: orderItems.map(item => ({
          product_id: item.product_id,
          product: item.product || { name: `Product ${item.product_id}`, price: 0 },
          quantity: item.quantity,
          sub_total: item.sub_total || 0
        })) };
      if (isPaid && response._id) {
        console.log('Processing payment for order:', response._id);
        const paymentResponse = await processPayment(token, logout, response._id, receivedAmount, paymentMethod);
        updatedOrder = { ...paymentResponse, items: updatedOrder.items };
        setMessage('Payment processed successfully');
      }

      setCreatedOrder(updatedOrder);
      setShowReceipt(true);
      toast.success('Order created successfully');
      const allOrders = await getAllOrders(token, logout);
      console.log('Updated orders:', allOrders);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create order');
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
              body { font-family: Arial, sans-serif; text-align: center; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
              .header { font-size: 24px; font-weight: bold; }
              .subheader { font-size: 18px; }
              .qr-code { margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">Rasnat Restaurant</div>
            <p>123 Main Street, City</p>
            <p>Phone: (123) 456-7890</p>
            <hr />
            <p class="subheader">Order #: ${createdOrder.order_number}</p>
            <p>Date: ${currentDate}</p>
            <p>Type: ${createdOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
            <p>Customer: ${createdOrder.customer_name}</p>
            <p>Status: ${createdOrder.status}</p>
            <p>Payment: ${createdOrder.payment_status}</p>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
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
              </tbody>
            </table>
            <p>Total: $${createdOrder.total_amount.toFixed(2)}</p>
            <div class="qr-code">
              ${QRCode.toString(`order:${createdOrder._id}`, {
        type: 'svg',
        width: 100,
        height: 100,
        margin: 2,
      })}
              <p>Scan for order tracking</p>
            </div>
            <p>Thank you for dining with us!</p>
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
    setIsPaid(false);
  };

  if (isLoading || localLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Order Details Section */}
        <div className="lg:w-1/3 w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Order Details</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              required
            />
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as 'dine_in' | 'take_away')}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <option value="dine_in">Dine-In</option>
              <option value="take_away">Takeaway</option>
            </select>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={handleIsPaidChange}
                className="h-4 w-4 text-indigo-600 rounded"
              />
              <span>Mark as Paid</span>
            </label>
            {isPaid && (
              <div className="space-y-2">
                <input
                  type="number"
                  value={receivedAmount}
                  readOnly
                  placeholder="Received amount"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200 bg-gray-100"
                />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
              </div>
            )}
            <div className="mt-4">
              <h3 className="font-semibold">Order Summary</h3>
              {orderItems.length === 0 ? (
                <p className="text-gray-500">No items added to the order</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4">Item</th>
                    <th className="py-2 px-4">Qty</th>
                    <th className="py-2 px-4">Price</th>
                    <th className="py-2 px-4">Total</th>
                  </tr>
                  </thead>
                  <tbody>
                  {orderItems.map((item) => (
                    <tr key={item.product_id} className="border-b">
                      <td className="py-2 px-4">{item.product?.name || `Product ${item.product_id}`}</td>
                      <td className="py-2 px-4">{item.quantity}</td>
                      <td className="py-2 px-4">${(item.product?.price || 0).toFixed(2)}</td>
                      <td className="py-2 px-4">${(item.sub_total || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td colSpan={3} className="py-2 px-4 text-right">Total</td>
                    <td className="py-2 px-4">${calculateTotalOrderAmount().toFixed(2)}</td>
                  </tr>
                  </tbody>
                </table>
              )}
            </div>
            <button
              onClick={handleCreateOrder}
              className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-all duration-200"
            >
              {localLoading ? 'Creating Order...' : 'Place Order'}
            </button>
          </div>
        </div>

        {/* Menu Items Section */}
        <div className="lg:w-2/3 w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Menu Items</h2>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
            />
            {searchTerm && (
              <XMarkIcon
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700"
              />
            )}
          </div>
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedCategory === '' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategory(category._id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedCategory === category._id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-4 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredProducts.map((product: Product) => (
              <div
                key={product._id}
                onClick={() => addProductToOrder(product)}
                className="bg-white rounded-lg p-2 flex flex-col items-center cursor-pointer border border-gray-200 hover:shadow-sm hover:scale-105 transition-all duration-200"
                style={{ minHeight: '120px', minWidth: '120px' }}
              >
                <img
                  src={product.pictureUrl || 'https://via.placeholder.com/96'}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-md mb-2"
                />
                <span className="text-sm font-semibold text-gray-800 text-center">{product.name}</span>
                <span className="text-sm text-green-600">${product.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showReceipt && createdOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Order #: {createdOrder.order_number}</h2>
            <p>Customer: {createdOrder.customer_name}</p>
            <p>Type: {createdOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
            <p>Status: {createdOrder.status.replace('_', ' ')}</p>
            <p>Payment: {createdOrder.payment_status}</p>
            <div className="mt-4">
              <h3 className="font-semibold">Items:</h3>
              <table className="w-full text-left">
                <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
                </thead>
                <tbody>
                {createdOrder.items.map((item) => (
                  <tr key={item.product_id}>
                    <td>{item.product.name}</td>
                    <td>{item.quantity}</td>
                    <td>${item.product.price.toFixed(2)}</td>
                    <td>${item.sub_total.toFixed(2)}</td>
                  </tr>
                ))}
                </tbody>
              </table>
              <p className="mt-2 font-bold">Total: ${createdOrder.total_amount.toFixed(2)}</p>
            </div>
            <div className="mt-4 flex justify-center">
              <QRCode value={`order:${createdOrder._id}`} size={100} />
            </div>
            <p className="text-center mt-2">Scan for order tracking</p>
            <div className="mt-4 flex justify-between">
              <button
                onClick={handlePrintReceipt}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
              >
                <PrinterIcon className="w-5 h-5 inline-block mr-2" />
                Print Receipt
              </button>
              <button
                onClick={handleCloseReceipt}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes subtle-zoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .hover\:shadow-sm:hover {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .hover\:scale-105:hover {
          animation: subtle-zoom 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
