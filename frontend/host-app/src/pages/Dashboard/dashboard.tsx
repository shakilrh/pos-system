import React, { useState, useEffect } from 'react';
import { format, startOfDay, endOfDay, parseISO, eachDayOfInterval } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { getOrders } from '../../services/dashboardService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faClipboardList, faUtensils, faShoppingBag, faSearch, faClipboardCheck, faHashtag, faUser, faClipboard, faUserTie, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

interface Order {
  _id: string;
  customer_name?: string;
  waiter?: string | null;
  total_amount: number;
  status: string;
  order_number: string;
  createdAt: string;
  updatedAt: string;
  order_type: string;
  service_type?: string;
  items: {
    _id: string;
    product_id: {
      _id: string;
      name: string;
      pictureUrl?: string;
      price: number;
    };
    quantity: number;
    sub_total: number;
  }[];
}

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
      if (item.product_id && item.product_id._id) {
        const productId = item.product_id._id;
        if (!itemCounts[productId]) {
          itemCounts[productId] = {
            name: item.product_id.name || 'Unknown',
            orders: 0,
            image: item.product_id.pictureUrl || ''
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

// Function to get currency symbol
const getCurrencySymbol = (currency: string) => {
  const symbols = {
    pkr: '₨',
    dollar: '$',
    euro: '€'
  };
  return symbols[currency as keyof typeof symbols] || '₨';
};

// Function to format price with currency
const formatPrice = (price: number, currency: string) => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${price.toLocaleString()}`;
};

const StatsSection = ({ stats, activeCurrency }: { stats: { title: string; value: string; icon: React.ReactNode; color: string; bgColor: string; gradient: string }[]; activeCurrency: string }) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
          <div key={index} className={`relative overflow-hidden rounded-xl p-6 text-white shadow-lg ${stat.gradient} transform hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
            <div className="relative z-10 flex items-center justify-between h-full">
              <div className="flex flex-col justify-center">
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
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

const SalesOverview = ({ salesData, activeCurrency }: { salesData: { time: string; value: number }[]; activeCurrency: string }) => {
  return (
      <div className="bg-[var(--background-secondary)] rounded-xl shadow-xl p-6 border border-[var(--border-color)] hover:shadow-2xl transition-all duration-300">
        <h3 className="text-lg font-bold text-[var(--text-color)] mb-4 flex items-center">
          <span className="w-3 h-3 bg-[var(--primary-color)] rounded-full mr-3"></span>
          Sales Trend
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorValueSecondary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  tickMargin={8}
              />
              <YAxis
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  tickMargin={8}
              />
              <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px',
                    color: 'var(--text-color)',
                  }}
                  formatter={(value: number) => [formatPrice(value, activeCurrency), 'Sales']}
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
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#colorValue)"
                  fillOpacity={1}
                  dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: 'var(--background-secondary)' }}
                  activeDot={{ r: 6, fill: '#3B82F6', strokeWidth: 2, stroke: 'var(--background-secondary)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {salesData.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-[var(--text-secondary)]">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-sm">No sales data available</div>
              </div>
            </div>
        )}
      </div>
  );
};

const RevenueSection = ({ totalSales, orders, activeCurrency }: { totalSales: number; orders: Order[]; activeCurrency: string }) => {
  const orderTypeData = getOrderTypeData(orders);
  const COLORS = ['#10B981', '#EF4444'];

  return (
      <div className="bg-[var(--background-secondary)] rounded-xl shadow-xl p-6 border border-[var(--border-color)] hover:shadow-2xl transition-all duration-300">
        <h3 className="text-base font-bold text-[var(--text-color)] mb-3 flex items-center">
          <span className="w-2 h-2 bg-[var(--primary-color)] rounded-full mr-2"></span>
          Revenue by Order Type
        </h3>
        <div className="text-center mb-2">
          <div className="text-xl font-bold text-[var(--text-color)] mb-1" key={`total-revenue-${activeCurrency}`}>
            {formatPrice(totalSales, activeCurrency)}
          </div>
          <div className="text-xs text-[var(--text-secondary)] font-medium">Total Revenue</div>
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
                  formatter={(value: number) => [formatPrice(value, activeCurrency), 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'var(--background-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    color: 'var(--text-color)',
                  }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-1">
          {orderTypeData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-1 bg-[var(--surface-color)] rounded-md">
                <div className="flex items-center">
                  <div
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="font-medium text-[var(--text-color)] text-xs">{entry.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--text-color)] text-xs" key={`order-type-${entry.name}-${activeCurrency}`}>
                    {formatPrice(entry.value, activeCurrency)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {totalSales > 0 ? ((entry.value / totalSales) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              </div>
          ))}
        </div>
      </div>
  );
};

const TopSellingItems = ({ orders }: { orders: Order[] }) => {
  const itemMap: Record<string, { id: string; name: string; image: string; sold: number }> = {};

  if (Array.isArray(orders)) {
    orders.forEach(order => {
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          const product = item?.product_id;
          if (product?._id) {
            if (!itemMap[product._id]) {
              itemMap[product._id] = {
                id: product._id,
                name: product.name || "Unnamed",
                image: product.pictureUrl || "/placeholder.png",
                sold: 0,
              };
            }
            itemMap[product._id].sold += item?.quantity || 0;
          }
        });
      }
    });
  }

  const items = Object.values(itemMap).sort((a, b) => b.sold - a.sold);

  return (
      <div className="bg-[var(--background-secondary)] rounded-xl shadow-xl p-6 border border-[var(--border-color)] hover:shadow-2xl transition-all duration-300">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-[var(--text-color)] flex items-center">
            <span className="w-2 h-2 bg-[var(--primary-color)] rounded-full mr-2"></span>
            Top Items
          </h3>
        </div>
        {items.length > 0 ? (
            <div className="space-y-2">
              {items.slice(0, 3).map((item, index) => (
                  <div
                      key={item.id}
                      className="flex items-center p-2 hover:bg-[var(--surface-color)] rounded-md transition-colors duration-200"
                  >
                    <div className="relative">
                      <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 rounded-md object-cover shadow-sm"
                      />
                      <div className="absolute -top-1 -right-1 bg-[var(--primary-color)] text-[var(--sidebar-text)] text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="font-semibold text-[var(--text-color)] text-sm">
                        {item.name}
                      </h4>
                      <p className="text-[var(--text-secondary)] text-xs">
                        {item.sold} sold
                      </p>
                    </div>
                  </div>
              ))}
            </div>
        ) : (
            <div className="text-center py-4 text-[var(--text-secondary)]">
              <div className="text-2xl mb-1">🍽️</div>
              <div className="text-xs">No items data available</div>
            </div>
        )}
      </div>
  );
};

const RoleList = ({ roles }: { roles: { _id: string; name: string; permissions: { _id: string; key: string; description: string }[] }[] }) => (
    <div className="bg-[var(--background-secondary)] rounded-xl shadow-xl p-6 border border-[var(--border-color)] hover:shadow-2xl transition-all duration-300">
      <h3 className="text-base font-bold text-[var(--text-color)] mb-3 flex items-center">
        <span className="w-2 h-2 bg-[var(--primary-color)] rounded-full mr-2"></span>
        User Roles
      </h3>
      <div className="space-y-2">
        {roles.map((role) => (
            <div key={role._id} className="p-3 bg-[var(--surface-color)] rounded-md border border-[var(--border-color)]">
              <h4 className="font-semibold text-[var(--text-color)] text-sm mb-1">{role.name}</h4>
              <div className="flex items-center text-xs text-[var(--text-secondary)]">
            <span className="bg-[var(--primary-color)]/20 text-[var(--primary-color)] px-2 py-1 rounded-full font-medium text-xs">
              {role.permissions.length} Permissions
            </span>
              </div>
            </div>
        ))}
      </div>
      {roles.length === 0 && (
          <div className="text-center py-4 text-[var(--text-secondary)]">
            <div className="text-2xl mb-1">👥</div>
            <div className="text-xs">No roles data available</div>
          </div>
      )}
    </div>
);

const OrderStatusChart = ({ orders }: { orders: Order[] }) => {
  const data = getOrderStatusData(orders);
  const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444'];

  return (
      <div className="bg-[var(--background-secondary)] rounded-xl shadow-xl p-6 border border-[var(--border-color)] hover:shadow-2xl transition-all duration-300">
        <h3 className="text-base font-bold text-[var(--text-color)] mb-3 flex items-center">
          <span className="w-2 h-2 bg-[var(--primary-color)] rounded-full mr-2"></span>
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
                    backgroundColor: 'var(--background-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                    color: 'var(--text-color)',
                  }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {data.map((entry, index) => (
              <div key={index} className="flex items-center p-1 bg-[var(--surface-color)] rounded-md">
                <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <div>
                  <div className="text-xs font-medium text-[var(--text-color)]">{entry.name}</div>
                  <div className="text-xs font-bold text-[var(--text-color)]">{entry.value}</div>
                </div>
              </div>
          ))}
        </div>
      </div>
  );
};

const WaiterPerformanceChart = ({ orders, activeCurrency }: { orders: Order[]; activeCurrency: string }) => {
  const completedOrders = orders.filter(order => order.status === 'completed');

  const waiterStats = completedOrders.reduce((acc, order) => {
    const waiterName = order.waiter || 'N/A';
    if (!acc[waiterName]) {
      acc[waiterName] = {
        name: waiterName,
        count: 0,
        totalAmount: 0
      };
    }
    acc[waiterName].count += 1;
    acc[waiterName].totalAmount += order.total_amount;
    return acc;
  }, {} as Record<string, { name: string; count: number; totalAmount: number }>);

  const data = Object.values(waiterStats).sort((a, b) => b.count - a.count);
  const totalOrders = completedOrders.length;
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'];

  return (
      <div className="bg-[var(--background-secondary)] rounded-xl shadow-xl p-6 border border-[var(--border-color)] hover:shadow-2xl transition-all duration-300 h-96 w-full flex flex-col">
        <h3 className="text-base font-bold text-[var(--text-color)] mb-3 flex items-center">
          <span className="w-2 h-2 bg-[var(--primary-color)] rounded-full mr-2"></span>
          Waiter Performance
        </h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  tickMargin={5}
                  interval={0}
              />
              <YAxis
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  tickMargin={8}
              />
              <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--background-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px',
                    color: 'var(--text-color)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Orders') return [`${value} (${Math.round((value / totalOrders) * 100)}%)`, 'Orders'];
                    return [formatPrice(value, activeCurrency), 'Revenue'];
                  }}
              />
              <Bar
                  dataKey="count"
                  name="Orders"
                  radius={[4, 4, 0, 0]}
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
        {data.length === 0 && (
            <div className="flex items-center justify-center h-32">
              <div className="text-center text-[var(--text-secondary)]">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-sm">No waiter performance data available</div>
              </div>
            </div>
        )}
      </div>
  );
};

const CompletedOrdersTable = ({
                                orders,
                                onSearch,
                                activeCurrency,
                              }: {
  orders: Order[];
  onSearch: (term: string) => void;
  activeCurrency: string;
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const completedOrders = orders.filter(
      (order) =>
          order.status === "completed" &&
          (!searchTerm ||
              (order.waiter &&
                  order.waiter.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (order.customer_name &&
                  order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
      <div className="bg-[var(--background-secondary)] rounded-xl shadow-xl p-6 border border-[var(--border-color)] hover:shadow-2xl transition-all duration-300 h-96 w-full flex flex-col">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <h3 className="text-base font-bold text-[var(--text-color)] flex items-center">
            <span className="w-2 h-2 bg-[var(--primary-color)] rounded-full mr-2"></span>
            Completed Orders
            <span className="ml-2 px-2 py-1 rounded-full text-xs font-bold bg-[var(--primary-color)] text-[var(--sidebar-text)]">
            {completedOrders.length}
          </span>
          </h3>
          <div className="relative w-full md:w-64">
            <input
                type="text"
                placeholder="Search waiter or customer..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-9 pr-4 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-all duration-200"
            />
            <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-3 text-[var(--text-secondary)]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-[var(--border-color)]">
            <thead className="bg-[var(--surface-color)] sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Order #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Waiter
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Items
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                Completed At
              </th>
            </tr>
            </thead>
            <tbody className="bg-[var(--background-secondary)] divide-y divide-[var(--border-color)]">
            {completedOrders.length > 0 ? (
                completedOrders.map((order, index) => (
                    <tr
                        key={order._id}
                        className={`hover:bg-[var(--surface-color)] transition-colors duration-150 ${
                            index % 2 === 0
                                ? "bg-[var(--background-secondary)]"
                                : "bg-[var(--surface-color)]"
                        }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[var(--text-color)]">
                        <div className="flex items-center">
                      <span className="p-1 rounded mr-2 bg-[var(--primary-color)] text-[var(--sidebar-text)]">
                        <FontAwesomeIcon icon={faHashtag} className="text-xs" />
                      </span>
                          {order.order_number}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-color)]">
                        <div className="flex items-center">
                      <span className="p-1 rounded-full mr-2 bg-[var(--primary-color)] text-[var(--sidebar-text)]">
                        <FontAwesomeIcon icon={faUser} className="text-xs" />
                      </span>
                          {order.waiter || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-color)]">
                        {order.customer_name || "N/A"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-color)]">
                        <div className="flex items-center">
                          {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="flex items-center mr-2">
                                <img
                                    src={
                                        item?.product_id?.pictureUrl ||
                                        "/placeholder.png"
                                    }
                                    alt={item?.product_id?.name || "Unknown"}
                                    className="w-6 h-6 rounded-full object-cover mr-1 border border-[var(--border-color)]"
                                />
                                <span className="text-xs bg-[var(--surface-color)] px-1 rounded">
                            {item.quantity}x
                          </span>
                              </div>
                          ))}
                          {order.items.length > 2 && (
                              <span className="text-xs text-[var(--text-secondary)] bg-[var(--surface-color)] px-2 py-1 rounded-full">
                          +{order.items.length - 2}
                        </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-[var(--text-color)]">
                    <span
                        className="px-2 py-1 rounded-full bg-[var(--primary-color)] text-[var(--sidebar-text)]"
                        key={`order-amount-${order._id}-${activeCurrency}`}
                    >
                      {formatPrice(order.total_amount, activeCurrency)}
                    </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                        {format(new Date(order.updatedAt), "MMM d, h:mm a")}
                      </td>
                    </tr>
                ))
            ) : (
                <tr>
                  <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-[var(--text-secondary)]"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FontAwesomeIcon
                          icon={faClipboard}
                          className="text-3xl mb-2"
                      />
                      <p>No completed orders found</p>
                      {searchTerm && (
                          <button
                              onClick={() => setSearchTerm("")}
                              className="mt-2 text-sm hover:underline text-[var(--primary-color)]"
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

// Main Dashboard Component
const Dashboard = () => {
  const { isAuthenticated, isLoading, token, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [roles, setRoles] = useState<{ _id: string; name: string; permissions: { _id: string; key: string; description: string }[] }[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCurrency, setActiveCurrency] = useState('pkr');

  // Function to get current currency
  const getCurrentCurrency = () => {
    const domCurrency = document.documentElement.getAttribute('data-currency');
    const storedCurrency = localStorage.getItem('appCurrency');
    return domCurrency || storedCurrency || 'pkr';
  };

  // Initialize and listen for currency changes
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      console.log('Dashboard: Received currency change event:', event.detail);
      const newCurrency = event.detail.currency;
      if (newCurrency && newCurrency !== activeCurrency) {
        setActiveCurrency(newCurrency);
        console.log('Dashboard: Currency updated to:', newCurrency);
      }
    };

    const handleSettingsLoaded = (event: CustomEvent) => {
      console.log('Dashboard: Received settings loaded event:', event.detail);
      const newCurrency = event.detail.currency;
      if (newCurrency) {
        setActiveCurrency(newCurrency);
        console.log('Dashboard: Currency loaded as:', newCurrency);
      }
    };

    const handleForceRerender = (event: CustomEvent) => {
      console.log('Dashboard: Received force rerender event:', event.detail);
      if (event.detail.type === 'currency') {
        const newCurrency = event.detail.value;
        setActiveCurrency(newCurrency);
        console.log('Dashboard: Currency force updated to:', newCurrency);
      }
    };

    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    window.addEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
    window.addEventListener('forceRerender', handleForceRerender as EventListener);

    const initialCurrency = getCurrentCurrency();
    if (initialCurrency !== activeCurrency) {
      console.log('Dashboard: Setting initial currency to:', initialCurrency);
      setActiveCurrency(initialCurrency);
    }

    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
      window.removeEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
      window.removeEventListener('forceRerender', handleForceRerender as EventListener);
    };
  }, [activeCurrency]);

  useEffect(() => {
    console.log('Dashboard: Active currency is now:', activeCurrency);
    console.log('Dashboard: Currency symbol:', getCurrencySymbol(activeCurrency));
  }, [activeCurrency]);

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
        const [rawOrders, roleData] = await Promise.all([
          getOrders(token, logout),
          fetch('http://192.168.18.37:3000/rolepermission/api/v1/roles/list', {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.json()).then(data => data.data.data)
        ]);

        // Safely transform API response to match local Order interface
        const orderData: Order[] = rawOrders.map((order: any) => ({
          ...order,
          items: (order.items || []).map((item: any) => {
            const product = item.product || {};
            return {
              _id: item._id ?? '',
              product_id: {
                _id: product._id ?? '',
                name: product.name ?? 'Unknown',
                pictureUrl: product.pictureUrl ?? '/placeholder.png',
                price: product.price ?? 0,
              },
              quantity: item.quantity ?? 0,
              sub_total: item.sub_total ?? 0,
            };
          }),
        }));

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


  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[var(--error-color)]">{error}</div>
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
      value: formatPrice(totalSales, activeCurrency),
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
      <div className="min-h-screen bg-[var(--background-color)] p-4">
        <div className="max-w-none mx-0">
          <div className="bg-[var(--background-secondary)] rounded-lg shadow-md p-4 mb-4 border border-[var(--border-color)]">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
              <div className="mb-3 lg:mb-0">
                <h1 className="text-2xl font-bold text-[var(--text-color)]">POS Dashboard</h1>
                <p className="text-[var(--text-secondary)] mt-1 text-sm">Welcome back! Here's what's happening today.</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--text-secondary)] mb-2">
                  {format(new Date(), 'PPPP')} • {format(new Date(), 'p')}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <input
                        type="date"
                        value={format(startDate, 'yyyy-MM-dd')}
                        onChange={(e) => setStartDate(parseISO(e.target.value))}
                        className="px-3 py-1 bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-md text-xs text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-colors duration-200 w-full cursor-pointer"
                        onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                    />
                    <FontAwesomeIcon
                        icon={faCalendarAlt}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          input.showPicker();
                        }}
                    />
                  </div>
                  <div className="relative">
                    <input
                        type="date"
                        value={format(endDate, 'yyyy-MM-dd')}
                        onChange={(e) => setEndDate(parseISO(e.target.value))}
                        className="px-3 py-1 bg-[var(--background-secondary)] border border-[var(--border-color)] rounded-md text-xs text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-colors duration-200 w-full cursor-pointer"
                        onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                    />
                    <FontAwesomeIcon
                        icon={faCalendarAlt}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          input.showPicker();
                        }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <StatsSection stats={stats} activeCurrency={activeCurrency} />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
            <SalesOverview salesData={salesData} activeCurrency={activeCurrency} />
            <RevenueSection totalSales={totalSales} orders={filteredOrders} activeCurrency={activeCurrency} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <TopSellingItems orders={filteredOrders} />
            <RoleList roles={roles} />
            <OrderStatusChart orders={filteredOrders} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
            <div className="xl:col-span-1">
              <WaiterPerformanceChart orders={filteredOrders} activeCurrency={activeCurrency} />
            </div>
            <div className="xl:col-span-2">
              <CompletedOrdersTable orders={filteredOrders} onSearch={(term) => console.log(term)} activeCurrency={activeCurrency} />
            </div>
          </div>
        </div>
      </div>
  );
};

export default Dashboard;