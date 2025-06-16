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

interface ApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  error?: string;
  type: number;
  data?: any;
}

export default function CreateOrder() {
  const { isAuthenticated, isLoading, token, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState('physical');
  const [message, setMessage] = useState<string>('');
  const [localLoading, setLocalLoading] = useState<boolean>(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
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
    if (!token) {
      setMessage('Please log in to create order');
      return;
    }
    if (orderItems.length === 0) {
      setMessage('Please add at least one product');
      return;
    }
    setLocalLoading(true);
    try {
      const items = orderItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));
      const response = await createOrder(token, logout, items, orderType);
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
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <body>
            <h1>Order Receipt</h1>
            <p>Order Number: ${createdOrder.order_number}</p>
            <p>Date: ${new Date(createdOrder.createdAt).toLocaleString()}</p>
            <p>Order Type: ${createdOrder.order_type}</p>
            <p>Total Amount: $${createdOrder.total_amount}</p>
            <h2>Items:</h2>
            <ul>
              ${orderItems.map(item => `<li>${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</li>`).join('')}
            </ul>
            <button onClick="window.print()">Print</button>
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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between">
        <h1>Create Restaurant Order</h1>
        <div>
          <button onClick={() => router.push('/orders')} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">Back to Orders</button>
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Logout</button>
        </div>
      </div>

      {message && (
        <div className="bg-red-100 text-red-700 p-2">{message}</div>
      )}

      <div className="flex">
        <div className="w-1/2 p-4">
          <h2>Select Menu Items</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2">
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">
            {categories.map(category => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
          </select>
          {filteredProducts.length === 0 ? (
            <p>No items found</p>
          ) : (
            filteredProducts.map(product => (
              <div key={product._id} className="border p-2 mb-2">
                <h3>{product.name}</h3>
                <p>Price: ${product.price.toFixed(2)}</p>
                <p>Stock: {product.stock}</p>
                <button onClick={() => addProductToOrder(product)} className={`mt-2 px-3 py-1 rounded-lg text-white ${product.stock === 0 ? 'bg-gray-400' : 'bg-indigo-500 hover:bg-indigo-600'}`} disabled={product.stock === 0}>Add to Order</button>
              </div>
            ))
          )}
          <div>
            <p>Order Type</p>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">
              <option value="physical">Dine-In/Takeout</option>
              <option value="online">Online Delivery</option>
            </select>
          </div>
        </div>
        <div className="w-1/2 p-4">
          <h2>Order Summary</h2>
          {orderItems.length === 0 ? (
            <p>No items added</p>
          ) : (
            <table>
              <thead>
                <tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr>
              </thead>
              <tbody>
                {orderItems.map(item => (
                  <tr key={item.product_id}>
                    <td>{item.name}</td><td>${item.price.toFixed(2)}</td>
                    <td><input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.product_id, Number(e.target.value))} className="w-16 border" min="0" /></td>
                    <td>${(item.price * item.quantity).toFixed(2)}</td>
                    <td><button onClick={() => updateQuantity(item.product_id, 0)} className="text-red-600">Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p>Total: ${calculateTotal()}</p>
          <button onClick={handleCreateOrder} className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg" disabled={localLoading}>{localLoading ? 'Creating...' : 'Place Order'}</button>
        </div>
      </div>

      {showReceipt && createdOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h2>Order Receipt</h2>
            <p>Order Number: {createdOrder.order_number}</p>
            <p>Date: {new Date(createdOrder.createdAt).toLocaleString()}</p>
            <p>Order Type: {createdOrder.order_type}</p>
            <p>Total Amount: ${createdOrder.total_amount}</p>
            <h3>Items:</h3>
            <ul>
              {orderItems.map((item, index) => (
                <li key={index}>{item.name} x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}</li>
              ))}
            </ul>
            <button onClick={handlePrintReceipt} className="bg-blue-500 text-white px-4 py-2 rounded-lg">Print Receipt</button>
            <button onClick={() => { setShowReceipt(false); setCreatedOrder(null); }} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
