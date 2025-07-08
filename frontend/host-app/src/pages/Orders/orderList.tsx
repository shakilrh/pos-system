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
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Order #{order.order_number}</h2>
        <p className="text-sm mb-2">👤 {order.customer_name || 'Guest'}</p>
        {order.table_number && <p className="text-sm mb-2">Table: {order.table_number}</p>}
        <div className="space-y-2 mb-4">
          {order.items?.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">{item.product?.name || 'Unknown'}</span>
              <span className="text-sm">x{item.quantity}</span>
            </div>
          )) || <div className="text-sm text-gray-500">No items</div>}
        </div>
        {activeTab === 'to_be_prepared' && (
          <button
            onClick={handleMarkAsReady}
            disabled={isLoading}
            className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Processing...' : 'Mark as Ready'}
          </button>
        )}
        {activeTab === 'ready' && (
          <button
            onClick={handleMarkAsServed}
            disabled={isLoading}
            className="w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Processing...' : 'Mark as Served'}
          </button>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
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
    { key: 'physical', label: 'Physical Orders', color: 'bg-blue-600', lightColor: 'bg-blue-100', textColor: 'text-blue-700' },
    { key: 'online', label: 'Online Orders', color: 'bg-purple-600', lightColor: 'bg-purple-100', textColor: 'text-purple-700' },
  ];

  const physicalTabs = [
    { key: 'to_be_prepared', label: 'To Be Prepared', color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300' },
    { key: 'ready', label: 'Ready', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300' },
    { key: 'served', label: 'Served', color: 'bg-purple-500', lightColor: 'bg-purple-100', textColor: 'text-purple-700', borderColor: 'border-purple-300' },
    { key: 'completed', label: 'Completed', color: 'bg-orange-500', lightColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-300' },
  ];

  const onlineTabs = [
    { key: 'pending', label: 'Pending', color: 'bg-yellow-500', lightColor: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-300' },
    { key: 'to_be_prepared', label: 'To Be Prepared', color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300' },
    { key: 'ready', label: 'Ready', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300' },
    { key: 'completed', label: 'Completed', color: 'bg-orange-500', lightColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-300' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-red-500', lightColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300' },
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
          className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs ${
            timeLeft.isOverdue
              ? 'bg-red-100 border-red-300 text-red-800'
              : timeLeft.isUrgent
                ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                : 'bg-blue-100 border-blue-300 text-blue-700'
          }`}
        >
          <span className="font-medium">
            {timeLeft.isOverdue ? '⏰ OVERDUE' : timeLeft.isUrgent ? '⚠️' : '⏰'} {timeLeft.formattedTime}
          </span>
          <span className="text-xs opacity-75">| {timeLeft.estimatedTime}</span>
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
      <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">📦</div>
    );

  const getStatusBadge = (status: string) =>
    ({
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      processing: 'bg-blue-100 text-blue-700 border-blue-300',
      ready: 'bg-blue-100 text-blue-700 border-blue-300',
      served: 'bg-purple-100 text-purple-700 border-purple-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
      completed: 'bg-orange-100 text-orange-700 border-orange-300',
    })[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';

  const currentTab = tabs.find((tab) => tab.key === activeTab);

  const handleNotificationClick = (tabKey: string) => {
    setSelectedNotificationTab(tabKey);
    setShowModal(true);
  };

  const getMessageStyles = (message: string) => {
    if (message.includes('Failed') || message.includes('Please log in')) {
      return 'border-red-500 bg-red-100 text-red-700';
    } else if (message.includes('Order #') && (message.includes('ready') || message.includes('served') || message.includes('completed'))) {
      return 'border-green-500 bg-green-100 text-green-700';
    } else if (message.includes('Overdue') || message.includes('needs to be ready')) {
      return 'border-yellow-500 bg-yellow-100 text-yellow-700';
    }
    return 'border-gray-500 bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        <div className="text-sm text-gray-500">Total Orders: {filteredOrders.length}</div>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {outerTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setOuterActiveTab(tab.key);
                setActiveTab(tab.key === 'physical' ? 'to_be_prepared' : 'pending');
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 min-w-[180px] ${
                outerActiveTab === tab.key
                  ? `${tab.color} text-white shadow-md transform scale-105`
                  : `${tab.lightColor} ${tab.textColor} hover:scale-102`
              } text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-10 mb-4">
        {message && (
          <div
            className={`p-2 rounded-lg shadow-sm border-l-4 ${getMessageStyles(
              message
            )} h-full flex items-center text-sm ${blink && activeTab === 'to_be_prepared' ? 'animate-pulse' : ''}`}
          >
            {message}
          </div>
        )}
      </div>

      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
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
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? `${tab.color} text-white shadow-md transform scale-105`
                      : `${tab.lightColor} ${tab.textColor} hover:scale-102`
                  } text-sm`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span>{tab.label}</span>
                      <span className="ml-2 bg-gray-200 text-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {ordersCount}
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleNotificationClick(tab.key)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center hover:scale-110 transition-transform"
                >
                  <span className="text-lg">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold animate-pulse">
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
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
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
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
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
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="text-lg font-semibold text-gray-800 mb-2">{activeTab === 'ready' ? '📦 Ready for Pickup' : '💳 Process Payment'}</div>
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
                className={`bg-white rounded-lg shadow-sm border-l-4 ${currentTab?.borderColor} hover:shadow-md transition-shadow duration-200 ${
                  order.notification_status === 0 ? 'ring-2 ring-blue-200' : ''
                } p-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-lg text-gray-800">#{order.order_number}</h3>
                        {order.notification_status === 0 && (
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm font-medium text-gray-600">👤 {order.customer_name || 'Guest'}</span>
                        {order.service_type && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {order.service_type === 'dine_in' ? '🍽️ Dine-In' : '🥡 Takeaway'}
                          </span>
                        )}
                        {order.table_number && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
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
                          className="flex items-center space-x-1 px-1 py-0.5 bg-gray-50 rounded-md border min-w-max"
                        >
                          {renderOrderItemImage(item)}
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-800 truncate max-w-20">
                              {item.product?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-gray-600">x{item.quantity}</span>
                          </div>
                        </div>
                      )) || <div className="text-sm text-gray-500">No items</div>}
                    </div>
                  </div>
                  <div className="flex items-end space-x-3">
                    {getTimeDisplay(order)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.payment_status === 'paid'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                    >
                      {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                    </span>
                    {(activeTab === 'completed' || activeTab === 'cancelled') && (
                      <div className="flex flex-col items-end">
                        <div className="text-lg font-bold text-gray-800">${order.total_amount?.toFixed(2) || '0.00'}</div>
                        <div className="text-xs text-gray-500">{order.items?.length || 0} items</div>
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
                              setMessage(
                                `❌ ${error instanceof Error ? error.message : 'Failed to mark order as ready'}`
                              );
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
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
                              setMessage(
                                `❌ ${error instanceof Error ? error.message : 'Failed to mark order as served'}`
                              );
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 text-sm"
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
                              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
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
                                  setMessage(
                                    `❌ ${error instanceof Error ? error.message : 'Failed to mark order as completed'}`
                                  );
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                              className="px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 text-sm"
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
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="text-5xl mb-3">📋</div>
              <h3 className="text-lg font-medium text-gray-600 mb-1">No orders found</h3>
              <p className="text-sm text-gray-500">
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
        <div className="mt-6 bg-white rounded-lg shadow-sm p-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-gray-500">
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
                className="p-2 border border-gray-300 rounded-md bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 per page</option>
                <option value={50}>50 per page</option>
                <option value={80}>80 per page</option>
              </select>
              <div className="flex space-x-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 disabled:opacity-50 text-sm hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, Math.ceil(filteredOrders.length / itemsPerPage)) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`px-3 py-2 border rounded-md text-sm transition-colors ${
                        pageNumber === page
                          ? `${currentTab?.color} text-white border-transparent`
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(Math.ceil(filteredOrders.length / itemsPerPage), page + 1))}
                  disabled={page === Math.ceil(filteredOrders.length / itemsPerPage)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 disabled:opacity-50 text-sm hover:bg-gray-50 transition-colors"
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
