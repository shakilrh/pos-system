import React, { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay, parseISO, eachDayOfInterval } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { getOrders } from '../../services/dashboardService';
import { Order } from '../../services/dashboardService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faClipboardList, faUtensils, faShoppingBag } from '@fortawesome/free-solid-svg-icons';

// Utility functions
const toPKT = (date: Date): Date => {
  const pktOffset = 5 * 60 * 60 * 1000; // UTC+5
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
    { name: 'To Be Prepared', value: statusCounts['confirmed'] || 0 },
    { name: 'Ready', value: statusCounts['ready'] || 0 },
    { name: 'Picked', value: statusCounts['picked'] || 0 },
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

// Components
const StatsSection = ({ stats }: { stats: { title: string; value: string; icon: React.ReactNode; color: string; bgColor: string; gradient: string }[] }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {stats.map((stat, index) => (
      <div key={index} className={`relative overflow-hidden rounded-xl p-6 text-white shadow-lg ${stat.gradient} transform hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
        <div className="relative z-10 flex items-center justify-between h-full">
          <div className="flex flex-col justify-center">
            <div className="text-3xl font-bold mb-2">{stat.value.replace('PKR', '$')}</div>
            <p className="text-white/90 text-sm font-semibold uppercase tracking-wide">{stat.title}</p>
          </div>
          <div className="flex items-center justify-center opacity-80">
            <div className="text-5xl text-white/80">{stat.icon}</div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-black/10 rounded-full -ml-8 -mb-8"></div>
      </div>
    ))}
  </div>
);

const SalesOverview = ({ salesData }: { salesData: { time: string; value: number }[] }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
        Sales Trend
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorValueSecondary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e5e7eb" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#e5e7eb" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickMargin={8}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickMargin={8}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '13px'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="transparent"
              fill="url(#colorValueSecondary)"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#colorValue)"
              fillOpacity={1}
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
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
  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
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
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
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
              <span className="font-medium text-gray-700 text-xs">{entry.name}</span>
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
  <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-base font-bold text-gray-800 flex items-center">
        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
        Top Items
      </h3>

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
            <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
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
  <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
    <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
      User Roles
    </h3>
    <div className="space-y-2">
      {roles.map((role) => (
        <div key={role._id} className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-md border border-purple-100">
          <h4 className="font-semibold text-gray-800 text-sm mb-1">{role.name}</h4>
          <div className="flex items-center text-xs text-gray-600">
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium text-xs">
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
  const COLORS = ['#fbbf24', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
      <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center">
        <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
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
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
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
              <div className="text-xs font-medium text-gray-700">{entry.name}</div>
              <div className="text-xs font-bold text-gray-800">{entry.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { isAuthenticated, isLoading, token, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [roles, setRoles] = useState<{ _id: string; name: string; permissions: { _id: string; key: string; description: string }[] }[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const { start, end } = getStartDate(startDate, endDate);
  const filteredOrders = orders.filter(order => new Date(order.createdAt) >= start && new Date(order.createdAt) <= end);
  const totalSales = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const ordersProcessed = filteredOrders.filter(order => ['picked', 'ready'].includes(order.status)).length;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
            <div className="mb-3 lg:mb-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                POS Dashboard
              </h1>
              <p className="text-gray-600 mt-1 text-sm">Welcome back! Here's what's happening today.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 mb-2">
                {format(new Date(), 'PPPP')} • {format(new Date(), 'p')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setStartDate(parseISO(e.target.value))}
                  className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={format(endDate, 'yyyy-MM-dd')}
                  onChange={(e) => setEndDate(parseISO(e.target.value))}
                  className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <StatsSection stats={stats} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <SalesOverview salesData={salesData} />
          <RevenueSection totalSales={totalSales} orders={filteredOrders} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TopSellingItems items={topSellingItemsData} />
          <RoleList roles={roles} />
          <OrderStatusChart orders={filteredOrders} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
//test
