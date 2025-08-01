import React, { useState, useEffect } from 'react';
import { Order } from './orderTypes';
import PaymentModal, { OrderSearch } from './paymentModal';
import OrderNotifications from './orderNotifications';
import {
  markOrderAsReady,
  markOrderAsServed,
  markOrderAsCompleted,
  markNotificationAsRead,
  QueueOrder,
} from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
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
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';

interface OrderListProps {
  orders: Order[];
  page: number;
  itemsPerPage: number;
  totalPages: number;
  setPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  setSortConfig: (config: { key: string; direction: 'asc' | 'desc' } | null) => void;
  preparationTime: number;
  setPreparationTime: (time: number) => void;
  message: string;
  setMessage: (message: string) => void;
  token: string | null;
  logout: () => void;
  onViewDetails: (order: Order) => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  queueData: QueueOrder[] | any;
  currentCurrency?: string;
}

const OrderModal = ({ order, token, logout, onClose, setOrders, orders, setMessage, activeTab, currentCurrency = 'pkr' }: any) => {
  const [isLoading, setIsLoading] = useState(false);

  // Function to get currency symbol based on current currency
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
    return `${symbol}${price.toFixed(2)}`;
  };

  const handleMarkAsReady = async () => {
    if (!token) {
      setMessage('Please log in.');
      return;
    }
    setIsLoading(true);
    try {
      const updatedOrder = await markOrderAsReady(token, logout, order.order_number);
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.order_number === updatedOrder.order_number ? { ...updatedOrder, items: o.items } : o
        )
      );
      setMessage(`Order #${order.order_number} is now ready!`);
      onClose();
    } catch (error) {
      setMessage(`Failed to mark order as ready`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsServed = async () => {
    if (!token) {
      setMessage('Please log in.');
      return;
    }
    setIsLoading(true);
    try {
      const updatedOrder = await markOrderAsServed(token, logout, order.order_number);
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.order_number === updatedOrder.order_number ? { ...updatedOrder, items: o.items } : o
        )
      );
      setMessage(`Order #${order.order_number} is now served!`);
      onClose();
    } catch (error) {
      setMessage(`Failed to mark order as served`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="rounded-lg p-6 max-w-sm w-full mx-4" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>Order #{order.order_number}</h2>
        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>👤 {order.customer_name || 'Guest'}</p>
        {order.table_number && <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--info-light)', padding: '2px 8px', borderRadius: '9999px' }}>Table: {order.table_number}</p>}
        {order.waiter_name && <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--primary-light)', padding: '2px 8px', borderRadius: '9999px' }}>Waiter: {order.waiter_name}</p>}
        {order.linked_orders?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {order.linked_orders.map((linkedOrder, index) => (
              <span key={index} className="text-sm px-2 py-0.5 rounded-full" style={{ backgroundColor: index % 2 === 0 ? 'var(--warning-light)' : 'var(--success-light)', color: 'var(--text-color)' }}>
                Linked: {linkedOrder}
              </span>
            ))}
          </div>
        )}
        <div className="space-y-2 mb-4">
          {order.items?.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{item.product?.name || 'Unknown'}</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>x{item.quantity}</span>
            </div>
          )) || <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No items</div>}
          {(activeTab === 'completed' || activeTab === 'cancelled') && (
            <div className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>
              Total: {formatPrice(order.total_amount || 0, currentCurrency)}
            </div>
          )}
        </div>
        {activeTab === 'to_be_prepared' && (
          <button
            onClick={handleMarkAsReady}
            disabled={isLoading}
            className="w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'var(--text-on-primary)',
            }}
          >
            {isLoading ? 'Processing...' : 'Mark as Ready'}
          </button>
        )}
        {activeTab === 'ready' && (
          <button
            onClick={handleMarkAsServed}
            disabled={isLoading}
            className="w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
            style={{
              backgroundColor: 'var(--success-color)',
              color: 'var(--text-on-primary)',
            }}
          >
            {isLoading ? 'Processing...' : 'Mark as Served'}
          </button>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
          style={{
            backgroundColor: 'var(--background-secondary)',
            color: 'var(--text-secondary)',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default function OrderList({
                                    orders,
                                    page,
                                    itemsPerPage,
                                    totalPages,
                                    setPage,
                                    setItemsPerPage,
                                    searchTerm,
                                    setSearchTerm,
                                    statusFilter,
                                    setStatusFilter,
                                    sortConfig,
                                    setSortConfig,
                                    preparationTime,
                                    setPreparationTime,
                                    message,
                                    setMessage,
                                    token,
                                    logout,
                                    onViewDetails,
                                    setOrders,
                                    queueData,
                                    currentCurrency = 'pkr',
                                  }: OrderListProps) {
  const { userPermissions } = useAuth();
  const [outerActiveTab, setOuterActiveTab] = useState('physical');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [queueCountdowns, setQueueCountdowns] = useState<{ [key: string]: number }>([]);
  const [blink, setBlink] = useState(false);
  const [selectedNotificationTab, setSelectedNotificationTab] = useState<string>('');
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [preparationSearchTerm, setPreparationSearchTerm] = useState('');
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeCurrency, setActiveCurrency] = useState(currentCurrency);

  // Function to get currency symbol based on current currency
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
    return `${symbol}${price.toFixed(2)}`;
  };

  // Function to get current currency from various sources
  const getCurrentCurrency = () => {
    const domCurrency = document.documentElement.getAttribute('data-currency');
    const storedCurrency = localStorage.getItem('appCurrency');
    return domCurrency || currentCurrency || storedCurrency || 'pkr';
  };

  // Update currency when prop changes
  useEffect(() => {
    setActiveCurrency(currentCurrency);
  }, [currentCurrency]);

  // Listen for currency changes from the app
  useEffect(() => {
    const handleCurrencyChange = (event: CustomEvent) => {
      const newCurrency = event.detail.currency;
      if (newCurrency && newCurrency !== activeCurrency) {
        setActiveCurrency(newCurrency);
      }
    };

    const handleSettingsLoaded = (event: CustomEvent) => {
      const newCurrency = event.detail.currency;
      if (newCurrency) {
        setActiveCurrency(newCurrency);
      }
    };

    const handleForceRerender = (event: CustomEvent) => {
      if (event.detail.type === 'currency') {
        const newCurrency = event.detail.value;
        setActiveCurrency(newCurrency);
      }
    };

    window.addEventListener('currencyChange', handleCurrencyChange as EventListener);
    window.addEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
    window.addEventListener('forceRerender', handleForceRerender as EventListener);

    const initialCurrency = getCurrentCurrency();
    if (initialCurrency !== activeCurrency) {
      setActiveCurrency(initialCurrency);
    }

    return () => {
      window.removeEventListener('currencyChange', handleCurrencyChange as EventListener);
      window.removeEventListener('settingsLoaded', handleSettingsLoaded as EventListener);
      window.removeEventListener('forceRerender', handleForceRerender as EventListener);
    };
  }, [activeCurrency]);

  const physicalTabs = [
    ...(userPermissions.includes('manage_prepared_orders') ? [{
      key: 'to_be_prepared',
      label: 'To Be Prepared',
      color: 'var(--primary-color)',
      lightColor: 'var(--primary-light)',
      textColor: 'var(--text-color)',
      borderColor: 'var(--primary-border)'
    }] : []),
    ...(userPermissions.includes('manage_ready_orders') ? [{
      key: 'ready',
      label: 'Ready',
      color: 'var(--success-color)',
      lightColor: 'var(--success-light)',
      textColor: 'var(--text-color)',
      borderColor: 'var(--success-border)'
    }] : []),
    ...(userPermissions.includes('manage_served_orders') ? [{
      key: 'served',
      label: 'Served',
      color: 'var(--info-color)',
      lightColor: 'var(--info-light)',
      textColor: 'var(--text-color)',
      borderColor: 'var(--info-border)'
    }] : []),
    ...(userPermissions.includes('manage_completed_orders') ? [{
      key: 'completed',
      label: 'Completed',
      color: 'var(--warning-color)',
      lightColor: 'var(--warning-light)',
      textColor: 'var(--text-color)',
      borderColor: 'var(--warning-border)'
    }] : []),
  ];

  const onlineTabs = [
    ...(userPermissions.includes('accept_onlineorders') ? [{
      key: 'pending',
      label: 'Pending',
      color: 'var(--warning-color)',
      lightColor: 'var(--warning-light)',
      textColor: 'var(--text-color)',
      borderColor: 'var(--warning-border)'
    }] : []),
    ...(userPermissions.includes('manage_prepared_orders') ? [{
      key: 'to_be_prepared',
      label: 'To Be Prepared',
      color: 'var(--primary-color)',
      lightColor: 'var(--primary-light)',
      textColor: 'var(--text-color)',
      borderColor: 'var(--primary-border)'
    }] : []),
    ...(userPermissions.includes('manage_ready_orders') ? [{
      key: 'ready',
      label: 'Ready',
      color: 'var(--success-color)',
      lightColor: 'var(--success-light)',
      textColor: 'var(--text-color)',
      borderColor: 'var(--success-border)'
    }] : []),
    ...(userPermissions.includes('manage_completed_orders') ? [{
      key: 'completed',
      label: 'Completed',
      color: 'var(--warning-color)',
      lightColor: 'var(--warning-light)',
      textColor: 'var(--text-color)',
      borderColor: 'var(--warning-border)'
    }] : []),
    ...(userPermissions.includes('manage_cancelled_orders') ? [{
      key: 'cancelled',
      label: 'Cancelled',
      color: 'var(--error-color)',
      lightColor: 'var(--error-light)',
      textColor: 'var(--text-color)',
      borderColor: 'var(--error-border)'
    }] : []),
  ];

  const outerTabs = [
    ...(physicalTabs.length > 0 ? [{ key: 'physical', label: 'Physical Orders', color: 'var(--primary-color)', lightColor: 'var(--primary-light)', textColor: 'var(--text-color)' }] : []),
    ...(onlineTabs.length > 0 ? [{ key: 'online', label: 'Online Orders', color: 'var(--success-color)', lightColor: 'var(--success-light)', textColor: 'var(--text-color)' }] : []),
  ];

  useEffect(() => {
    const tabs = outerActiveTab === 'physical' ? physicalTabs : onlineTabs;
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].key);
    }
  }, [userPermissions, outerActiveTab]);

  useEffect(() => {
    if (Array.isArray(queueData)) {
      const countdowns: { [key: string]: number } = {};
      queueData.forEach((item: QueueOrder) => {
        countdowns[item.order_number] = item.time_left * 60 || 0;
      });
      setQueueCountdowns(countdowns);
    }
  }, [queueData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueCountdowns((prev) => {
        const updated = { ...prev };
        const overdueOrders: string[] = [];
        Object.keys(updated).forEach((orderNumber) => {
          const order = orders.find((o) => o.order_number === orderNumber);
          if (updated[orderNumber] > 0) {
            updated[orderNumber] -= 1;
            if (updated[orderNumber] === 60 && order?.status.toLowerCase() === 'processing') {
              setMessage(`⚠️ Order #${orderNumber} needs to be ready in 1 minute!`);
            }
          } else if (updated[orderNumber] <= 0 && order?.status.toLowerCase() === 'processing') {
            overdueOrders.push(orderNumber);
            updated[orderNumber] = -1;
          }
        });
        if (overdueOrders.length > 0 && activeTab === 'to_be_prepared') {
          setMessage(`⏰ Overdue Orders: #${overdueOrders.join(', #')}!`);
          setBlink(true);
          setTimeout(() => setBlink(false), 500);
          setTimeout(() => setBlink(true), 1000);
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [orders, activeTab, setMessage]);

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), 5000);
      setMessageTimeout(timeout);
      return () => clearTimeout(timeout);
    }
  }, [message, setMessage]);

  const filteredOrdersByType = React.useMemo(
    () => orders.filter((order) => {
      const orderDate = new Date(order.order_date).toISOString().split('T')[0];
      const isToday = orderDate === selectedDate;
      const isCompletedOrCancelled = order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'cancelled';
      return (order.order_type === outerActiveTab || !order.order_type) && (!isCompletedOrCancelled || isToday);
    }),
    [orders, outerActiveTab, selectedDate]
  );

  const handlePaymentOrderSelect = (order: Order) => {
    setSelectedPaymentOrder(order);
    setShowPaymentModal(true);
  };

  const handlePreparationOrderSelect = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const groupedOrders = React.useMemo(() => {
    const groups: Record<string, Order[]> = {
      pending: [],
      to_be_prepared: [],
      ready: [],
      served: [],
      cancelled: [],
      completed: [],
    };

    filteredOrdersByType.forEach((order) => {
      const status = order.status.toLowerCase();
      if (status === 'pending' && outerActiveTab === 'online') groups.pending.push(order);
      else if (status === 'processing') groups.to_be_prepared.push(order);
      else if (status === 'ready') groups.ready.push(order);
      else if (status === 'served') groups.served.push(order);
      else if (status === 'cancelled') groups.cancelled.push(order);
      else if (status === 'completed') groups.completed.push(order);
    });

    Object.keys(groups).forEach((status) =>
      groups[status].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    );

    return groups;
  }, [filteredOrdersByType, outerActiveTab]);

  const filteredOrders = React.useMemo(() => {
    const ordersInActiveTab = groupedOrders[activeTab || ''] || [];
    let filtered = ordersInActiveTab;
    if (activeTab === 'to_be_prepared' || activeTab === 'pending') {
      filtered = ordersInActiveTab.filter(
        (order) =>
          order.customer_name?.toLowerCase().includes(preparationSearchTerm.toLowerCase()) ||
          order._id?.toLowerCase().includes(preparationSearchTerm.toLowerCase()) ||
          order.order_number.toString().includes(preparationSearchTerm.toLowerCase())
      );
    } else if (activeTab === 'ready' || activeTab === 'served') {
      filtered = ordersInActiveTab.filter(
        (order) =>
          order.customer_name?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
          order._id?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
          order.order_number.toString().includes(paymentSearchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [groupedOrders, activeTab, preparationSearchTerm, paymentSearchTerm]);

  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getTabUnreadCount = (tabKey: string): number => {
    const currentTabOrders = groupedOrders[tabKey] || [];
    return currentTabOrders.filter((order) => order.notification_status === 0).length;
  };

  const getTimeDisplay = (order: Order) => {
    const timeLeft = getQueueTimeLeft(order.order_number);
    if (timeLeft && order.status.toLowerCase() === 'processing') {
      return (
        <div
          className="flex items-center space-x-1 px-2 py-1 rounded-full border text-xs"
          style={{
            backgroundColor: timeLeft.isOverdue ? 'var(--error-light)' : timeLeft.isUrgent ? 'var(--warning-light)' : 'var(--primary-light)',
            borderColor: timeLeft.isOverdue ? 'var(--error-border)' : timeLeft.isUrgent ? 'var(--warning-border)' : 'var(--primary-border)',
            color: 'var(--text-color)',
          }}
        >
          <span className="font-medium" style={{ color: 'var(--text-color)' }}>
            {timeLeft.isOverdue ? '⏰ OVERDUE' : timeLeft.isUrgent ? '⚠️' : '⏰'} {timeLeft.formattedTime}
          </span>
          <span className="text-xs opacity-75" style={{ color: 'var(--text-secondary)' }}>| {timeLeft.estimatedTime}</span>
        </div>
      );
    }
    return null;
  };

  const getQueueTimeLeft = (orderNumber: string) => {
    if (!Array.isArray(queueData)) return null;
    const queueOrder = queueData.find((q: QueueOrder) => q.order_number === orderNumber);
    const countdown = queueCountdowns[orderNumber];
    const order = orders.find((o) => o.order_number === orderNumber);
    if (!queueOrder || countdown === undefined) return null;
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    const isOverdue = countdown < 0 && order?.status.toLowerCase() === 'processing';
    const isUrgent = countdown > 0 && countdown <= 60;
    return {
      minutes,
      seconds,
      isOverdue,
      isUrgent,
      estimatedTime: queueOrder.estimated_time || 'N/A',
      formattedTime: isOverdue ? 'OVERDUE' : countdown >= 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : '',
    };
  };

  const renderOrderItemImage = (item: any) =>
    item.product?.pictureUrl ? (
      <img src={item.product.pictureUrl} alt={item.product.name} className="w-8 h-8 object-cover rounded-md" />
    ) : (
      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-tertiary)' }}>
        <FontAwesomeIcon icon={faShoppingBag} className="text-base" />
      </div>

    );

  const getStatusBadge = (status: string) => {
    const [bgColor, textColor, borderColor] = ({
      pending: ['#ffe0b2', '#000', '#f57c00'],
      processing: ['#bbdefb', '#000', '#1976d2'],
      ready: ['#c8e6c9', '#000', '#388e3c'],
      served: ['#b3e5fc', '#000', '#0288d1'],
      cancelled: ['#ef9a9a', '#000', '#d32f2f'],
      completed: ['#fff9c4', '#000', '#fdd835'],
    })[status.toLowerCase()] || ['var(--background-secondary)', 'var(--text-secondary)', 'var(--border-color)'];
    return { backgroundColor: bgColor, color: textColor, borderColor };
  };

  const currentTab = (outerActiveTab === 'physical' ? physicalTabs : onlineTabs).find((tab) => tab.key === activeTab);

  const getMessageStyles = (message: string) => {
    const [borderColor, bgColor, textColor] =
      message.includes('Failed') || message.includes('Please log in')
        ? ['#dc2626', 'rgb(255,235,238)', '#d32f2f']
        : message.includes('Order #') && (message.includes('ready') || message.includes('served') || message.includes('completed'))
          ? ['#059669', 'rgb(232,245,233)', '#388e3c']
          : message.includes('Overdue') || message.includes('needs to be ready')
            ? ['#d97706', 'rgba(255,228,120,0.95)', '#ba7625']
            : ['var(--border-color)', 'var(--background-secondary)', 'var(--text-secondary)'];
    return { borderColor, backgroundColor: bgColor, color: textColor };
  };

  const handleNotificationClick = (tabKey: string) => {
    setSelectedNotificationTab(tabKey);
    setShowModal(true);
  };

  if (!userPermissions.some(perm => ['manage_prepared_orders', 'manage_ready_orders', 'manage_served_orders', 'manage_completed_orders', 'accept_onlineorders', 'manage_cancelled_orders'].includes(perm))) {
    return (
      <div className="text-center py-12 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        <div className="text-5xl mb-3" style={{ color: 'var(--text-tertiary)' }}>
          <FontAwesomeIcon icon={faClipboardList} />
        </div>

        <h3 className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No Access</h3>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>You do not have permission to view any orders.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 min-h-screen" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
      <div className="flex justify-between items-center">
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Orders: {filteredOrders.length}</div>
        {(activeTab === 'completed' || activeTab === 'cancelled') && (
          <div
            className="flex items-center px-4 py-2 rounded-lg border cursor-pointer transition-all duration-200"
            onClick={() => document.getElementById('order-date-picker')?.showPicker()}
            style={{
              backgroundColor: 'var(--background-color)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)',
            }}
          >
            <span className="text-sm mr-2" style={{ color: 'var(--text-secondary)' }}>
  <FontAwesomeIcon icon={faCalendarAlt} className="mr-1" />
  Select Date:
</span>

            <input
              id="order-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm border-0 focus:ring-0 cursor-pointer"
              style={{
                color: 'var(--text-color)',
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
            />
          </div>
        )}
      </div>

      {outerTabs.length > 0 && (
        <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex flex-wrap gap-2">
            {outerTabs.map((tab, index) => {
              const getOuterTabColors = (tabKey, tabIndex) => {
                if (tabKey === 'physical' || tabIndex === 0) {
                  return {
                    active: '#4285f4',
                    light: '#f0f7ff',
                    text: '#1a73e8',
                    gradient: 'linear-gradient(135deg, #4285f4 0%, #1976d2 100%)'
                  };
                } else {
                  return {
                    active: '#ffc107',
                    light: '#fffbf0',
                    text: '#ff8f00',
                    gradient: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)'
                  };
                }
              };

              const tabColors = getOuterTabColors(tab.key, index);

              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setOuterActiveTab(tab.key);
                    const tabs = tab.key === 'physical' ? physicalTabs : onlineTabs;
                    setActiveTab(tabs[0]?.key || null);
                    setPage(1);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105 min-w-[140px] ${
                    outerActiveTab === tab.key ? 'shadow-lg transform scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    background: outerActiveTab === tab.key ? tabColors.gradient : tabColors.light,
                    color: outerActiveTab === tab.key ? '#ffffff' : tabColors.text,
                    border: outerActiveTab === tab.key ? 'none' : `2px solid ${tabColors.active}20`
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="h-10">
        {message && (
          <div
            className={`p-2 rounded-lg shadow-sm border-l-4 h-full flex items-center text-sm ${blink && activeTab === 'to_be_prepared' ? 'animate-pulse' : ''}`}
            style={getMessageStyles(message)}
          >
            {message}
          </div>
        )}
      </div>

      {activeTab && (
        <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex flex-wrap gap-2">
            {(outerActiveTab === 'physical' ? physicalTabs : onlineTabs).map((tab, index) => {
              const ordersCount = groupedOrders[tab.key]?.length || 0;
              const unreadCount = getTabUnreadCount(tab.key);
              const tabsArray = outerActiveTab === 'physical' ? physicalTabs : onlineTabs;
              const isSingleTab = tabsArray.length === 1;

              const getTabColors = (tabKey) => {
                const colorMap = {
                  'pending': {
                    active: '#ff6b35',
                    light: '#fff5f2',
                    text: '#cc4125',
                    gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
                  },
                  'confirmed': {
                    active: '#4285f4',
                    light: '#f0f7ff',
                    text: '#1a73e8',
                    gradient: 'linear-gradient(135deg, #4285f4 0%, #1976d2 100%)'
                  },
                  'preparing': {
                    active: '#ff9800',
                    light: '#fff8f0',
                    text: '#e65100',
                    gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
                  },
                  'ready': {
                    active: '#9c27b0',
                    light: '#faf4ff',
                    text: '#7b1fa2',
                    gradient: 'linear-gradient(135deg, #9c27b0 0%, #8e24aa 100%)'
                  },
                  'completed': {
                    active: '#4caf50',
                    light: '#f1f8e9',
                    text: '#388e3c',
                    gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
                  },
                  'cancelled': {
                    active: '#f44336',
                    light: '#fff3f2',
                    text: '#d32f2f',
                    gradient: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
                  },
                  'shipped': {
                    active: '#00bcd4',
                    light: '#f0fdff',
                    text: '#0097a7',
                    gradient: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)'
                  },
                  'delivered': {
                    active: '#8bc34a',
                    light: '#f7fff0',
                    text: '#689f38',
                    gradient: 'linear-gradient(135deg, #8bc34a 0%, #689f38 100%)'
                  },
                  'default': {
                    active: '#607d8b',
                    light: '#f8f9fa',
                    text: '#455a64',
                    gradient: 'linear-gradient(135deg, #607d8b 0%, #455a64 100%)'
                  }
                };

                return colorMap[tabKey] || colorMap['default'];
              };

              const tabColors = getTabColors(tab.key);

              return (
                <div
                  key={tab.key}
                  className={`relative ${isSingleTab ? 'flex-none mx-auto' : 'flex-1'}`}
                  style={{
                    minWidth: isSingleTab ? '400px' : '140px',
                    maxWidth: isSingleTab ? '400px' : 'none'
                  }}
                >
                  <button
                    onClick={() => {
                      setActiveTab(tab.key);
                      setPage(1);
                    }}
                    className={`w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105 ${
                      activeTab === tab.key ? 'shadow-lg transform scale-105' : 'hover:scale-102'
                    }`}
                    style={{
                      background: activeTab === tab.key ? tabColors.gradient : tabColors.light,
                      color: activeTab === tab.key ? '#ffffff' : tabColors.text,
                      paddingRight: '3rem',
                      border: activeTab === tab.key ? 'none' : `2px solid ${tabColors.active}20`
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="font-semibold">{tab.label}</span>
                        <span
                          className="ml-3 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-sm"
                          style={{
                            backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : `${tabColors.active}15`,
                            color: activeTab === tab.key ? '#ffffff' : tabColors.active,
                            border: activeTab === tab.key ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${tabColors.active}30`
                          }}
                        >
                    {ordersCount}
                  </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick(tab.key);
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform z-10"
                      style={{
                        color: activeTab === tab.key ? 'rgba(255,255,255,0.8)' : tabColors.text
                      }}
                    >
                      <span className="text-lg">🔔</span>
                      {unreadCount > 0 && (
                        <span
                          className="absolute -top-1 -right-1 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold animate-pulse"
                          style={{
                            backgroundColor: '#e74c3c',
                            color: '#ffffff'
                          }}
                        >
                    {unreadCount}
                  </span>
                      )}
                    </button>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(activeTab === 'pending' && outerActiveTab === 'online') && (
        <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <OrderSearch
            orders={orders}
            onOrderSelect={handlePreparationOrderSelect}
            searchTerm={preparationSearchTerm}
            setSearchTerm={setPreparationSearchTerm}
            statusFilter="pending"
            style={{ backgroundColor: 'var(--background-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-color)', borderRadius: '0.375rem', padding: '0.5rem' }}
          />
        </div>
      )}

      {(activeTab === 'ready' || activeTab === 'served') && (
        <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
            {activeTab === 'ready' ? (
              <>
                <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
                Ready for Pickup
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faClipboardCheck} className="mr-2" />
                Process Payment
              </>
            )}
          </div>
          <div className="relative mb-2">
            <input
              type="text"
              value={paymentSearchTerm}
              onChange={(e) => setPaymentSearchTerm(e.target.value)}
              placeholder="Search by customer name, order number, or ID..."
              className="w-full p-2.5 border border-[var(--border-color)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-transparent bg-[var(--background-color)] text-[var(--text-color)]"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"
              />
            </svg>
          </div>
        </div>
      )}

      {showOrderModal && selectedOrder && (
        <OrderModal
          order={selectedOrder}
          token={token}
          logout={logout}
          onClose={() => setShowOrderModal(false)}
          setOrders={setOrders}
          orders={orders}
          setMessage={setMessage}
          activeTab={activeTab}
          currentCurrency={activeCurrency}
        />
      )}

      {showModal && (
        <OrderNotifications
          orders={orders}
          groupedOrders={groupedOrders}
          activeTab={selectedNotificationTab}
          tabs={outerActiveTab === 'physical' ? physicalTabs : onlineTabs}
          setActiveTab={setActiveTab}
          setPage={setPage}
          setShowModal={setShowModal}
          showModal={showModal}
          showOrderModal={showOrderModal}
          setShowOrderModal={setShowOrderModal}
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          setTimeLeft={setTimeLeft}
          token={token}
          logout={logout}
          setOrders={setOrders}
          setMessage={setMessage}
        />
      )}

      {outerActiveTab === 'physical' && activeTab && (
        <div className="space-y-2">
          {paginatedOrders.length > 0 ? (
            paginatedOrders.map((order) => (
              <div
                key={order._id}
                className={`rounded-lg shadow-sm border-l-4 transition-all duration-200 hover:shadow-md ${order.notification_status === 0 ? 'ring-2 ring-[var(--primary-light)]' : ''} p-3`}
                style={{ backgroundColor: 'var(--background-color)', borderColor: currentTab?.borderColor }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-lg" style={{ color: 'var(--text-color)' }}>#{order.order_number}</h3>
                        {order.notification_status === 0 && (
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--error-color)' }}></span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1 flex-wrap">
                        <span className="text-sm font-medium">
  <FontAwesomeIcon icon={faUser} className="mr-1" />
                          {order.customer_name || 'Guest'}
</span>

                        {order.service_type && (
                          <span className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--text-color)' }}>
  <FontAwesomeIcon icon={order.service_type === 'dine_in' ? faUtensils : faShoppingBag} />
                            {order.service_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}
</span>

                        )}
                        {order.table_number && (
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--info-light)', color: 'var(--text-color)' }}>
                            Table: {order.table_number}
                          </span>
                        )}
                        {order.waiter_name && (
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--text-color)' }}>
                            Waiter: {order.waiter_name}
                          </span>
                        )}
                        {order.linked_orders?.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                              Linked Orders:
                            </span>
                            <div className="flex gap-1">
                              {order.linked_orders.map((linkedOrder, index) => (
                                <div key={index} className="flex items-center space-x-1">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{
                                      backgroundColor: index % 4 === 0 ? 'var(--primary-color)' :
                                        index % 4 === 1 ? 'var(--success-color)' :
                                          index % 4 === 2 ? 'var(--warning-color)' : 'var(--info-color)'
                                    }}
                                  >
                                    <FontAwesomeIcon icon={faHashtag} className="text-xs" />
                                  </div>
                                  <span
                                    className="px-1 py-0.5 rounded text-xs font-medium"
                                    style={{
                                      backgroundColor: index % 4 === 0 ? 'var(--primary-light)' :
                                        index % 4 === 1 ? 'var(--success-light)' :
                                          index % 4 === 2 ? 'var(--warning-light)' : 'var(--info-light)',
                                      color: 'var(--text-color)'
                                    }}
                                  >
                                    #{linkedOrder}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center space-x-2 max-w-md overflow-x-auto">
                      {order.items?.length > 0 ? order.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-1 px-1 py-0.5 rounded-md border min-w-max"
                          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--background-secondary)' }}
                        >
                          {renderOrderItemImage(item)}
                          <div className="flex flex-col">
                            <span className="text-xs font-medium truncate max-w-20" style={{ color: 'var(--text-color)' }}>
                              {item.product?.name || 'Unknown'}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>x{item.quantity}</span>
                          </div>
                        </div>
                      )) : <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No items</div>}
                    </div>
                  </div>
                  <div className="flex items-end space-x-3">
                    {getTimeDisplay(order)}
                    <span className="px-2 py-1 rounded-full text-xs font-medium border" style={getStatusBadge(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: order.payment_status === 'paid' ? 'var(--success-light)' : 'var(--background-secondary)',
                        color: order.payment_status === 'paid' ? 'var(--text-success)' : 'var(--text-secondary)',
                        borderColor: order.payment_status === 'paid' ? 'var(--success-border)' : 'var(--border-color)',
                      }}
                    >
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                    {(activeTab === 'completed' || activeTab === 'cancelled') && (
                      <div className="flex flex-col items-end">
                        <div className="text-lg font-bold" style={{ color: 'var(--text-color)' }} key={`total-${order._id}-${activeCurrency}`}>
                          {formatPrice(order.total_amount || 0, activeCurrency)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{order.items?.length || 0} items</div>
                      </div>
                    )}
                    <div className="flex flex-col space-y-2">
                      {activeTab === 'to_be_prepared' && (
                          <button
                              onClick={async () => {
                                if (!token) {
                                  setMessage('Please log in to retry this action.');
                                  return;
                                }
                                setIsLoading(true);
                                try {
                                  const updatedOrder = await markOrderAsReady(token, logout, order.order_number);
                                  setOrders((prevOrders) =>
                                      prevOrders.map((o) =>
                                          o.order_number === updatedOrder.order_number ? { ...updatedOrder, items: o.items } : o
                                      )
                                  );
                                  setMessage(`✅ Order #${order.order_number} is now ready!`);
                                } catch (error) {
                                  setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to mark order as ready'}`);
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md ${isLoading ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed' : ''}`}
                              style={{
                                backgroundColor: isLoading ? undefined : 'var(--primary-color)',
                                color: isLoading ? 'var(--disabled-text)' : 'var(--text-on-primary)',
                                '--tw-ring-color': 'var(--focus-ring)',
                              }}
                              disabled={isLoading}
                          >
                            Mark as Ready
                          </button>
                      )}
                      {activeTab === 'ready' && (
                          <button
                              onClick={async () => {
                                if (!token) {
                                  setMessage('Please log in to retry this action.');
                                  return;
                                }
                                setIsLoading(true);
                                try {
                                  const updatedOrder = await markOrderAsServed(token, logout, order.order_number);
                                  setOrders((prevOrders) =>
                                      prevOrders.map((o) =>
                                          o.order_number === updatedOrder.order_number ? { ...updatedOrder, items: o.items } : o
                                      )
                                  );
                                  setMessage(`✅ Order #${order.order_number} is now served!`);
                                } catch (error) {
                                  setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to mark order as served'}`);
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md ${
                                  isLoading ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed' : ''
                              }`}
                              style={{
                                backgroundColor: isLoading ? undefined : 'var(--primary-color)',
                                color: isLoading ? 'var(--disabled-text)' : 'var(--text-on-primary)',
                                '--tw-ring-color': 'var(--focus-ring)',
                              }}
                              disabled={isLoading}
                          >
                            Mark as Served
                          </button>
                      )}
                      {activeTab === 'served' && (
                        <>
                          {order.payment_status === 'not_paid' && (
                            <button
                              onClick={() => handlePaymentOrderSelect(order)}
                              className="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md"
                              style={{
                                backgroundColor: 'var(--success-color)',
                                color: 'var(--text-on-primary)',
                              }}
                            >
                              Process Payment
                            </button>
                          )}
                          {order.payment_status === 'paid' && (
                              <button
                                  onClick={async () => {
                                    if (!token) {
                                      setMessage('Please log in to retry this action.');
                                      return;
                                    }
                                    setIsLoading(true);
                                    try {
                                      const updatedOrder = await markOrderAsCompleted(token, logout, order.order_number);
                                      setOrders((prevOrders) =>
                                          prevOrders.map((o) =>
                                              o.order_number === updatedOrder.order_number ? { ...updatedOrder, items: o.items } : o
                                          )
                                      );
                                      setMessage(`✅ Order #${order.order_number} is now completed!`);
                                    } catch (error) {
                                      setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to mark order as completed'}`);
                                    } finally {
                                      setIsLoading(false);
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md ${isLoading ? 'bg-[var(--disabled-bg)] text-[var(--disabled-text)] cursor-not-allowed' : ''}`}
                                  style={{
                                    backgroundColor: isLoading ? undefined : 'var(--primary-color)',
                                    color: isLoading ? 'var(--disabled-text)' : 'var(--text-on-primary)',
                                    '--tw-ring-color': 'var(--focus-ring)',
                                  }}
                                  disabled={isLoading}
                              >
                                Mark as Completed
                              </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
              <div className="text-5xl mb-3" style={{ color: 'var(--text-tertiary)' }}>
                <FontAwesomeIcon icon={faClipboardList} />
              </div>

              <h3 className="text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>No orders found</h3>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {preparationSearchTerm || paymentSearchTerm ? 'Try adjusting your search criteria.' : 'Orders will appear here when available.'}
              </p>
            </div>
          )}
        </div>
      )}

      {showPaymentModal && selectedPaymentOrder && (
        <PaymentModal
          order={selectedPaymentOrder}
          token={token}
          logout={logout}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPaymentOrder(null);
          }}
          setOrders={setOrders}
          orders={orders}
          setMessage={setMessage}
          currentCurrency={activeCurrency}
        />
      )}

      {outerActiveTab === 'physical' && filteredOrders.length > 0 && (
        <div className="mt-6 rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Showing {Math.min((page - 1) * itemsPerPage + 1, filteredOrders.length)}-
              {Math.min(page * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="p-2 text-sm rounded-lg border focus:ring-2 transition-all duration-200"
                style={{
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-color)',
                  borderColor: 'var(--border-color)',
                  outlineColor: 'var(--focus-ring)',
                }}
              >
                <option value={10}>10 per page</option>
                <option value={50}>50 per page</option>
                <option value={80}>80 per page</option>
              </select>
              <div className="flex space-x-1">
                <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 text-sm rounded-lg border disabled:opacity-50 transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor: page === 1 ? 'var(--background-secondary)' : 'var(--primary-color)',
                      color: page === 1 ? 'var(--text-secondary)' : 'var(--text-on-primary)',
                      borderColor: 'var(--border-color)',
                      '--tw-ring-color': 'var(--focus-ring)',
                    }}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, Math.ceil(filteredOrders.length / itemsPerPage)) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 hover:shadow-md ${
                        pageNumber === page ? 'shadow-md' : ''
                      }`}
                      style={{
                        backgroundColor: pageNumber === page ? currentTab?.color : 'var(--background-color)',
                        color: pageNumber === page ? 'var(--text-on-primary)' : 'var(--text-color)',
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                    onClick={() => setPage(Math.min(Math.ceil(filteredOrders.length / itemsPerPage), page + 1))}
                    disabled={page === Math.ceil(filteredOrders.length / itemsPerPage)}
                    className="px-3 py-2 text-sm rounded-lg border disabled:opacity-50 transition-all duration-200 hover:shadow-md"
                    style={{
                      backgroundColor: page === Math.ceil(filteredOrders.length / itemsPerPage) ? 'var(--background-secondary)' : 'var(--primary-color)',
                      color: page === Math.ceil(filteredOrders.length / itemsPerPage) ? 'var(--text-secondary)' : 'var(--text-on-primary)',
                      borderColor: 'var(--border-color)',
                      '--tw-ring-color': 'var(--focus-ring)',
                    }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { OrderListProps, QueueOrder };
