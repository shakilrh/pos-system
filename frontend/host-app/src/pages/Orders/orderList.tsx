import React, { useState, useEffect } from 'react';
import { Order } from './orderTypes';
import OrderNotifications from './orderNotifications';
import OrderModal from './orderModal';
import { markOrderAsReady, markOrderAsPicked, getPhysicalQueue } from '../../services/orderService';

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [queueData, setQueueData] = useState<PhysicalQueueOrder[]>([]);
  const [queueCountdowns, setQueueCountdowns] = useState<{ [key: string]: number }>({});

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

  // Fetch queue data
  useEffect(() => {
    const fetchQueueData = async () => {
      if (token && activeTab === 'ready') {
        try {
          const queue = await getPhysicalQueue(token, logout);
          setQueueData(queue);

          // Initialize countdown timers for queue items
          const countdowns: { [key: string]: number } = {};
          queue.forEach(item => {
            if (item.estimated_completion) {
              const completionTime = new Date(item.estimated_completion).getTime();
              const now = Date.now();
              const remainingSeconds = Math.max(0, Math.floor((completionTime - now) / 1000));
              countdowns[item.order_number] = remainingSeconds;
            }
          });
          setQueueCountdowns(countdowns);
        } catch (error) {
          console.error('Failed to fetch queue data:', error);
        }
      }
    };

    fetchQueueData();
    const interval = setInterval(fetchQueueData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [token, logout, activeTab]);

  // Update countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueCountdowns(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(orderNumber => {
          if (updated[orderNumber] > 0) {
            updated[orderNumber] = updated[orderNumber] - 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredOrdersByType = React.useMemo(() => {
    return orders.filter(order => order.order_type === 'physical' || !order.order_type);
  }, [orders, outerActiveTab]);

  const groupedOrders = React.useMemo(() => {
    const groups: Record<string, Order[]> = {
      pending: [], to_be_prepared: [], ready: [], cancelled: [], completed: [],
    };

    filteredOrdersByType.forEach(order => {
      const status = order.status.toLowerCase();
      if (status === 'pending') groups.pending.push(order);
      else if (status === 'processing') groups.to_be_prepared.push(order);
      else if (status === 'ready') groups.ready.push(order);
      else if (status === 'cancelled') groups.cancelled.push(order);
      else if (status === 'picked') groups.completed.push(order);
    });

    Object.keys(groups).forEach(status => {
      groups[status].sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || new Date()).getTime();
        const dateB = new Date(b.created_at || b.createdAt || new Date()).getTime();
        return dateA - dateB;
      });
    });

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

  const getCountdownInfo = (order: Order) => {
    const createdAt = new Date(order.created_at || order.createdAt || new Date());
    const estimatedTime = order.estimated_time || preparationTime;
    const elapsedMs = Date.now() - createdAt.getTime();
    const estimatedTimeMs = estimatedTime * 60 * 1000;
    const remainingMs = Math.max(0, estimatedTimeMs - elapsedMs);
    const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
    const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    return {
      remainingMinutes,
      remainingSeconds,
      isOverdue: remainingMs <= 0,
      isUrgent: remainingMinutes <= 2 && remainingMs > 0,
      totalRemainingSeconds: Math.floor(remainingMs / 1000),
      formattedTime: remainingMs <= 0 ? 'OVERDUE' : `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`
    };
  };

  const getQueueCountdown = (orderNumber: string) => {
    const countdown = queueCountdowns[orderNumber];
    if (countdown === undefined) return null;

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    const isOverdue = countdown <= 0;
    const isUrgent = countdown <= 120 && countdown > 0;

    return {
      minutes,
      seconds,
      isOverdue,
      isUrgent,
      formattedTime: isOverdue ? 'READY NOW' : `${minutes}:${seconds.toString().padStart(2, '0')}`
    };
  };

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), 5000);
      setMessageTimeout(timeout);
      return () => clearTimeout(timeout);
    }
  }, [message, setMessage]);

  const renderOrderItemImage = (item: any) => {
    if (item.product?.pictureUrl) {
      return (
        <img
          src={item.product.pictureUrl}
          alt={item.product.name}
          className="w-10 h-10 object-cover rounded-md"
        />
      );
    }
    return (
      <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
        📦
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: 'bg-gray-100 text-gray-700 border-gray-300',
      to_be_prepared: 'bg-green-100 text-green-700 border-green-300',
      ready: 'bg-blue-100 text-blue-700 border-blue-300',
      cancelled: 'bg-red-100 text-red-700 border-red-300',
      completed: 'bg-orange-100 text-orange-700 border-orange-300',
    };
    return statusConfig[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getTimeDisplay = (order: Order) => {
    if (order.status.toLowerCase() === 'to_be_prepared') {
      const countdownInfo = getCountdownInfo(order);
      const timeLeftSeconds = timeLeft[order._id] !== undefined ? timeLeft[order._id] : countdownInfo.totalRemainingSeconds;
      const minutes = Math.floor(timeLeftSeconds / 60);
      const seconds = timeLeftSeconds % 60;

      const isOverdue = timeLeftSeconds <= 0;
      const isUrgent = timeLeftSeconds <= 120 && timeLeftSeconds > 0;

      return (
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
          isOverdue
            ? 'bg-red-100 border-red-300 text-red-800'
            : isUrgent
              ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
              : 'bg-gray-100 border-gray-300 text-gray-700'
        }`}>
          <span className="font-medium text-sm">
            {isOverdue ? '⚠️ OVERDUE' : `⏰ ${minutes}:${seconds.toString().padStart(2, '0')}`}
          </span>
        </div>
      );
    }

    if (order.status.toLowerCase() === 'ready') {
      const queueCountdown = getQueueCountdown(order.order_number);
      if (queueCountdown) {
        return (
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
            queueCountdown.isOverdue
              ? 'bg-green-100 border-green-300 text-green-800'
              : queueCountdown.isUrgent
                ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                : 'bg-blue-100 border-blue-300 text-blue-700'
          }`}>
            <span className="font-medium text-sm">
              {queueCountdown.isOverdue ? '✅ READY NOW' : `🕐 ${queueCountdown.formattedTime}`}
            </span>
          </div>
        );
      }
    }

    return null;
  };

  const getItemDetails = (items: OrderItemResponse[] | undefined) => {
    return items?.map(item => `${item.product.name} x ${item.quantity}`).join(', ') || '';
  };

  const currentTab = tabs.find(tab => tab.key === activeTab);
  const currentOuterTab = outerTabs.find(tab => tab.key === outerActiveTab);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">My Orders</h1>

      {message && (
        <div className="p-4 mb-6 rounded-xl shadow-sm border-t-4 border-red-500 bg-red-50 text-red-700">
          {message}
        </div>
      )}

      <div className="mb-6 bg-white rounded-xl shadow-sm p-2">
        <div className="flex gap-2">
          {outerTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setOuterActiveTab(tab.key);
                setActiveTab('pending');
                setPage(1);
              }}
              className={`flex-1 px-6 py-4 rounded-lg font-medium transition-all duration-200 ${
                outerActiveTab === tab.key
                  ? `${tab.color} text-white shadow-md transform scale-105`
                  : `${tab.lightColor} ${tab.textColor} hover:scale-102`
              }`}
            >
              <div className="flex justify-between items-center">
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <OrderNotifications
        orders={orders}
        groupedOrders={groupedOrders}
        activeTab={activeTab}
        tabs={tabs}
        setActiveTab={setActiveTab}
        setPage={setPage}
        setShowModal={setShowModal}
        showModal={showModal}
        setShowOrderModal={() => {}}
        showOrderModal={false}
        selectedOrder={null}
        setSelectedOrder={setSelectedOrder}
        preparationTime={preparationTime}
        setTimeLeft={setTimeLeft}
      />

      {showModal && selectedOrder && activeTab === 'pending' && (
        <OrderModal
          order={selectedOrder}
          token={token}
          logout={logout}
          onClose={() => setShowModal(false)}
          setOrders={setOrders}
          orders={orders}
          setMessage={setMessage}
          preparationTime={preparationTime}
          setPreparationTime={setPreparationTime}
        />
      )}

      {outerActiveTab === 'physical' && (
        <div className="space-y-4">
          {paginatedOrders.map(order => {
            const itemDetails = getItemDetails(order.items);
            return (
              <div
                key={order._id}
                className={`bg-white rounded-xl shadow-sm border-l-4 ${currentTab?.borderColor} hover:shadow-md transition-shadow duration-200`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-800">
                            #{order.order_number}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          {getTimeDisplay(order)}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <span className="font-medium">👤 {order.customer_name || 'Guest'}</span>
                          {order.service_type && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {order.service_type === 'dine_in' ? '🍽️ Dine-In' : '🥡 Takeaway'}
                            </span>
                          )}
                        </div>

                        {/* Items display moved to middle section */}
                        <div className="flex flex-wrap gap-3 mb-3">
                          {order.items?.map((item, index) => (
                            <div key={index} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border">
                              {renderOrderItemImage(item)}
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-800">
                                  {item.product?.name || 'Unknown'}
                                </span>
                                <span className="text-xs text-gray-600">
                                  Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                          )) || (
                            <div className="text-sm text-gray-500">No items</div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {(activeTab === 'pending' || activeTab === 'completed' || activeTab === 'cancelled') && (
                          <>
                            <div className="text-2xl font-bold text-gray-800">
                              ${order.total_amount?.toFixed(2) || '0.00'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.items?.length || 0} items
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
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
                              setOrders(orders.map(o => o.order_number === order.order_number ? updatedOrder : o));
                              setMessage(`✅ Order #${order.order_number} is now ready!`);
                            } catch (error) {
                              setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to mark order as ready'}`);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="ml-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
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
                              setOrders(orders.map(o => o.order_number === order.order_number ? updatedOrder : o));
                              setMessage(`🚚 Order #${order.order_number} has been picked up!`);
                            } catch (error) {
                              setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to mark order as picked'}`);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="ml-4 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          Mark as Picked
                        </button>
                      )}

                      {activeTab === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowModal(true);
                          }}
                          className="ml-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                        >
                          Accept Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {outerActiveTab === 'physical' && filteredOrders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            No {tabs.find(t => t.key === activeTab)?.label.toLowerCase()} found
          </h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria.' : 'Orders will appear here when available.'}
          </p>
        </div>
      )}

      {outerActiveTab === 'physical' && filteredOrders.length > itemsPerPage && (
        <div className="mt-8 bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              Showing {Math.min((page - 1) * itemsPerPage + 1, filteredOrders.length)}-
              {Math.min(page * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="p-2 border border-gray-300 rounded-lg bg-white text-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={30}>30 per page</option>
              </select>

              <div className="flex space-x-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 disabled:opacity-50 text-sm hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, Math.ceil(filteredOrders.length / itemsPerPage)) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                        page === pageNumber
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
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-800 disabled:opacity-50 text-sm hover:bg-gray-50 transition-colors"
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
