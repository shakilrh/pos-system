import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { createOrder, getAllOrders, processPayment } from '../services/OrderService';
import { fetchProducts } from '../services/ProductService';
import { fetchCategories } from '../services/CategoryService';
import { MagnifyingGlassIcon, XMarkIcon, PrinterIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
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
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
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
        if (fetchedCategories.length > 0) {
          setSelectedCategory(fetchedCategories[0]._id);
        }
        const fetchedProducts = await fetchProducts(token, logout, fetchedCategories);
        setProducts(fetchedProducts);
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

      let updatedOrder = { ...response, items: orderItems.map(item => ({
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
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - Order #${createdOrder.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; color: #333; }
            .receipt-container { max-width: 400px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; font-size: 14px; }
            .details p { margin: 5px 0; font-size: 14px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 14px; }
            .items-table th { background-color: #f4f4f4; }
            .total { text-align: right; font-size: 16px; font-weight: bold; margin-top: 20px; }
            .qr-code { text-align: center; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            @media print { body { margin: 0; font-size: 12pt; } .receipt-container { border: none; } }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h1>Rasnat Restaurant</h1>
              <p>123 Main Street, City</p>
              <p>Phone: (123) 456-7890</p>
            </div>
            <div class="details">
              <p><strong>Order #:</strong> ${createdOrder.order_number}</p>
              <p><strong>Date:</strong> ${currentDate}</p>
              <p><strong>Type:</strong> ${createdOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
              <p><strong>Customer:</strong> ${createdOrder.customer_name}</p>
              <p><strong>Status:</strong> ${createdOrder.status}</p>
              <p><strong>Payment:</strong> ${createdOrder.payment_status}</p>
            </div>
            <table class="items-table">
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
            <div class="total">
              <p>Total: $${createdOrder.total_amount.toFixed(2)}</p>
            </div>
            <div class="qr-code">
              <svg>${QRCode.toString(`order:${createdOrder._id}`, {
        type: 'svg',
        width: 100,
        height: 100,
        margin: 2,
      })}</svg>
              <p>Scan for order tracking</p>
            </div>
            <div class="footer">
              <p>Thank you for dining with us!</p>
              <p>Please visit again</p>
            </div>
          </div>
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
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Create New Order</h1>
          <button
            onClick={() => router.push('/Orders')}
            className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Orders
          </button>
        </div>

        {message && (
          <div
            className={`p-4 mb-4 rounded-lg ${
              message.includes('Failed')
                ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200'
                : 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200'
            }`}
          >
            {message}
          </div>
        )}

        {showReceipt && createdOrder ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              Order #: {createdOrder.order_number}
            </h2>
            <div className="space-y-2">
              <p><strong>Customer:</strong> {createdOrder.customer_name}</p>
              <p><strong>Type:</strong> {createdOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
              <p><strong>Status:</strong> {createdOrder.status.replace('_', ' ')}</p>
              <p><strong>Payment:</strong> {createdOrder.payment_status}</p>
              <div className="mt-4">
                <p className="font-semibold">Items:</p>
                <table className="w-full text-sm mt-2">
                  <thead>
                  <tr className="bg-gray-200 dark:bg-gray-700">
                    <th className="py-2 px-4 text-left">Item</th>
                    <th className="py-2 px-4 text-center">Qty</th>
                    <th className="py-2 px-4 text-right">Price</th>
                    <th className="py-2 px-4 text-right">Total</th>
                  </tr>
                  </thead>
                  <tbody>
                  {createdOrder.items.map((item) => (
                    <tr key={item.product_id} className="border-b">
                      <td className="py-2 px-4">{item.product.name}</td>
                      <td className="py-2 px-4 text-center">{item.quantity}</td>
                      <td className="py-2 px-4 text-right">${item.product.price.toFixed(2)}</td>
                      <td className="py-2 px-4 text-right">${item.sub_total.toFixed(2)}</td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 font-semibold text-right">
                Total: ${createdOrder.total_amount.toFixed(2)}
              </p>
              <div className="text-center mt-4">
                <QRCode value={`order:${createdOrder._id}`} size={100} />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Scan for order tracking</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center justify-center gap-2"
              >
                <PrinterIcon className="h-5 w-5" />
                Print Receipt
              </button>
              <button
                onClick={handleCloseReceipt}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Menu Items</h2>
              <div className="relative mb-4">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                {searchTerm && (
                  <XMarkIcon
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700"
                  />
                )}
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No products found</p>
                ) : (
                  filteredProducts.map((product: Product) => (
                    <button
                      key={product._id}
                      onClick={() => addProductToOrder(product)}
                      className="w-full text-left p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex justify-between items-center"
                    >
                      <span>{product.name}</span>
                      <span>{product.displayPrice}</span>
                      <span className="text-sm text-gray-500">{product.categoryName}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Order Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Order Type
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as 'dine_in' | 'take_away')}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="dine_in">Dine-In</option>
                    <option value="take_away">Takeaway</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment
                  </label>
                  <div className="flex space-x-4">
                    <input
                      type="checkbox"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      className="mr-2"
                    />
                    <span>Mark as Paid</span>
                  </div>
                  {isPaid && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="number"
                        value={receivedAmount}
                        onChange={(e) => setReceivedAmount(Number(e.target.value))}
                        placeholder="Enter received amount"
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        min="0"
                        required
                      />
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                  )}
                </div>
                {orderItems.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>No items added to order</p>
                    <p>Select items from the menu</p>
                  </div>
                ) : (
                  <div>
                    <table className="w-full text-sm">
                      <thead>
                      <tr className="bg-gray-200 dark:bg-gray-700">
                        <th className="py-2 px-4 text-left">Item</th>
                        <th className="py-2 px-4 text-left">Price</th>
                        <th className="py-2 px-4 text-center">Qty</th>
                        <th className="py-2 px-4 text-right">Total</th>
                        <th className="py-2 px-4"></th>
                      </tr>
                      </thead>
                      <tbody>
                      {orderItems.map((item) => (
                        <tr key={item.product_id} className="border-b">
                          <td className="py-2 px-4">{item.product?.name || `Product ${item.product_id}`}</td>
                          <td className="py-2 px-4">${(item.product?.price || 0).toFixed(2)}</td>
                          <td className="py-2 px-4 text-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product_id, Number(e.target.value))}
                              className="w-16 p-1 border rounded text-center"
                              min="1"
                            />
                          </td>
                          <td className="py-2 px-4 text-right">${(item.sub_total || 0).toFixed(2)}</td>
                          <td className="py-2 px-4 text-right">
                            <XMarkIcon
                              onClick={() => updateQuantity(item.product_id, 0)}
                              className="h-5 w-5 text-red-500 hover:text-red-700 cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                    <button
                      onClick={handleCreateOrder}
                      className="w-full mt-4 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600"
                      disabled={localLoading || (isPaid && receivedAmount < orderItems.reduce((sum, item) => sum + (item.sub_total || 0), 0))}
                    >
                      {localLoading ? 'Creating Order...' : 'Place Order'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
