import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { createOrder, getAllOrders, processPayment } from '../services/orderService';
import { fetchProducts } from '../services/productService';
import { fetchCategories } from '../services/categoryService';
import { MagnifyingGlassIcon, XMarkIcon, PrinterIcon } from '@heroicons/react/24/outline';
import FlashMessage from './FlashMessage';

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
  time_required?: number; // in minutes
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
  order_number: number;
  createdAt: string;
  status: string;
  payment_status: string;
  estimated_preparation_time?: number; // in minutes
}

const OrderDetailsTemplate = ({
                                customerName,
                                setCustomerName,
                                serviceType,
                                setServiceType,
                                receivedAmount,
                                setReceivedAmount,
                                paymentMethod,
                                setPaymentMethod,
                                orderItems,
                                setOrderItems,
                                calculateTotalOrderAmount,
                                calculateEstimatedTime,
                                handleCreateOrder,
                                localLoading,
                              }: {
  customerName: string;
  setCustomerName: (name: string) => void;
  serviceType: 'dine_in' | 'take_away';
  setServiceType: (type: 'dine_in' | 'take_away') => void;
  receivedAmount: number;
  setReceivedAmount: (amount: number) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  calculateTotalOrderAmount: () => number;
  calculateEstimatedTime: () => number;
  handleCreateOrder: () => void;
  localLoading: boolean;
}) => {
  const totalAmount = calculateTotalOrderAmount();
  const estimatedTime = calculateEstimatedTime();
  const showPayment = serviceType === 'take_away';

  return (
    <div className="lg:w-1/3 w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Order Details</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
          <input
            type="text"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200 border-gray-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value as 'dine_in' | 'take_away')}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
          >
            <option value="dine_in">Dine-In</option>
            <option value="take_away">Takeaway</option>
          </select>
        </div>

        {showPayment && (
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Amount *</label>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(Number(e.target.value))}
                min={totalAmount}
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                placeholder={`Minimum: $${totalAmount.toFixed(2)}`}
              />
              {receivedAmount < totalAmount && receivedAmount > 0 && (
                <p className="text-red-500 text-xs mt-1">Amount must be at least ${totalAmount.toFixed(2)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-semibold">Order Summary</h3>
          {orderItems.length === 0 ? (
            <p className="text-gray-500">No items added to the order</p>
          ) : (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                <tr className="border-b">
                  <th className="py-2 px-4">Item</th>
                  <th className="py-2 px-4">Qty</th>
                  <th className="py-2 px-4">Price</th>
                  <th className="py-2 px-4">Total</th>
                  <th className="py-2 px-4">Action</th>
                </tr>
                </thead>
                <tbody>
                {orderItems.map((item, index) => (
                  <tr key={item.product_id} className="border-b">
                    <td className="py-2 px-4">{item.product?.name || `Product ${item.product_id}`}</td>
                    <td className="py-2 px-4">{item.quantity}</td>
                    <td className="py-2 px-4">${(item.product?.price || 0).toFixed(2)}</td>
                    <td className="py-2 px-4">${(item.sub_total || 0).toFixed(2)}</td>
                    <td className="py-2 px-4">
                      <XMarkIcon
                        onClick={() => setOrderItems(orderItems.filter((_, i) => i !== index))}
                        className="h-5 w-5 text-red-500 cursor-pointer hover:text-red-700"
                      />
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td colSpan={3} className="py-2 px-4 text-right">Total</td>
                  <td className="py-2 px-4">${totalAmount.toFixed(2)}</td>
                  <td></td>
                </tr>
                </tbody>
              </table>
              {estimatedTime > 0 && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Estimated Preparation Time:</span> {estimatedTime} minutes
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleCreateOrder}
          disabled={localLoading || orderItems.length === 0 || !customerName.trim() || (showPayment && receivedAmount < totalAmount)}
          className={`w-full py-2 rounded-lg transition-all duration-200 ${
            localLoading || orderItems.length === 0 || !customerName.trim() || (showPayment && receivedAmount < totalAmount)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-500 text-white hover:bg-indigo-600'
          }`}
        >
          {localLoading ? 'Processing Order...' : showPayment ? 'Confirm Order & Process Payment' : 'Confirm Order'}
        </button>
      </div>
    </div>
  );
};

const MenuItemsTemplate = ({
                             searchTerm,
                             setSearchTerm,
                             selectedCategory,
                             setSelectedCategory,
                             categories,
                             filteredProducts,
                             addProductToOrder,
                           }: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  categories: Category[];
  filteredProducts: Product[];
  addProductToOrder: (product: Product) => void;
}) => {
  return (
    <div className="lg:w-2/3 w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Menu Items</h2>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
        />
        {searchTerm && (
          <XMarkIcon
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3 h-5 w-5 text-gray-500 cursor-pointer hover:text-gray-700"
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
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
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            onClick={() => addProductToOrder(product)}
            className="bg-white rounded-lg p-2 flex flex-col items-center cursor-pointer border border-gray-200 hover:shadow-sm hover:scale-105 transition-all duration-200"
            style={{ minHeight: '140px', minWidth: '120px' }}
          >
            <img
              src={product.pictureUrl || 'https://via.placeholder.com/96'}
              alt={product.name}
              className="w-20 h-20 object-cover rounded-md mb-2"
            />
            <span className="text-sm font-semibold text-gray-800 text-center">{product.name}</span>
            <span className="text-sm text-green-600">${product.price.toFixed(2)}</span>
            {product.time_required && (
              <span className="text-xs text-blue-600">{product.time_required} min</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ReceiptTemplate = ({
                           createdOrder,
                           onPrint,
                           onClose,
                           changeAmount,
                         }: {
  createdOrder: Order;
  onPrint: () => void;
  onClose: () => void;
  changeAmount: number;
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 text-center">Order Confirmed</h2>
        <div className="border-b pb-4 mb-4">
          <p><strong>Order #:</strong> {createdOrder.order_number}</p>
          <p><strong>Customer:</strong> {createdOrder.customer_name}</p>
          <p><strong>Type:</strong> {createdOrder.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</p>
          <p><strong>Status:</strong> {createdOrder.status.replace('_', ' ')}</p>
          <p><strong>Payment:</strong> {createdOrder.payment_status}</p>
          {createdOrder.estimated_preparation_time && (
            <p><strong>Est. Prep Time:</strong> {createdOrder.estimated_preparation_time} minutes</p>
          )}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Items:</h3>
          <table className="w-full text-sm">
            <thead>
            <tr className="border-b">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
            </thead>
            <tbody>
            {createdOrder.items.map((item) => (
              <tr key={item.product_id} className="border-b">
                <td className="py-1">{item.product.name}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">${item.product.price.toFixed(2)}</td>
                <td className="text-right py-1">${item.sub_total.toFixed(2)}</td>
              </tr>
            ))}
            </tbody>
          </table>
          <div className="mt-2 pt-2 border-t">
            <p className="font-bold text-right">Total: ${createdOrder.total_amount.toFixed(2)}</p>
            {changeAmount > 0 && (
              <p className="text-right text-green-600">Change: ${changeAmount.toFixed(2)}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-between gap-2">
          <button
            onClick={onPrint}
            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            <PrinterIcon className="w-5 h-5 inline-block mr-2" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

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

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !token || !user?._id) {
      router.push('/login');
      return;
    }

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
  }, [isAuthenticated, isLoading, token, user?._id, router, logout]);

  const validateForm = () => {
    let isValid = true;
    const totalAmount = calculateTotalOrderAmount();

    if (!customerName.trim()) {
      setFlashMessage({ message: 'Customer name is required', type: 'error' });
      isValid = false;
    } else if (orderItems.length === 0) {
      setFlashMessage({ message: 'Please add at least one product', type: 'error' });
      isValid = false;
    } else if (serviceType === 'take_away' && receivedAmount < totalAmount) {
      setFlashMessage({ message: `Received amount must be at least $${totalAmount.toFixed(2)}`, type: 'error' });
      isValid = false;
    }
    return isValid;
  };

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

  const calculateEstimatedTime = () => {
    // Sum up preparation time for all items (quantity * time_required)
    return orderItems.reduce((totalTime, item) => {
      const productTime = item.product?.time_required || 0;
      return totalTime + (productTime * item.quantity);
    }, 0);
  };

  useEffect(() => {
    const total = calculateTotalOrderAmount();
    if (serviceType === 'take_away' && (receivedAmount === 0 || receivedAmount < total)) {
      setReceivedAmount(total);
    }
  }, [orderItems, serviceType]);

  const handleCreateOrder = async () => {
    if (!token || !user?._id) {
      setFlashMessage({ message: 'Please log in to create order', type: 'error' });
      router.push('/login');
      return;
    }

    if (!validateForm()) {
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
        estimated_preparation_time: calculateEstimatedTime(),
        status: serviceType === 'take_away' ? 'confirmed' : 'pending',
      };

      setCreatedOrder(updatedOrder);
      setShowReceipt(true);
      setFlashMessage({ message: 'Order created successfully', type: 'success' });
      await getAllOrders(token, logout);
    } catch (error) {
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
              .header { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
              .subheader { font-size: 16px; font-weight: bold; margin: 10px 0; }
              .total-row { font-weight: bold; border-top: 2px solid #000; }
              .prep-time { background-color: #f0f8ff; padding: 5px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px; }
              hr { border: none; border-top: 1px solid #000; margin: 10px 0; }
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
            <p>Status: ${createdOrder.status}</p>
            <p>Payment: ${createdOrder.payment_status}</p>
            ${createdOrder.estimated_preparation_time ?
        `<div class="prep-time">
                <strong>Estimated Preparation Time:</strong><br/>
                ${createdOrder.estimated_preparation_time} minutes
              </div>` : ''
      }
            <hr />
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

  if (isLoading || localLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      {flashMessage && (
        <FlashMessage
          message={flashMessage.message}
          type={flashMessage.type}
          onClose={() => setFlashMessage(null)}
        />
      )}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        <OrderDetailsTemplate
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
          calculateEstimatedTime={calculateEstimatedTime}
          handleCreateOrder={handleCreateOrder}
          localLoading={localLoading}
        />

        <MenuItemsTemplate
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          filteredProducts={filteredProducts}
          addProductToOrder={addProductToOrder}
        />
      </div>

      {showReceipt && createdOrder && (
        <ReceiptTemplate
          createdOrder={createdOrder}
          onPrint={handlePrintReceipt}
          onClose={handleCloseReceipt}
          changeAmount={changeAmount}
        />
      )}
    </div>
  );
}
