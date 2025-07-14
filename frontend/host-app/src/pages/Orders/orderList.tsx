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
}

const OrderModal = ({ order, token, logout, onClose, setOrders, orders, setMessage, activeTab }: any) => {
  const [isLoading, setIsLoading] = useState(false);

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
        {order.table_number && <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Table: {order.table_number}</p>}
        <div className="space-y-2 mb-4">
          {order.items?.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{item.product?.name || 'Unknown'}</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>x{item.quantity}</span>
            </div>
          )) || <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No items</div>}
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
                                  }: OrderListProps) {
  const [outerActiveTab, setOuterActiveTab] = useState('physical');
  const [activeTab, setActiveTab] = useState('to_be_prepared');
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [queueCountdowns, setQueueCountdowns] = useState<{ [key: string]: number }>({});
  const [blink, setBlink] = useState(false);
  const [selectedNotificationTab, setSelectedNotificationTab] = useState<string>('');
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [preparationSearchTerm, setPreparationSearchTerm] = useState('');
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const outerTabs = [
    { key: 'physical', label: 'Physical Orders', color: 'var(--primary-color)', lightColor: 'var(--primary-light)', textColor: 'var(--text-color)' },
    { key: 'online', label: 'Online Orders', color: 'var(--success-color)', lightColor: 'var(--success-light)', textColor: 'var(--text-color)' },
  ];

  const physicalTabs = [
    { key: 'to_be_prepared', label: 'To Be Prepared', color: 'var(--primary-color)', lightColor: 'var(--primary-light)', textColor: 'var(--text-color)', borderColor: 'var(--primary-border)' },
    { key: 'ready', label: 'Ready', color: 'var(--success-color)', lightColor: 'var(--success-light)', textColor: 'var(--text-color)', borderColor: 'var(--success-border)' },
    { key: 'served', label: 'Served', color: 'var(--info-color)', lightColor: 'var(--info-light)', textColor: 'var(--text-color)', borderColor: 'var(--info-border)' },
    { key: 'completed', label: 'Completed', color: 'var(--warning-color)', lightColor: 'var(--warning-light)', textColor: 'var(--text-color)', borderColor: 'var(--warning-border)' },
  ];

  const onlineTabs = [
    { key: 'pending', label: 'Pending', color: 'var(--warning-color)', lightColor: 'var(--warning-light)', textColor: 'var(--text-color)', borderColor: 'var(--warning-border)' },
    { key: 'to_be_prepared', label: 'To Be Prepared', color: 'var(--primary-color)', lightColor: 'var(--primary-light)', textColor: 'var(--text-color)', borderColor: 'var(--primary-border)' },
    { key: 'ready', label: 'Ready', color: 'var(--success-color)', lightColor: 'var(--success-light)', textColor: 'var(--text-color)', borderColor: 'var(--success-border)' },
    { key: 'completed', label: 'Completed', color: 'var(--warning-color)', lightColor: 'var(--warning-light)', textColor: 'var(--text-color)', borderColor: 'var(--warning-border)' },
    { key: 'cancelled', label: 'Cancelled', color: 'var(--error-color)', lightColor: 'var(--error-light)', textColor: 'var(--text-color)', borderColor: 'var(--error-border)' },
  ];

  const tabs = outerActiveTab === 'physical' ? physicalTabs : onlineTabs;

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
    () => orders.filter((order) => order.order_type === outerActiveTab || !order.order_type),
    [orders, outerActiveTab]
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
    const ordersInActiveTab = groupedOrders[activeTab] || [];
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

  const mapStatusToTab = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'pending',
      processing: 'to_be_prepared',
      ready: 'ready',
      served: 'served',
      cancelled: 'cancelled',
      completed: 'completed',
    };
    return statusMap[status.toLowerCase()] || 'to_be_prepared';
  };

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
      <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm" style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-tertiary)' }}>📦</div>
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

  const currentTab = tabs.find((tab) => tab.key === activeTab);

  const getMessageStyles = (message: string) => {
    const [borderColor, bgColor, textColor] = message.includes('Failed') || message.includes('Please log in')
      ? ['#d32f2f', '#ef9a9a', '#fff']
      : message.includes('Order #') && (message.includes('ready') || message.includes('served') || message.includes('completed'))
        ? ['#388e3c', '#c8e6c9', '#fff']
        : message.includes('Overdue') || message.includes('needs to be ready')
          ? ['#f57c00', '#ffe0b2', '#000']
          : ['var(--border-color)', 'var(--background-secondary)', 'var(--text-secondary)'];
    return { borderColor, backgroundColor: bgColor, color: textColor };
  };

  const handleNotificationClick = (tabKey: string) => {
    setSelectedNotificationTab(tabKey);
    setShowModal(true);
  };

  return (
    <div className="space-y-3 p-3 min-h-screen" style={{ backgroundColor: 'var(--surface-color)', color: 'var(--text-color)' }}>
      <div className="flex justify-between items-center">
        <div className="text-sm" style={{ color: '#757575' }}>Total Orders: {filteredOrders.length}</div>
      </div>

      <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        <div className="flex flex-wrap gap-2">
          {outerTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setOuterActiveTab(tab.key);
                setActiveTab(tab.key === 'physical' ? 'to_be_prepared' : 'pending');
                setPage(1);
              }}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md min-w-[140px] ${
                outerActiveTab === tab.key ? 'shadow-md transform scale-105' : 'hover:scale-102'
              }`}
              style={{
                backgroundColor: outerActiveTab === tab.key ? tab.color : tab.lightColor,
                color: outerActiveTab === tab.key ? 'var(--text-on-primary)' : tab.textColor,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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

      <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const ordersCount = groupedOrders[tab.key]?.length || 0;
            const unreadCount = getTabUnreadCount(tab.key);
            return (
              <div key={tab.key} className="relative flex-1" style={{ minWidth: '140px' }}>
                <button
                  onClick={() => {
                    setActiveTab(tab.key);
                    setPage(1);
                  }}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md ${
                    activeTab === tab.key ? 'shadow-md transform scale-105' : 'hover:scale-102'
                  }`}
                  style={{
                    backgroundColor: activeTab === tab.key ? tab.color : tab.lightColor,
                    color: activeTab === tab.key ? 'var(--text-on-primary)' : tab.textColor,
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span>{tab.label}</span>
                      <span className="ml-2 rounded-full w-5 h-5 flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-secondary)' }}>
                        {ordersCount}
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleNotificationClick(tab.key)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className="text-lg">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold animate-pulse" style={{ backgroundColor: 'var(--error-color)', color: 'var(--text-on-primary)' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {activeTab === 'to_be_prepared' && (
        <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <OrderSearch
            orders={orders}
            onOrderSelect={handlePreparationOrderSelect}
            searchTerm={preparationSearchTerm}
            setSearchTerm={setPreparationSearchTerm}
            statusFilter="processing"
          />
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
          />
        </div>
      )}

      {(activeTab === 'ready' || activeTab === 'served') && (
        <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
          <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text-color)' }}>{activeTab === 'ready' ? '📦 Ready for Pickup' : '💳 Process Payment'}</div>
          <OrderSearch
            orders={orders}
            onOrderSelect={handlePaymentOrderSelect}
            searchTerm={paymentSearchTerm}
            setSearchTerm={setPaymentSearchTerm}
            statusFilter={activeTab === 'ready' ? 'ready' : 'served'}
          />
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
        />
      )}

      {showModal && (
        <OrderNotifications
          orders={orders}
          groupedOrders={groupedOrders}
          activeTab={selectedNotificationTab}
          tabs={tabs}
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

      {outerActiveTab === 'physical' && (
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
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>👤 {order.customer_name || 'Guest'}</span>
                        {order.service_type && (
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--text-color)' }}>
                            {order.service_type === 'dine_in' ? '🍽️ Dine-In' : '🥡 Takeaway'}
                          </span>
                        )}
                        {order.table_number && (
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--success-light)', color: 'var(--text-color)' }}>
                            Table: {order.table_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center space-x-2 max-w-md overflow-x-auto">
                      {order.items?.map((item, index) => (
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
                      )) || <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No items</div>}
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
                        <div className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>${order.total_amount?.toFixed(2) || '0.00'}</div>
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
                          className="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--primary-color)',
                            color: 'var(--text-on-primary)',
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
                          className="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md"
                          style={{
                            backgroundColor: 'var(--success-color)',
                            color: 'var(--text-on-primary)',
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
                              className="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                              style={{
                                backgroundColor: 'var(--primary-700)',
                                color: 'var(--text-on-primary)',
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
              <div className="text-5xl mb-3" style={{ color: 'var(--text-tertiary)' }}>📋</div>
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
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    borderColor: 'var(--border-color)',
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
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    borderColor: 'var(--border-color)',
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
