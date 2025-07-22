import React, { useState, useEffect, useRef } from 'react';
import { format, startOfDay, endOfDay, parseISO, eachDayOfInterval } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { getOrders } from '../../services/dashboardService';
import { Order } from '../../services/dashboardService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faClipboardList,
  faUtensils,
  faShoppingBag,
  faSearch,
  faClipboardCheck,
  faHashtag,
  faUser,
  faClipboard,
  faUserTie,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

// Utility functions
const toPKT = (date: Date): Date => {
  const pktOffset = 5 * 60 * 60 * 1000;
  return new Date(date.getTime() + pktOffset);
};

const getStartDate = (startDate: Date, endDate: Date): { start: Date; end: Date } => {
  return { start: startOfDay(startDate), end: endOfDay(endDate) };
};

const getSalesData = (orders: Order[], start: Date, end: Date): { time: string; value: number }[] => {
  const days = eachDayOfInterval({ start, end });
  const salesByDay: { [key: string]: number } = {};
  orders.forEach(order => {
    const orderDate = toPKT(new Date(order.createdAt));
    const dayKey = format(orderDate, 'MMM d');
    salesByDay[dayKey] = (salesByDay[dayKey] || 0) + order.total_amount;
  });
  return days.map(day => ({ time: format(day, 'MMM d'), value: salesByDay[format(day, 'MMM d')] || 0 })).filter(d => d.value > 0 || days.length <= 1);
};

const getTopSellingItems = (orders: Order[], limit: number) => {
  const itemCounts: { [key: string]: { name: string; orders: number; image: string } } = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      if (item.product && item.product._id) {
        const productId = item.product._id;
        if (!itemCounts[productId]) {
          itemCounts[productId] = {
            name: item.product.name || 'Unknown',
            orders: 0,
            image: item.product.pictureUrl || ''
          };
        }
        itemCounts[productId].orders += item.quantity;
      }
    });
  });
  return Object.values(itemCounts)
    .sort((a, b) => b.orders - a.orders)
    .slice(0, limit);
};

const getOrderStatusData = (orders: Order[]) => {
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });
  return [
    { name: 'Pending', value: statusCounts['pending'] || 0 },
    { name: 'Processing', value: statusCounts['processing'] || 0 },
    { name: 'Served', value: statusCounts['served'] || 0 },
    { name: 'Completed', value: statusCounts['completed'] || 0 },
    { name: 'Cancelled', value: statusCounts['cancelled'] || 0 },
  ];
};

const getOrderTypeData = (orders: Order[]) => {
  const typeCounts = orders.reduce((acc, order) => {
    acc[order.order_type] = (acc[order.order_type] || 0) + order.total_amount;
    return acc;
  }, {} as { [key: string]: number });
  return [
    { name: 'Online', value: typeCounts['online'] || 0 },
    { name: 'Physical', value: typeCounts['physical'] || 0 },
  ];
};

const StatsSection = ({ stats }: { stats: { title: string; value: string; icon: React.ReactNode; color: string; bgColor: string; gradient: string }[] }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {stats.map((stat, index) => (
      <div key={index} className={`relative overflow-hidden rounded-xl p-4 text-white shadow-lg ${stat.gradient} transform hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
        <div className="relative z-10 flex items-center justify-between h-full">
          <div className="flex flex-col justify-center">
            <div className="text-2xl font-bold mb-1">{stat.value.replace('PKR', '$')}</div>
            <p className="text-white/90 text-xs font-semibold uppercase tracking-wide">{stat.title}</p>
          </div>
          <div className="flex items-center justify-center opacity-80">
            <div className="text-4xl text-white/80">{stat.icon}</div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-black/10 rounded-full -ml-6 -mb-6"></div>
      </div>
    ))}
  </div>
);

const SalesOverview = ({ salesData }: { salesData: { time: string; value: number }[] }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <span className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></span>
        Sales Trend
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickMargin={8}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickMargin={8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '13px',
                color: '#111827',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#colorValue)"
              fillOpacity={1}
              dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#FFFFFF' }}
              activeDot={{ r: 6, fill: '#6366F1', strokeWidth: 2, stroke: '#FFFFFF' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {salesData.length === 0 && (
        <div className="flex items-center justify-center h-32">
          <div className="text-center text-gray-500">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-sm">No sales data available</div>
          </div>
        </div>
      )}
    </div>
  );
};

const RevenueSection = ({ totalSales, orders }: { totalSales: number; orders: Order[] }) => {
  const orderTypeData = getOrderTypeData(orders);
  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
        Revenue by Order Type
      </h3>
      <div className="text-center mb-2">
        <div className="text-xl font-bold text-gray-800 mb-1">${totalSales.toLocaleString()}</div>
        <div className="text-xs text-gray-500 font-medium">Total Revenue</div>
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={orderTypeData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {orderTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
                color: '#111827',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 space-y-1">
        {orderTypeData.map((entry, index) => (
          <div key={index} className="flex items-center justify-between p-1 bg-gray-50 rounded-md">
            <div className="flex items-center">
              <div
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="font-medium text-gray-800 text-xs">{entry.name}</span>
            </div>
            <div className="text-right">
              <div className="font-bold text-gray-800 text-xs">${entry.value.toLocaleString()}</div>
              <div className="text-xs text-gray-500">
                {totalSales > 0 ? ((entry.value / totalSales) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TopSellingItems = ({ items }: { items: { name: string; orders: number; image: string }[] }) => (
  <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-base font-bold text-gray-800 flex items-center">
        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
        Top Items
      </h3>
      <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium transition-colors duration-200">
        View All
      </button>
    </div>
    <div className="space-y-2">
      {items.slice(0, 3).map((item, index) => (
        <div key={index} className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors duration-200">
          <div className="relative">
            <img
              src={item.image}
              alt={item.name}
              className="w-10 h-10 rounded-md object-cover shadow-sm"
            />
            <div className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {index + 1}
            </div>
          </div>
          <div className="ml-3 flex-1">
            <h4 className="font-semibold text-gray-800 text-sm">{item.name}</h4>
            <p className="text-gray-500 text-xs">{item.orders} orders</p>
          </div>
        </div>
      ))}
    </div>
    {items.length === 0 && (
      <div className="text-center py-4 text-gray-500">
        <div className="text-2xl mb-1">🍽️</div>
        <div className="text-xs">No items data available</div>
      </div>
    )}
  </div>
);

const RoleList = ({ roles }: { roles: { _id: string; name: string; permissions: { _id: string; key: string; description: string }[] }[] }) => (
  <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
    <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
      User Roles
    </h3>
    <div className="space-y-2">
      {roles.map((role) => (
        <div key={role._id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="font-semibold text-gray-800 text-sm mb-1">{role.name}</h4>
          <div className="flex items-center text-xs text-gray-500">
            <span className="bg-indigo-500/20 text-indigo-600 px-2 py-1 rounded-full font-medium text-xs">
              {role.permissions.length} Permissions
            </span>
          </div>
        </div>
      ))}
    </div>
    {roles.length === 0 && (
      <div className="text-center py-4 text-gray-500">
        <div className="text-2xl mb-1">👥</div>
        <div className="text-xs">No roles data available</div>
      </div>
    )}
  </div>
);

const OrderStatusChart = ({ orders }: { orders: Order[] }) => {
  const data = getOrderStatusData(orders);
  const COLORS = ['#F59E0B', '#10B981', '#6366F1', '#8B5CF6', '#EF4444'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
        <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
        Order Status
      </h3>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [value, 'Orders']}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
                color: '#111827',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center p-1 bg-gray-50 rounded-md">
            <div
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></div>
            <div>
              <div className="text-xs font-medium text-gray-800">{entry.name}</div>
              <div className="text-xs font-bold text-gray-800">{entry.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WaiterPerformanceChart = ({ orders }: { orders: Order[] }) => {
  const completedOrders = orders.filter(order => order.status === 'completed');

  const waiterStats = completedOrders.reduce((acc, order) => {
    if (order.waiter_name) {
      const waiterName = order.waiter_name || 'N/A';
      if (!acc[waiterName]) {
        acc[waiterName] = {
          name: waiterName,
          count: 0,
          totalAmount: 0
        };
      }
      acc[waiterName].count += 1;
      acc[waiterName].totalAmount += order.total_amount;
    }
    return acc;
  }, {} as Record<string, { name: string; count: number; totalAmount: number }>);

  const data = Object.values(waiterStats).sort((a, b) => b.count - a.count);
  const totalOrders = completedOrders.length;
  const COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#F59E0B', '#10B981'];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 h-full">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <FontAwesomeIcon icon={faUserTie} className="text-indigo-500 mr-2" />
        Waiter Performance
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 12, fill: '#111827' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '13px',
                color: '#111827',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Orders') return [`${value} (${Math.round((value / totalOrders) * 100)}%)`, 'Orders'];
                return [`$${value}`, 'Revenue'];
              }}
            />
            <Bar
              dataKey="count"
              name="Orders"
              radius={[0, 4, 4, 0]}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
const CompletedOrdersTable = ({ orders, onSearch }: { orders: Order[], onSearch: (term: string) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const completedOrders = orders.filter(order =>
    order.status === 'completed' &&
    (!searchTerm ||
      (order.waiter_name && order.waiter_name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 h-[400px] flex flex-col">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <FontAwesomeIcon icon={faClipboardCheck} className="text-emerald-500 mr-2" />
          Completed Orders
          <span className="ml-2 bg-emerald-500/20 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full">
            {completedOrders.length}
          </span>
        </h3>
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search waiter..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
          />
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-3 text-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waiter</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed At</th>
          </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
          {completedOrders.length > 0 ? (
            completedOrders.map((order, index) => (
              <tr
                key={order._id}
                className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800">
                  <div className="flex items-center">
                      <span className="bg-indigo-500/10 text-indigo-500 p-1 rounded mr-2">
                        <FontAwesomeIcon icon={faHashtag} className="text-xs" />
                      </span>
                    {order.order_number}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                  <div className="flex items-center">
                      <span className="bg-purple-500/10 text-purple-500 p-1 rounded-full mr-2">
                        <FontAwesomeIcon icon={faUser} className="text-xs" />
                      </span>
                    {order.waiter_name || 'N/A'}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                  {order.customer_name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                  <div className="flex items-center">
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center mr-2">
                        <img
                          src={item.product.pictureUrl}
                          alt={item.product.name}
                          className="w-6 h-6 rounded-full object-cover mr-1 border border-gray-200"
                        />
                        <span className="text-xs bg-gray-100 px-1 rounded">{item.quantity}x</span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          +{order.items.length - 2}
                        </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800">
                    <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full">
                      ${order.total_amount}
                    </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(order.updatedAt), 'MMM d, h:mm a')}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <FontAwesomeIcon icon={faClipboard} className="text-3xl mb-2 text-gray-400" />
                  <p>No completed orders found</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-2 text-indigo-500 text-sm hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


const Dashboard = () => {
  const { isAuthenticated, isLoading, token, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [roles, setRoles] = useState<{ _id: string; name: string; permissions: { _id: string; key: string; description: string }[] }[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/pos-system/login';
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setError('Please log in to view dashboard');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [orderData, roleData] = await Promise.all([
          getOrders(token, logout),
          fetch('http://192.168.18.107:3000/rolepermission/api/v1/roles/list', {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.json()).then(data => data.data.data)
        ]);
        setOrders(orderData);
        setRoles(roleData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, token, logout]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleWaiterSearch = (term: string) => {
    setSearchTerm(term);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const { start, end } = getStartDate(startDate, endDate);
  const filteredOrders = orders.filter(order => new Date(order.createdAt) >= start && new Date(order.createdAt) <= end);
  const totalSales = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const ordersProcessed = filteredOrders.filter(order => order.status === 'completed').length;
  const salesData = getSalesData(filteredOrders, start, end);
  const topSellingItemsData = getTopSellingItems(filteredOrders, 4);

  const stats = [
    {
      title: 'Total Sales',
      value: `$${totalSales.toLocaleString()}`,
      icon: <FontAwesomeIcon icon={faChartLine} />,
      color: 'text-white',
      bgColor: 'bg-cyan-500',
      gradient: 'bg-gradient-to-br from-cyan-400 to-cyan-600'
    },
    {
      title: 'Orders Done',
      value: ordersProcessed.toString(),
      icon: <FontAwesomeIcon icon={faClipboardList} />,
      color: 'text-white',
      bgColor: 'bg-green-500',
      gradient: 'bg-gradient-to-br from-green-400 to-green-600'
    },
    {
      title: 'Dine-In',
      value: filteredOrders.filter(o => o.service_type === 'dine_in').length.toString(),
      icon: <FontAwesomeIcon icon={faUtensils} />,
      color: 'text-white',
      bgColor: 'bg-yellow-500',
      gradient: 'bg-gradient-to-br from-yellow-400 to-orange-500'
    },
    {
      title: 'Takeaway',
      value: filteredOrders.filter(o => o.service_type === 'take_away').length.toString(),
      icon: <FontAwesomeIcon icon={faShoppingBag} />,
      color: 'text-white',
      bgColor: 'bg-red-500',
      gradient: 'bg-gradient-to-br from-red-400 to-red-600'
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white shadow-sm mb-6 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <div className="mb-3 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-800">POS Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-2">
              {format(new Date(), 'PPPP')} • {format(new Date(), 'p')}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 w-full"
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-500" />
                  {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                </button>
                {showDatePicker && (
                  <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-30 p-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="date"
                        value={format(startDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                          setStartDate(parseISO(e.target.value));
                        }}
                        className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="date"
                        value={format(endDate, 'yyyy-MM-dd')}
                        onChange={(e) => {
                          setEndDate(parseISO(e.target.value));
                        }}
                        className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StatsSection stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <SalesOverview salesData={salesData} />
        <RevenueSection totalSales={totalSales} orders={filteredOrders} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <TopSellingItems items={topSellingItemsData} />
        <RoleList roles={roles} />
        <OrderStatusChart orders={filteredOrders} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <WaiterPerformanceChart orders={filteredOrders} />
        </div>
        <div className="lg:col-span-2">
          <CompletedOrdersTable
            orders={filteredOrders}
            onSearch={handleWaiterSearch}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
