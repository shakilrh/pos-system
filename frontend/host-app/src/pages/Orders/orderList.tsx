import React, { useState, useEffect } from 'react';
import { Order } from './orderTypes';
import OrderModal from './orderModal';
import OrderNotifications from './orderNotifications';
import {
  markOrderAsReady,
  markOrderAsPicked,
  getPhysicalQueue,
  getOrderQueue,
  QueueOrder,
  markNotificationAsRead,
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
}

interface PhysicalQueueOrder {
  _id: string;
  order_number: string;
  status: string;
  customer_name: string;
  position: number;
  estimated_completion?: string;
}

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
                                  }: OrderListProps) {
  const [outerActiveTab, setOuterActiveTab] = useState('physical');
  const [activeTab, setActiveTab] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [queueData, setQueueData] = useState<QueueOrder[]>([]);
  const [queueCountdowns, setQueueCountdowns] = useState<{ [key: string]: number }>({});
  const [blink, setBlink] = useState(false);
  const [selectedNotificationTab, setSelectedNotificationTab] = useState<string>('');

  const outerTabs = [
    { key: 'physical', label: 'Physical Orders', color: 'bg-blue-600', lightColor: 'bg-blue-100', textColor: 'text-blue-700' },
  ];

  const tabs = [
    { key: 'pending', label: 'Pending Orders', color: 'bg-gray-500', lightColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' },
    { key: 'to_be_prepared', label: 'To Be Prepared', color: 'bg-green-500', lightColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-300' },
    { key: 'ready', label: 'Ready Orders', color: 'bg-blue-500', lightColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300' },
    { key: 'cancelled', label: 'Cancelled Orders', color: 'bg-red-500', lightColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-300' },
    { key: 'completed', label: 'Completed Orders', color: 'bg-orange-500', lightColor: 'bg-orange-100', textColor: 'text-orange-700', borderColor: 'border-orange-300' },
  ];

  useEffect(() => {
    const fetchQueueData = async () => {
      if (token) {
        try {
          const queue = await getOrderQueue(token, logout);
          setQueueData(queue);
          const countdowns: { [key: string]: number } = {};
          queue.forEach(item => countdowns[item.order_number] = item.time_left * 60 || 0);
          setQueueCountdowns(countdowns);
        } catch (error) {
          console.error('Failed to fetch queue data:', error);
          setMessage('Failed to load queue data');
        }
      }
    };
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 10000);
    return () => clearInterval(interval);
  }, [token, logout, setMessage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueCountdowns(prev => {
        const updated = { ...prev };
        let overdueOrders: string[] = [];
        Object.keys(updated).forEach(orderNumber => {
          const order = orders.find(o => o.order_number === orderNumber);
          if (updated[orderNumber] > 0) {
            updated[orderNumber] -= 1;
            if (updated[orderNumber] === 60 && order?.status.toLowerCase() === 'processing') {
              setMessage(`⚠️ Order #${orderNumber} needs to be ready in 1 minute!`);
            }
          } else if (updated[orderNumber] === 0 && order?.status.toLowerCase() === 'processing') {
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

  const filteredOrdersByType = React.useMemo(() => orders.filter(order => order.order_type === 'physical' || !order.order_type), [orders, outerActiveTab]);

  const groupedOrders = React.useMemo(() => {
    const groups: Record<string, Order[]> = {
      pending: [],
      to_be_prepared: [],
      ready: [],
      cancelled: [],
      completed: []
    };

    filteredOrdersByType.forEach(order => {
      const status = order.status.toLowerCase();
      if (status === 'pending') groups.pending.push(order);
      else if (status === 'processing') groups.to_be_prepared.push(order);
      else if (status === 'ready') groups.ready.push(order);
      else if (status === 'cancelled') groups.cancelled.push(order);
      else if (status === 'picked') groups.completed.push(order);
    });

    Object.keys(groups).forEach(status =>
      groups[status].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    );

    return groups;
  }, [filteredOrdersByType]);

  const filteredOrders = React.useMemo(() => {
    const ordersInActiveTab = groupedOrders[activeTab] || [];
    return ordersInActiveTab.filter(order =>
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toString().includes(searchTerm.toLowerCase())
    );
  }, [groupedOrders, activeTab, searchTerm]);

  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const mapStatusToTab = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'pending',
      'processing': 'to_be_prepared',
      'ready': 'ready',
      'cancelled': 'cancelled',
      'picked': 'completed'
    };
    return statusMap[status] || 'pending';
  };

  const getTabUnreadCount = (tabKey: string): number => {
    return orders.filter(order => {
      const orderTab = mapStatusToTab(order.status.toLowerCase());
      return orderTab === tabKey && order.notification_status === 0;
    }).length;
  };

  const getQueueTimeLeft = (orderNumber: string) => {
    const queueOrder = queueData.find((q: QueueOrder) => q.order_number === orderNumber);
    const countdown = queueCountdowns[orderNumber] || 0;
    const order = orders.find(o => o.order_number === orderNumber);
    if (!queueOrder || countdown === undefined) return null;
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    const isOverdue = countdown < 0 && order?.status.toLowerCase() === 'processing';
    const isUrgent = countdown > 0 && countdown <= 60;
    return {
      minutes, seconds, isOverdue, isUrgent,
      estimatedTime: queueOrder.estimated_time || 'N/A',
      formattedTime: isOverdue ? 'OVERDUE' : (countdown >= 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : '')
    };
  };

  useEffect(() => {
    if (message && activeTab !== 'to_be_prepared') {
      const timeout = setTimeout(() => setMessage(''), 5000);
      setMessageTimeout(timeout);
      return () => clearTimeout(timeout);
    }
  }, [message, setMessage, activeTab]);

  const renderOrderItemImage = (item: any) => item.product?.pictureUrl ? (
    <img src={item.product.pictureUrl} alt={item.product.name} className="w-8 h-8 object-cover rounded-md" />
  ) : (
    <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">📦</div>
  );

  const getStatusBadge = (status: string) => ({
    pending: 'bg-gray-100 text-gray-700 border-gray-300',
    processing: 'bg-green-100 text-green-700 border-green-300',
    ready: 'bg-blue-100 text-blue-700 border-blue-300',
    cancelled: 'bg-red-100 text-red-700 border-red-300',
    picked: 'bg-orange-100 text-orange-700 border-orange-300',
  })[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';

  const getTimeDisplay = (order: Order) => {
    const timeLeft = getQueueTimeLeft(order.order_number);
    if (timeLeft && order.status.toLowerCase() !== 'ready') {
      return (
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs ${
          timeLeft.isOverdue ? 'bg-red-100 border-red-300 text-red-800' :
            timeLeft.isUrgent ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
              'bg-blue-100 border-blue-300 text-blue-700'
        }`}>
          <span className="font-medium">{timeLeft.isOverdue ? '⏰ OVERDUE' : timeLeft.isUrgent ? '⚠️' : '⏰'} {timeLeft.formattedTime}</span>
          <span className="text-xs opacity-75">| {timeLeft.estimatedTime}</span>
        </div>
      );
    }
    return null;
  };

  const currentTab = tabs.find(tab => tab.key === activeTab);
  const currentOuterTab = outerTabs.find(tab => tab.key === outerActiveTab);

  const handleNotificationClick = (tabKey: string) => {
    setSelectedNotificationTab(tabKey);
    setShowModal(true);
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        <div className="text-sm text-gray-500">Total Orders: {filteredOrders.length}</div>
      </div>

      {message && activeTab !== 'to_be_prepared' && (
        <div className="p-3 mb-4 rounded-lg shadow-sm border-l-4 border-red-500 bg-red-50 text-red-700 text-sm">
          {message}
        </div>
      )}
      {message && activeTab === 'to_be_prepared' && (
        <div className={`p-3 mb-4 rounded-lg shadow-sm border-l-4 ${blink ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-red-500 bg-red-50 text-red-700'} text-sm ${blink ? 'animate-pulse' : ''}`}>
          {message}
        </div>
      )}

      <div className="mb-8 bg-white rounded-xl shadow-sm p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const ordersCount = groupedOrders[tab.key]?.length || 0;
            const unreadCount = getTabUnreadCount(tab.key);
            return (
              <div key={tab.key} className="relative flex-1 min-w-[140px]">
                <button
                  onClick={() => {
                    setActiveTab(tab.key);
                    setPage(1);
                  }}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? `${tab.color} text-white shadow-md transform scale-105`
                      : `${tab.lightColor} ${tab.textColor} hover:scale-102`
                  }`}
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

      {showOrderModal && selectedOrder && (
        <OrderModal
          order={selectedOrder}
          token={token}
          logout={logout}
          onClose={() => setShowOrderModal(false)}
          setOrders={setOrders}
          orders={orders}
          setMessage={setMessage}
          preparationTime={preparationTime}
          setPreparationTime={setPreparationTime}
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
          preparationTime={preparationTime}
          setTimeLeft={setTimeLeft}
          token={token}
          logout={logout}
          setOrders={setOrders}
          setMessage={setMessage}
        />
      )}

      {outerActiveTab === 'physical' && (
        <div className="space-y-3">
          {paginatedOrders.map(order => (
            <div key={order._id} className={`bg-white rounded-lg shadow-sm border-l-4 ${currentTab?.borderColor} hover:shadow-md transition-shadow duration-200 ${order.notification_status === 0 ? 'ring-2 ring-blue-200' : ''}`}>
              <div className="p-3">
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
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center space-x-2 max-w-md overflow-x-auto">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-md border min-w-max">
                          {renderOrderItemImage(item)}
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-800 truncate max-w-20">{item.product?.name || 'Unknown'}</span>
                            <span className="text-xs text-gray-600">x{item.quantity}</span>
                          </div>
                        </div>
                      )) || <div className="text-sm text-gray-500">No items</div>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getTimeDisplay(order)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    {(activeTab === 'pending' || activeTab === 'completed' || activeTab === 'cancelled') && (
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
                              setMessage('Please log in to mark order as ready');
                              return;
                            }
                            setIsLoading(true);
                            try {
                              const updatedOrder = await markOrderAsReady(token, logout, order.order_number);
                              setOrders(prevOrders => prevOrders.map(o => o.order_number === updatedOrder.order_number ? { ...updatedOrder, items: o.items } : o)); // Preserve items
                              setMessage(`✅ Order #${order.order_number} is now ready!`);
                            } catch (error) {
                              setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to mark order as ready'}`);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
                          disabled={isLoading}
                        >
                          Mark as Ready
                        </button>
                      )}
                      {activeTab === 'ready' && (
                        <button
                          onClick={async () => {
                            if (!token) {
                              setMessage('Please log in to mark order as picked');
                              return;
                            }
                            setIsLoading(true);
                            try {
                              const updatedOrder = await markOrderAsPicked(token, logout, order.order_number);
                              setOrders(prevOrders => prevOrders.map(o => o.order_number === updatedOrder.order_number ? { ...updatedOrder, items: o.items } : o)); // Preserve items
                              setMessage(`🚚 Order #${order.order_number} has been picked up!`);
                            } catch (error) {
                              setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to mark order as picked'}`);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 text-sm"
                          disabled={isLoading}
                        >
                          Mark as Picked
                        </button>
                      )}
                      {activeTab === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                        >
                          Accept Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {outerActiveTab === 'physical' && filteredOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-5xl mb-3">📋</div>
          <h3 className="text-lg font-medium text-gray-600 mb-1">No {tabs.find(t => t.key === activeTab)?.label.toLowerCase()} found</h3>
          <p className="text-sm text-gray-500">{searchTerm ? 'Try adjusting your search criteria.' : 'Orders will appear here when available.'}</p>
        </div>
      )}

      {outerActiveTab === 'physical' && filteredOrders.length > itemsPerPage && (
        <div className="mt-6 bg-white rounded-lg shadow-sm p-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-sm text-gray-500">Showing {Math.min((page - 1) * itemsPerPage + 1, filteredOrders.length)}-{Math.min(page * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders</div>
            <div className="flex items-center space-x-3">
              <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="p-2 border border-gray-300 rounded-md bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500">
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={30}>30 per page</option>
              </select>
              <div className="flex space-x-1">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 disabled:opacity-50 text-sm hover:bg-gray-50 transition-colors">Previous</button>
                {Array.from({ length: Math.min(5, Math.ceil(filteredOrders.length / itemsPerPage)) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button key={pageNumber} onClick={() => setPage(pageNumber)} className={`px-3 py-2 border rounded-md text-sm transition-colors ${
                      page === pageNumber ? `${currentTab?.color} text-white border-transparent` : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                    }`}>{pageNumber}</button>
                  );
                })}
                <button onClick={() => setPage(Math.min(Math.ceil(filteredOrders.length / itemsPerPage), page + 1))} disabled={page === Math.ceil(filteredOrders.length / itemsPerPage)} className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 disabled:opacity-50 text-sm hover:bg-gray-50 transition-colors">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
