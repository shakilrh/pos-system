import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  MoonIcon,
  SunIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const FallbackIcon = () => (
  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Local state for demo
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [chartPeriod, setChartPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [stats, setStats] = useState<any[]>([]);
  const [ordersSummary, setOrdersSummary] = useState<any>({});
  const [trendingMenu, setTrendingMenu] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] });

  useEffect(() => {
    setIsClient(true);
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats([
          { title: 'Total Orders', value: '1,234', change: '+5.2%', color: 'text-indigo-600 dark:text-indigo-400' },
          { title: 'Revenue Today', value: '$5,678', change: '+12.3%', color: 'text-green-600 dark:text-green-400' },
          { title: 'Active Orders', value: '12', change: '-1.4%', color: 'text-blue-600 dark:text-blue-400' },
          { title: 'New Customers', value: '89', change: '+8.7%', color: 'text-purple-600 dark:text-purple-400' },
        ]);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };

    const fetchRevenueData = async () => {
      try {
        setChartData({
          labels: chartPeriod === 'monthly'
            ? ['Jan', 'Feb', 'Mar', 'Apr', 'May']
            : chartPeriod === 'weekly'
            ? ['Week 1', 'Week 2', 'Week 3', 'Week 4']
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          datasets: [
            {
              label: 'Revenue',
              data: chartPeriod === 'monthly'
                ? [3000, 4500, 4000, 5000, 5678]
                : chartPeriod === 'weekly'
                ? [1200, 1800, 1500, 2000]
                : [500, 700, 600, 800, 900],
              borderColor: '#4f46e5',
              backgroundColor: 'rgba(79, 70, 229, 0.2)',
              fill: true,
              tension: 0.4,
            },
          ],
        });
      } catch (error) {
        console.error('Failed to fetch revenue data', error);
      }
    };

    const fetchOrdersSummary = async () => {
      try {
        setOrdersSummary({
          revenue: '$456,005.56',
          targetRevenue: '$800,000.00',
          onDelivery: 2.5,
          delivered: 60,
          cancelled: 7,
        });
      } catch (error) {
        console.error('Failed to fetch orders summary', error);
      }
    };

    const fetchTrendingMenu = async () => {
      try {
        setTrendingMenu([
          { id: 1, name: 'Medium Spicy Spaghetti Italiano', price: 5.6, orders: 89 },
          { id: 2, name: 'Watermelon Juice with Ice', price: 5.6, orders: 89 },
          { id: 3, name: 'Chicken Curry Special with Cucumber', price: 5.6, orders: 89 },
          { id: 4, name: 'Italiano Pizza with Garlic', price: 5.6, orders: 89 },
          { id: 5, name: 'Tuna Soup Spinach with Himalaya Salt', price: 5.6, orders: 89 },
        ].sort((a, b) => b.orders - a.orders).slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch trending menu', error);
      }
    };

    const fetchRecentOrders = async () => {
      try {
        setRecentOrders([
          { id: 'ORD001', customer: 'Ali Rehman', table: 'T5', total: '$89.50', status: 'Completed', date: '2025-05-19' },
          { id: 'ORD002', customer: 'Sidra Amjad', table: 'T3', total: '$45.20', status: 'Pending', date: '2025-05-19' },
          { id: 'ORD003', customer: 'Hassan Khan', table: 'T1', total: '$120.75', status: 'Completed', date: '2025-05-19' },
        ]);
      } catch (error) {
        console.error('Failed to fetch recent orders', error);
      }
    };

    const fetchNewOrders = async () => {
      try {
        setNewOrders([
          { id: 'ORD004', customer: 'Zara Ali', total: '$65.30', date: '2025-05-20' },
          { id: 'ORD005', customer: 'Omar Farooq', total: '$22.10', date: '2025-05-20' },
        ]);
      } catch (error) {
        console.error('Failed to fetch new orders', error);
      }
    };

    if (isAuthenticated) {
      fetchStats();
      fetchRevenueData();
      fetchOrdersSummary();
      fetchTrendingMenu();
      fetchRecentOrders();
      fetchNewOrders();
    }
  }, [isAuthenticated, chartPeriod]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      // Simulate login
      setIsAuthenticated(true);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#1f2937' },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.dataset.label}: $${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#1f2937' } },
      y: {
        grid: { color: '#e5e7eb' },
        ticks: { color: '#1f2937', beginAtZero: true },
      },
    },
  };

  if (!isClient) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your password"
                required
              />
            </div>
            {loginError && (
              <p className="text-sm text-red-500 dark:text-red-400">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-500 text-white p-2 rounded-lg hover:bg-indigo-600 transition-colors disabled:bg-indigo-300"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-5 bg-gray-100 dark:bg-gray-900">
      <div className="mb-3">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          Welcome back, Admin User!
        </h2>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
          Here's what's happening in your restaurant today.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
        {stats.map(({ title, value, change, color }) => (
          <div
            key={title}
            className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
            <p className={`text-lg md:text-xl font-bold mt-1 ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{change} from yesterday</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-2">
              Orders Summary
            </h2>
            <div className="flex items-center justify-between mb-2">
              <button
                className={`text-xs px-2 py-1 rounded-full ${chartPeriod === 'monthly' ? 'text-pink-500 border border-pink-500' : 'text-gray-500 hover:text-pink-500'}`}
                onClick={() => setChartPeriod('monthly')}
              >
                Monthly
              </button>
              <button
                className={`text-xs px-2 py-1 ${chartPeriod === 'weekly' ? 'text-pink-500 border border-pink-500 rounded-full' : 'text-gray-500 hover:text-pink-500'}`}
                onClick={() => setChartPeriod('weekly')}
              >
                Weekly
              </button>
              <button
                className={`text-xs px-2 py-1 ${chartPeriod === 'daily' ? 'text-pink-500 border border-pink-500 rounded-full' : 'text-gray-500 hover:text-pink-500'}`}
                onClick={() => setChartPeriod('daily')}
              >
                Today
              </button>
            </div>
            <div className="flex items-center justify-center relative w-28 h-28 mx-auto mb-2">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200 dark:text-gray-600"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-pink-500"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                  strokeDasharray="251.2"
                  strokeDashoffset="37.68"
                  transform="rotate(-90 50 50)"
                />
                <text
                  x="50"
                  y="55"
                  textAnchor="middle"
                  className="text-lg font-bold text-gray-900 dark:text-white"
                >
                  {((parseFloat(ordersSummary.revenue?.replace(/[$,]/g, '')) || 0) / (parseFloat(ordersSummary.targetRevenue?.replace(/[$,]/g, '')) || 1) * 100).toFixed(0)}%
                </text>
              </svg>
            </div>
            <div className="text-center mb-2">
              <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white">{ordersSummary.revenue}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">from {ordersSummary.targetRevenue}</p>
            </div>
            <div className="flex justify-between text-center">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{ordersSummary.onDelivery}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">On Delivery</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{ordersSummary.delivered}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Delivered</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{ordersSummary.cancelled}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cancelled</p>
              </div>
            </div>
            <button className="w-full mt-2 text-xs text-pink-500 border border-pink-500 rounded-full px-3 py-1 hover:bg-pink-500 hover:text-white transition-colors">
              More Details
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-2">
              Daily Trending Menu
            </h2>
            <div className="space-y-2">
              {trendingMenu.map(({ id, name, price, orders }, index) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ${price.toFixed(2)} Order {orders}x
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                Revenue Overview
              </h2>
              <div className="flex space-x-2">
                <button
                  className={`text-xs px-2 py-1 rounded-full ${chartPeriod === 'monthly' ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:text-indigo-500'}`}
                  onClick={() => setChartPeriod('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={`text-xs px-2 py-1 rounded-full ${chartPeriod === 'weekly' ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:text-indigo-500'}`}
                  onClick={() => setChartPeriod('weekly')}
                >
                  Weekly
                </button>
                <button
                  className={`text-xs px-2 py-1 rounded-full ${chartPeriod === 'daily' ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:text-indigo-500'}`}
                  onClick={() => setChartPeriod('daily')}
                >
                  Daily
                </button>
              </div>
            </div>
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-2">
              Recent Orders
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">
                    <th className="py-2 px-2">Order ID</th>
                    <th className="py-2 px-2">Customer</th>
                    <th className="py-2 px-2">Table</th>
                    <th className="py-2 px-2">Total</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(({ id, customer, table, total, status, date }) => (
                    <tr
                      key={id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <td className="py-2 px-2 text-gray-800 dark:text-gray-200">{id}</td>
                      <td className="py-2 px-2 text-gray-800 dark:text-gray-200">{customer}</td>
                      <td className="py-2 px-2 text-gray-800 dark:text-gray-200">{table}</td>
                      <td className="py-2 px-2 text-gray-800 dark:text-gray-200">{total}</td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'Completed' ? 'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100' : 'bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100'}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-800 dark:text-gray-200">{date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-2">
              New Orders
            </h2>
            <div className="space-y-2">
              {newOrders.map(({ id, customer, total, date }) => (
                <div
                  key={id}
                  className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-1"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{customer}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{id} - {date}</p>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{total}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
