import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/OrderService';
import { fetchCategories, fetchProducts } from '../services/ProductService';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category_id: string;
}

interface Category {
  _id: string;
  name: string;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  name: string;
  price: number;
}

interface Order {
  order_number: number;
  total_amount: number;
  service_type: 'dine_in' | 'take_away';
}

export default function CreateOrder() {
  const { isAuthenticated, isLoading, token, logout, user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [serviceType, setServiceType] = useState<'dine_in' | 'take_away'>('dine_in');
  const [message, setMessage] = useState<string>('');
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('name-asc');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (token) {
      fetchCategoriesData();
      fetchProductsData();
    }
  }, [isAuthenticated, isLoading, router, token]);

  const fetchCategoriesData = async () => {
    try {
      const fetchedCategories = await fetchCategories(token, logout);
      setCategories([{ _id: 'All', name: 'All Categories' }, ...fetchedCategories]);
    } catch (error) {
      setMessage('Failed to fetch categories');
    }
  };

  const fetchProductsData = async () => {
    setLocalLoading(true);
    try {
      const fetchedProducts = await fetchProducts(token, logout, categories);
      setProducts(fetchedProducts);
    } catch (error) {
      setMessage('Failed to fetch products');
      setProducts([]);
    } finally {
      setLocalLoading(false);
    }
  };

  const addProductToOrder = (product: Product) => {
    const existingItem = orderItems.find(item => item.product_id === product._id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setOrderItems(orderItems.map(item =>
          item.product_id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
    } else {
      setOrderItems([...orderItems, {
        product_id: product._id,
        quantity: 1,
        name: product.name,
        price: product.price
      }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p._id === productId);
    if (product && quantity >= 0) {
      if (quantity === 0) {
        setOrderItems(orderItems.filter(item => item.product_id !== productId));
      } else {
        setOrderItems(orderItems.map(item =>
          item.product_id === productId ? { ...item, quantity } : item
        ));
      }
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const handleCreateOrder = async () => {
    if (!token || !user?._id) {
      setMessage('Please log in to create order');
      return;
    }
    if (orderItems.length === 0) {
      setMessage('Please add at least one product');
      return;
    }

    setLocalLoading(true);
    try {
      const orderData = {
        user_id: user._id,
        created_by: user._id,
        total_amount: parseFloat(calculateTotal()),
        order_type: 'physical',
        payment_status: 'not_paid',
        received_amount: 0,
        service_type: serviceType,
      };
      const items = orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));
      const response = await createOrder(token, logout, items, orderData);
      setCreatedOrder(response);
      setShowReceipt(true);
      setMessage('Order created successfully');
      setOrderItems([]);
    } catch (error) {
      setMessage('Failed to create order');
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    const currentDate = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Karachi' });
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f9f9f9; }
              .receipt { max-width: 300px; margin: 0 auto; background: #fff; border: 2px dashed #000; padding: 20px; text-align: center; }
              .header { font-size: 24px; font-weight: bold; color: #d32f2f; margin-bottom: 10px; }
              .details { font-size: 14px; margin: 10px 0; }
              .items { text-align: left; margin: 15px 0; }
              .items ul { list-style: none; padding: 0; }
              .items li { margin: 5px 0; }
              .total { font-size: 18px; font-weight: bold; margin: 15px 0; }
              .footer { font-size: 12px; color: #555; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
              button { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
              button:hover { background: #45a049; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">Rasnat</div>
              <div class="details">Order #${createdOrder?.order_number}</div>
              <div class="details">Date & Time: ${currentDate}</div>
              <div class="details">Type: ${createdOrder?.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}</div>
              <div class="items">
                <ul>
                  ${orderItems.map(item => `<li>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`).join('')}
                </ul>
              </div>
              <div class="total">Total: $${createdOrder?.total_amount.toFixed(2)}</div>
              <div class="footer">Thank you for choosing Rasnat! Visit us again.</div>
              <button onClick="window.print()">Print Receipt</button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredProducts = products
    .filter(product =>
      (selectedCategory === 'All' || product.category_id === selectedCategory) &&
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const [key, direction] = sortBy.split('-');
      if (key === 'name') {
        return direction === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (key === 'price') {
        return direction === 'asc' ? a.price - b.price : b.price - a.price;
      }
      return 0;
    });

  if (isLoading || localLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Create Restaurant Order</h1>
        <div className="space-x-2">
          <button
            onClick={() => router.push('/orders')}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Orders
          </button>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Select Menu Items</h2>

          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(category => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as 'dine_in' | 'take_away')}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="dine_in">Dine-In</option>
              <option value="take_away">Takeaway</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items found</p>
            ) : (
              filteredProducts.map(product => (
                <div key={product._id} className="border p-3 rounded-lg hover:shadow transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-gray-600">${product.price.toFixed(2)}</p>
                      <p className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
                      </p>
                    </div>
                    <button
                      onClick={() => addProductToOrder(product)}
                      disabled={product.stock === 0}
                      className={`px-3 py-1 rounded-lg text-white ${product.stock === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'} transition-colors`}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="md:w-1/2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Order Summary</h2>

          {orderItems.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No items added</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 font-medium text-gray-600 pb-2 border-b">
                <div className="col-span-5">Item</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Qty</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-1"></div>
              </div>
              {orderItems.map(item => (
                <div key={item.product_id} className="grid grid-cols-12 gap-2 items-center py-1 border-b">
                  <div className="col-span-5">{item.name}</div>
                  <div className="col-span-2">${item.price.toFixed(2)}</div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product_id, Number(e.target.value))}
                      className="w-full p-1 border rounded"
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">${(item.price * item.quantity).toFixed(2)}</div>
                  <div className="col-span-1">
                    <button
                      onClick={() => updateQuantity(item.product_id, 0)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total:</span>
                  <span className="font-bold text-lg">${calculateTotal()}</span>
                </div>
              </div>
              <button
                onClick={handleCreateOrder}
                className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg mt-4 hover:bg-indigo-700 transition-colors"
                disabled={localLoading}
              >
                {localLoading ? 'Creating Order...' : 'Place Order'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showReceipt && createdOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Order Receipt</h2>
            <p className="mb-4">Order #{createdOrder.order_number} has been created successfully!</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handlePrintReceipt}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Print Receipt
              </button>
              <button
                onClick={() => { setShowReceipt(false); setCreatedOrder(null); }}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
//test
