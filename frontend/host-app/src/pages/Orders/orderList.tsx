import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Order } from './orderTypes';
import PaymentModal, { OrderSearch } from './paymentModal';
import OrderNotifications from './orderNotifications';
import {
  markOrderAsReady,
  markOrderAsServed,
  markOrderAsCompleted,
  markNotificationAsRead,
  markOrderOutForDelivery,
  fetchFreeRiders,
  QueueOrder,
  confirmOrder,
  cancelOrder
} from '../../services/orderService';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTruck,
  faUser,
  faMapMarkerAlt,
  faMotorcycle,
  faChevronDown,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import {
  faChartLine,
  faClipboardList,
  faUtensils,
  faShoppingBag,
  faSearch,
  faClipboardCheck,
  faHashtag,
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

  const getCurrencySymbol = (currency: string) => {
    const symbols = { pkr: '₨', dollar: '$', euro: '€' };
    return symbols[currency as keyof typeof symbols] || '₨';
  };

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
      setOrders((prevOrders: Order[]) =>
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
      setOrders((prevOrders: Order[]) =>
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
          {order.rider_name && <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--success-light)', padding: '2px 8px', borderRadius: '9999px' }}>Rider: {order.rider_name}</p>}
          {order.linked_orders?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {order.linked_orders.map((linkedOrder: string, index: number) => (
                    <span key={index} className="text-sm px-2 py-0.5 rounded-full" style={{ backgroundColor: index % 2 === 0 ? 'var(--warning-light)' : 'var(--success-light)', color: 'var(--text-color)' }}>
        Linked: {linkedOrder}
      </span>
                ))}
              </div>
          )}
          <div className="space-y-2 mb-4">
            {order.items?.length > 0 ? (
                order.items.map((item: { _id: string; order_id: string; product_id: { _id: string; name: string; price: number; pictureUrl: string }; quantity: number; sub_total: number; created_by: string; createdAt: string; updatedAt: string }, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--background-secondary)' }}>
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--text-color)' }}>{item.product_id?.name || 'Unknown'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>x{item.quantity}</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{formatPrice(item.sub_total || 0, currentCurrency)}</span>
                      </div>
                    </div>
                ))
            ) : (
                <div className="text-sm text-center py-2" style={{ color: 'var(--text-tertiary)' }}>No items</div>
            )}
            {(activeTab === 'completed' || activeTab === 'cancelled') && (
                <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-color)' }}>
                  <span className="text-sm font-bold">Total:</span>
                  <span className="text-sm font-bold">{formatPrice(order.total_amount || 0, currentCurrency)}</span>
                </div>
            )}
          </div>

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

const RiderAssignmentModal = ({
                                order,
                                token,
                                logout,
                                onClose,
                                setOrders,
                                setMessage
                              }: {
  order: Order;
  token: string;
  logout: () => void;
  onClose: () => void;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setMessage: (message: string) => void;
}) => {
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRiders, setLoadingRiders] = useState(true);

  useEffect(() => {
    const loadRiders = async () => {
      try {
        const response = await fetch('http://192.168.18.37:3000/users/api/v1/all-riders', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch riders: ${response.status}`);
        }

        const ridersData = await response.json();
        console.log('Riders API response:', ridersData); // Debug log

        // Access the correct nested structure
        const ridersList = ridersData?.data?.data || [];
        console.log('Extracted riders:', ridersList); // Debug log

        setRiders(Array.isArray(ridersList) ? ridersList : []);
      } catch (error) {
        console.error('Error loading riders:', error);
        setMessage('Failed to load riders');
        setRiders([]);
      } finally {
        setLoadingRiders(false);
      }
    };
    loadRiders();
  }, [token, logout, setMessage]);

  const handleAssignRider = async () => {
    if (!selectedRider) {
      setMessage('Please select a rider');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.18.37:3000/orders/api/v1/out-for-delivery', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          order_number: order.order_number,
          rider_id: selectedRider
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to assign rider: ${response.status}`);
      }

      const resData = await response.json();
      const updatedOrder = resData.data || resData;

      // ✅ Ensure the status is updated to move to Out for Delivery
      updatedOrder.status = 'out_for_delivery';

      // ✅ Attach rider details for UI
      const selectedRiderDetails = riders.find(r => r._id === selectedRider);
      if (selectedRiderDetails) {
        updatedOrder.rider = {
          id: selectedRiderDetails._id,
          name: selectedRiderDetails.name
        };
        updatedOrder.rider_name = selectedRiderDetails.name;
      }

      const updatedOrderWithStatus = {
        ...updatedOrder,
        status: 'out_for_delivery',
        rider: {
          id: selectedRiderDetails?._id || '',
          name: selectedRiderDetails?.name || ''
        },
        notification_status: 1
      };

      setOrders(prev =>
          prev.map(o =>
              o.order_number === updatedOrderWithStatus.order_number
                  ? { ...updatedOrderWithStatus, items: o.items }
                  : o
          )
      );


      setMessage(`✅ Order #${order.order_number} is now out for delivery!`);
      onClose();
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to assign rider'}`);
    } finally {
      setIsLoading(false);
    }
  };



  return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="relative overflow-hidden rounded-2xl max-w-md w-full mx-4 shadow-2xl transform transition-all duration-300 hover:scale-105"
             style={{
               backgroundColor: 'var(--background-color)',
               border: '2px solid var(--primary-color)',
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--primary-color)'
             }}>

          {/* Gradient Header */}
          <div className="relative p-6 pb-4"
               style={{
                 background: `linear-gradient(135deg, var(--primary-color), var(--primary-color-dark, var(--primary-color)))`,
                 color: 'var(--text-on-primary)'
               }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            <div className="relative flex items-center">
              <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm mr-3">
                <FontAwesomeIcon icon={faTruck} className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Assign Delivery Rider</h2>
                <p className="text-sm opacity-90">Order #{order.order_number}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-4">
            {/* Order Details Card */}
            <div className="mb-6 p-4 rounded-xl"
                 style={{
                   backgroundColor: 'var(--background-secondary)',
                   border: '1px solid var(--border-color)'
                 }}>
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faUser} className="mr-2 text-sm" style={{ color: 'var(--primary-color)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
              {order.customer_name || 'Guest Customer'}
            </span>
              </div>
              {order.delivery_address && (
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-sm mt-0.5" style={{ color: 'var(--primary-color)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {order.delivery_address}
              </span>
                  </div>
              )}
            </div>

            {loadingRiders ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
                       style={{ borderColor: 'var(--primary-color)' }}></div>
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Loading available riders...
                  </p>
                </div>
            ) : (
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-color)' }}>
                    <FontAwesomeIcon icon={faMotorcycle} className="mr-2" style={{ color: 'var(--primary-color)' }} />
                    Choose Delivery Rider:
                  </label>
                  <div className="relative">
                    <select
                        value={selectedRider}
                        onChange={(e) => setSelectedRider(e.target.value)}
                        className="w-full p-2 text-sm rounded-lg border focus:ring-2 transition-all duration-200"
                        style={{
                          backgroundColor: 'var(--background-color)',
                          borderColor: selectedRider ? 'var(--primary-color)' : 'var(--border-color)',
                          color: 'var(--text-color)',
                          '--tw-ring-color': 'var(--primary-color)'
                        } as React.CSSProperties}
                    >
                      <option value="" disabled>Select a rider...</option>
                      {riders.map((rider) => (
                          <option key={rider._id} value={rider._id}>
                            {rider.name}
                          </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FontAwesomeIcon icon={faChevronDown} className="text-sm" style={{ color: 'var(--text-secondary)' }} />
                    </div>
                  </div>
                  {riders.length === 0 && (
                      <p className="mt-2 text-sm text-amber-600">
                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                        No riders available
                      </p>
                  )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                  onClick={handleAssignRider}
                  disabled={isLoading || !selectedRider || loadingRiders}
                  className="flex-1 py-4 px-6 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'var(--text-on-primary)',
                  }}
              >
                {isLoading ? (
                    <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-white mr-2"></div>
                Assigning...
              </span>
                ) : (
                    <span className="flex items-center justify-center">
                <FontAwesomeIcon icon={faTruck} className="mr-2" />
                Assign & Send Out
              </span>
                )}
              </button>
              <button
                  onClick={onClose}
                  className="flex-1 py-4 px-6 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md transform hover:scale-105 active:scale-95"
                  style={{
                    backgroundColor: 'var(--background-secondary)',
                    color: 'var(--text-secondary)',
                    border: '2px solid var(--border-color)',
                  }}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-white/5 to-transparent rounded-tr-full"></div>
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
  const { user_type  } = useAuth();
  const { userPermissions } = useAuth();
  const [outerActiveTab, setOuterActiveTab] = useState<string | null>('physical');
  const [activeTab, setActiveTab] = useState<string | null>(null);
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(preparationSearchTerm);
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeCurrency, setActiveCurrency] = useState(currentCurrency);
  const [showRiderModal, setShowRiderModal] = useState(false);
  const [selectedRiderOrder, setSelectedRiderOrder] = useState<Order | null>(null);

  // Debounce search term to reduce re-renders
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(preparationSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [preparationSearchTerm]);

  const getCurrencySymbol = (currency: string) => {
    const symbols = { pkr: '₨', dollar: '$', euro: '€' };
    return symbols[currency as keyof typeof symbols] || '₨';
  };

  const formatPrice = (price: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${price.toFixed(2)}`;
  };

  const getCurrentCurrency = () => {
    const domCurrency = document.documentElement.getAttribute('data-currency');
    const storedCurrency = localStorage.getItem('appCurrency');
    return domCurrency || currentCurrency || storedCurrency || 'pkr';
  };

  useEffect(() => {
    setActiveCurrency(currentCurrency);
  }, [currentCurrency]);

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
    ...(userPermissions.includes('Manage_order_delivery') ? [{
      key: 'out_for_delivery',
      label: 'Out for Delivery',
      color: 'var(--info-color)',
      lightColor: 'var(--info-light)',
      textColor: 'var(--text-color)',
      borderColor: 'var(--info-border)'
    }] : []),
    ...(userPermissions.includes('Manage_order_delivery') ? [{

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
    ...(physicalTabs.length > 0 ? [{
      key: 'physical',
      label: 'Physical Orders',
      color: 'var(--primary-color)',
      lightColor: 'var(--primary-light)',
      textColor: 'var(--text-color)'
    }] : []),
    ...(onlineTabs.length > 0 ? [{
      key: 'online',
      label: 'Online Orders',
      color: 'var(--success-color)',
      lightColor: 'var(--success-light)',
      textColor: 'var(--text-color)'
    }] : []),
  ];


  useEffect(() => {
    if (outerTabs.length > 0) {
      // if physical exists, prefer physical; else online
      const defaultOuter = physicalTabs.length > 0 ? 'physical' : 'online';

      // ✅ ensure outerActiveTab is valid
      const currentOuter = !outerActiveTab || !outerTabs.some(t => t.key === outerActiveTab)
          ? defaultOuter
          : outerActiveTab;

      if (!outerActiveTab || currentOuter !== outerActiveTab) {
        setOuterActiveTab(currentOuter);
      }

      const activeTabs = currentOuter === 'physical' ? physicalTabs : onlineTabs;
      if (activeTabs.length > 0) {
        setActiveTab(prev => prev || activeTabs[0].key);
      } else {
        setActiveTab(null);
      }
    } else {
      // no outer tabs at all
      setOuterActiveTab(null);
      setActiveTab(null);
    }
  }, [userPermissions, outerActiveTab, physicalTabs, onlineTabs, outerTabs]);


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
        const physicalOverdueOrders: string[] = [];
        const onlineOverdueOrders: string[] = [];

        Object.keys(updated).forEach((orderNumber) => {
          const order = orders.find((o) => o.order_number === orderNumber);
          if (updated[orderNumber] > 0) {
            updated[orderNumber] -= 1;
            // Check for 1 minute warning for both physical processing and online confirmed orders
            const isInToBePrepared = (order?.status.toLowerCase() === 'processing' && order?.order_type?.toLowerCase() === 'physical') ||
                (order?.status.toLowerCase() === 'confirmed' && order?.order_type?.toLowerCase() === 'online');

            if (updated[orderNumber] === 60 && isInToBePrepared) {
              setMessage(`⚠️ Order #${orderNumber} needs to be ready in 1 minute!`);
            }
          } else if (updated[orderNumber] <= 0) {
            // Check if order is overdue and in the right status
            const isPhysicalOverdue = order?.status.toLowerCase() === 'processing' && order?.order_type?.toLowerCase() === 'physical';
            const isOnlineOverdue = order?.status.toLowerCase() === 'confirmed' && order?.order_type?.toLowerCase() === 'online';

            if (isPhysicalOverdue) {
              physicalOverdueOrders.push(orderNumber);
              updated[orderNumber] = -1;
            } else if (isOnlineOverdue) {
              onlineOverdueOrders.push(orderNumber);
              updated[orderNumber] = -1;
            }
          }
        });

        // Show overdue notifications only for the current active tab type
        if (activeTab === 'to_be_prepared') {
          if (outerActiveTab === 'physical' && physicalOverdueOrders.length > 0) {
            setMessage(`⏰ Physical Overdue Orders: #${physicalOverdueOrders.join(', #')}!`);
            setBlink(true);
            setTimeout(() => setBlink(false), 500);
            setTimeout(() => setBlink(true), 1000);
          } else if (outerActiveTab === 'online' && onlineOverdueOrders.length > 0) {
            setMessage(`⏰ Online Overdue Orders: #${onlineOverdueOrders.join(', #')}!`);
            setBlink(true);
            setTimeout(() => setBlink(false), 500);
            setTimeout(() => setBlink(true), 1000);
          }
        }

        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [orders, activeTab, outerActiveTab, setMessage]);

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(''), 5000);
      setMessageTimeout(timeout);
      return () => clearTimeout(timeout);
    }
  }, [message, setMessage]);

  const filteredOrdersByType = useMemo(
      () => orders.filter((order) => {
        const orderDate = new Date(order.order_date).toISOString().split('T')[0];
        const isToday = orderDate === selectedDate;
        const isCompletedOrCancelled = order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'cancelled';
        return (order.order_type === outerActiveTab || !order.order_type) && (!isCompletedOrCancelled || isToday);
      }),
      [orders, outerActiveTab, selectedDate]
  );

  const handlePaymentOrderSelect = useCallback((order: Order) => {
    setSelectedPaymentOrder(order);
    setShowPaymentModal(true);
  }, []);

  const handlePreparationOrderSelect = useCallback((order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  }, []);

  const handleRiderAssignment = useCallback((order: Order) => {
    setSelectedRiderOrder(order);
    setShowRiderModal(true);
  }, []);

  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {
      pending: [],
      confirmed: [],
      to_be_prepared: [],
      ready: [],
      served: [],
      out_for_delivery: [],
      cancelled: [],
      completed: [],
    };

    filteredOrdersByType.forEach((order) => {
      const status = order.status?.toLowerCase();
      const type = order.order_type?.toLowerCase();

      if (status === 'pending' && type === 'online' && outerActiveTab === 'online') {
        groups.pending.push(order);
      } else if (status === 'pending' && type === 'physical' && outerActiveTab === 'physical') {
        groups.pending.push(order);
      } else if ((status === 'processing' && type === 'physical') || (status === 'confirmed' && type === 'online')) {
        groups.to_be_prepared.push(order);
      } else if (status === 'ready') {
        groups.ready.push(order);
      } else if (status === 'served' && type === 'physical') {
        groups.served.push(order);
      } else if (status === 'out_for_delivery' && type === 'online') {
        groups.out_for_delivery.push(order);
      } else if (status === 'cancelled') {
        groups.cancelled.push(order);
      } else if (status === 'completed') {
        groups.completed.push(order);
      }
    });

    Object.keys(groups).forEach((status) =>
        groups[status].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    );

    return groups;
  }, [filteredOrdersByType, outerActiveTab]);

  const filteredOrders = useMemo(() => {
    const ordersInActiveTab = groupedOrders[activeTab || ''] || [];
    let filtered = ordersInActiveTab;
    if (activeTab === 'to_be_prepared' || activeTab === 'pending') {
      filtered = ordersInActiveTab.filter(
          (order) =>
              order.customer_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
              order._id?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
              order.order_number.toString().includes(debouncedSearchTerm.toLowerCase())
      );
    } else if (activeTab === 'ready' || activeTab === 'out_for_delivery') {
      filtered = ordersInActiveTab.filter(
          (order) =>
              order.customer_name?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
              order._id?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
              order.order_number.toString().includes(paymentSearchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [groupedOrders, activeTab, debouncedSearchTerm, paymentSearchTerm]);

  const paginatedOrders = useMemo(
      () => filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage),
      [filteredOrders, page, itemsPerPage]
  );

  const getTabUnreadCount = useCallback((tabKey: string): number => {
    const currentTabOrders = (groupedOrders[tabKey] || []).filter(
        o => o.order_type?.toLowerCase() === outerActiveTab
    );
    return currentTabOrders.filter((order) => order.notification_status === 0).length;
  }, [groupedOrders, outerActiveTab]);

  const getTimeDisplay = useCallback((order: Order) => {
    const timeLeft = getQueueTimeLeft(order.order_number);
    // Check if order is in to_be_prepared status (either processing for physical or confirmed for online)
    const isInToBePrepared = (order.status.toLowerCase() === 'processing' && order.order_type?.toLowerCase() === 'physical') ||
        (order.status.toLowerCase() === 'confirmed' && order.order_type?.toLowerCase() === 'online');

    if (timeLeft && isInToBePrepared) {
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
  }, [queueCountdowns, orders]);

  const getQueueTimeLeft = useCallback((orderNumber: string) => {
    if (!Array.isArray(queueData)) return null;
    const queueOrder = queueData.find((q: QueueOrder) => q.order_number === orderNumber);
    const countdown = queueCountdowns[orderNumber];
    const order = orders.find((o) => o.order_number === orderNumber);
    if (!queueOrder || countdown === undefined) return null;

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    // Check if order is in to_be_prepared status (either processing for physical or confirmed for online)
    const isInToBePrepared = (order?.status.toLowerCase() === 'processing' && order?.order_type?.toLowerCase() === 'physical') ||
        (order?.status.toLowerCase() === 'confirmed' && order?.order_type?.toLowerCase() === 'online');

    const isOverdue = countdown < 0 && isInToBePrepared;
    const isUrgent = countdown > 0 && countdown <= 60;

    return {
      minutes,
      seconds,
      isOverdue,
      isUrgent,
      estimatedTime: queueOrder.estimated_time || 'N/A',
      formattedTime: isOverdue ? 'OVERDUE' : countdown >= 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : '',
    };
  }, [queueData, queueCountdowns, orders]);

  const renderOrderItemImage = useCallback((item: any) =>
      item.product_id?.pictureUrl ? (
          <img src={item.product_id.pictureUrl} alt={item.product_id.name} className="w-8 h-8 object-cover rounded-md" />
      ) : (
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)', color: 'var(--text-tertiary)' }}>
            <FontAwesomeIcon icon={faShoppingBag} className="text-base" />
          </div>
      ), []);

  const getStatusBadge = useCallback((status: string) => {
    const [bgColor, textColor, borderColor] = ({
      pending: ['#ffe0b2', '#000', '#f57c00'],
      processing: ['#bbdefb', '#000', '#1976d2'],
      ready: ['#c8e6c9', '#000', '#388e3c'],
      served: ['#b3e5fc', '#000', '#0288d1'],
      out_for_delivery: ['#b3e5fc', '#000', '#0288d1'],
      cancelled: ['#ef9a9a', '#000', '#d32f2f'],
      completed: ['#fff9c4', '#000', '#fdd835'],
    })[status.toLowerCase()] || ['var(--background-secondary)', 'var(--text-secondary)', 'var(--border-color)'];
    return { backgroundColor: bgColor, color: textColor, borderColor };
  }, []);

  const currentTab = useMemo(
      () => (outerActiveTab === 'physical' ? physicalTabs : onlineTabs).find((tab) => tab.key === activeTab),
      [outerActiveTab, activeTab]
  );

  const getMessageStyles = useCallback((message: string) => {
    const [borderColor, bgColor, textColor] =
        message.includes('Failed') || message.includes('Please log in')
            ? ['#dc2626', 'rgb(255,235,238)', '#d32f2f']
            : message.includes('Order #') && (message.includes('ready') || message.includes('served') || message.includes('completed') || message.includes('out for delivery'))
                ? ['#059669', 'rgb(232,245,233)', '#388e3c']
                : message.includes('Overdue') || message.includes('needs to be ready')
                    ? ['#d97706', 'rgba(255,228,120,0.95)', '#ba7625']
                    : ['var(--border-color)', 'var(--background-secondary)', 'var(--text-secondary)'];
    return { borderColor, backgroundColor: bgColor, color: textColor };
  }, []);

  const handleNotificationClick = useCallback((tabKey: string) => {
    setSelectedNotificationTab(tabKey);
    setShowModal(true);
  }, []);

  if (!userPermissions.some(perm => ['manage_prepared_orders', 'manage_ready_orders', 'manage_served_orders', 'manage_completed_orders', 'accept_onlineorders', 'manage_cancelled_orders','Manage_order_delivery'].includes(perm))) {
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
                  onClick={() => (document.getElementById('order-date-picker') as HTMLInputElement)?.showPicker()}
                  style={{
                    backgroundColor: 'var(--background-color)',
                    borderColor: 'var(--border-color)',
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
                  const getOuterTabColors = (tabKey: string, tabIndex: number) => {
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

                  type TabKey = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'out_for_delivery' | 'completed' | 'cancelled' | 'default';

                  const getTabColors = (tabKey: TabKey) => {
                    const colorMap: Record<TabKey, { active: string; light: string; text: string; gradient: string }> = {
                      pending: {
                        active: '#ff6b35',
                        light: '#ff6b351a',
                        text: '#ffffff',
                        gradient: 'linear-gradient(135deg, #ff6b35, #ff8c61)',
                      },
                      confirmed: {
                        active: '#34c759',
                        light: '#34c7591a',
                        text: '#ffffff',
                        gradient: 'linear-gradient(135deg, #34c759, #52d174)',
                      },
                      preparing: {
                        active: '#4285f4',
                        light: '#4285f41a',
                        text: '#ffffff',
                        gradient: 'linear-gradient(135deg, #4285f4, #69a1ff)',
                      },
                      ready: {
                        active: '#f4b400',
                        light: '#f4b4001a',
                        text: '#ffffff',
                        gradient: 'linear-gradient(135deg, #f4b400, #ffcd38)',
                      },
                      served: {
                        active: '#00c4b4',
                        light: '#00c4b41a',
                        text: '#ffffff',
                        gradient: 'linear-gradient(135deg, #00c4b4, #1ee0cc)',
                      },
                      out_for_delivery: {
                        active: '#9c27b0',
                        light: '#9c27b01a',
                        text: '#ffffff',
                        gradient: 'linear-gradient(135deg, #9c27b0, #b44ac0)',
                      },
                      completed: {
                        active: '#4caf50',
                        light: '#4caf501a',
                        text: '#ffffff',
                        gradient: 'linear-gradient(135deg, #4caf50, #66bb6a)',
                      },
                      cancelled: {
                        active: '#d32f2f',
                        light: '#d32f2f1a',
                        text: '#ffffff',
                        gradient: 'linear-gradient(135deg, #d32f2f, #ef5350)',
                      },
                      default: {
                        active: '#757575',
                        light: '#7575751a',
                        text: '#ffffff',
                        gradient: 'linear-gradient(135deg, #757575, #9e9e9e)',
                      },
                    };

                    return colorMap[tabKey] || colorMap.default;
                  };

                  const tabColors = getTabColors(tab.key as TabKey);

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

        {(activeTab === 'ready' || activeTab === 'out_for_delivery') && (
            <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
              <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
                {activeTab === 'ready' ? (
                    <>
                      <FontAwesomeIcon icon={faShoppingBag} className="mr-2" />
                      Ready for Pickup
                    </>
                ) : (
                    <>
                      <FontAwesomeIcon icon={faTruck} className="mr-2" />
                      Out for Delivery
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
                outerActiveTab={outerActiveTab ?? 'physical'}
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
                preparationTime={preparationTime}           // ✅ add this
                setPreparationTime={setPreparationTime}     // ✅ add this
            />

        )}

        {showRiderModal && selectedRiderOrder && token && (
            <RiderAssignmentModal
                order={selectedRiderOrder}
                token={token}
                logout={logout}
                onClose={() => {
                  setShowRiderModal(false);
                  setSelectedRiderOrder(null);
                }}
                setOrders={setOrders}
                setMessage={setMessage}
            />
        )}

        {activeTab && (
            <div className="space-y-2">
              {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                      <div
                          key={order._id}
                          className={`rounded-lg shadow-sm border-l-4 transition-all duration-200 hover:shadow-md ${
                              order.notification_status === 0 ? 'ring-2 ring-[var(--primary-light)]' : ''
                          } p-3`}
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
                                {order.waiter && (
                                    <span
                                        className="px-2 py-0.5 rounded-full text-xs"
                                        style={{ backgroundColor: 'var(--primary-light)', color: 'var(--text-color)' }}
                                    >
    Waiter: {typeof order.waiter === 'string' ? order.waiter : order.waiter.name}
  </span>
                                )}

                                {order.rider?.name && (
                                    <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--success-light)', color: 'var(--text-color)' }}>
                        Rider: {order.rider.name}
                      </span>
                                )}
                                {Array.isArray(order.linked_orders) && order.linked_orders.length > 0 && (
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
                                                    backgroundColor:
                                                        index % 4 === 0
                                                            ? 'var(--primary-color)'
                                                            : index % 4 === 1
                                                                ? 'var(--success-color)'
                                                                : index % 4 === 2
                                                                    ? 'var(--warning-color)'
                                                                    : 'var(--info-color)',
                                                  }}
                                              >
                                                <FontAwesomeIcon icon={faHashtag} className="text-xs" />
                                              </div>
                                              <span
                                                  className="px-1 py-0.5 rounded text-xs font-medium"
                                                  style={{
                                                    backgroundColor:
                                                        index % 4 === 0
                                                            ? 'var(--primary-light)'
                                                            : index % 4 === 1
                                                                ? 'var(--success-light)'
                                                                : index % 4 === 2
                                                                    ? 'var(--warning-light)'
                                                                    : 'var(--info-light)',
                                                    color: 'var(--text-color)',
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
                          {item.product_id?.name || 'Unknown'}
                        </span>
                                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          x{item.quantity} @ {formatPrice(item.product_id?.price || 0, activeCurrency)}
                        </span>
                                    </div>
                                  </div>
                              )) : <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No items</div>}
                            </div>
                          </div>
                          <div className="flex items-end space-x-3">
                            {activeTab === 'to_be_prepared' && getTimeDisplay(order)}
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
                              {activeTab === 'pending' && (
                                  <div className="flex flex-col space-y-2">
                                    <button
                                        onClick={async () => {
                                          if (!token) {
                                            setMessage('Please log in to retry this action.');
                                            return;
                                          }
                                          setIsLoading(true);
                                          try {
                                            const updatedOrder = await confirmOrder(token, logout, order.order_number, preparationTime);

                                            setOrders((prevOrders) =>
                                                prevOrders.map((o) =>
                                                    o.order_number === updatedOrder.order_number ? { ...updatedOrder, items: o.items } : o
                                                )
                                            );
                                            setMessage(`✅ Order #${order.order_number} is now Confirmed!`);
                                          } catch (error) {
                                            setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to confirm order'}`);
                                          } finally {
                                            setIsLoading(false);
                                          }
                                        }}
                                        className="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                                        style={{
                                          backgroundColor: 'var(--success-color)',
                                          color: 'var(--text-on-primary)',
                                        }}
                                        disabled={isLoading}
                                    >
                                      Confirm Order
                                    </button>
                                    <button
                                        onClick={async () => {
                                          if (!token) {
                                            setMessage('Please log in to retry this action.');
                                            return;
                                          }
                                          setIsLoading(true);
                                          try {
                                            const updatedOrder = await cancelOrder(token, logout, order.order_number);
                                            setOrders((prevOrders) =>
                                                prevOrders.map((o) =>
                                                    o.order_number === updatedOrder.order_number ? { ...updatedOrder, items: o.items } : o
                                                )
                                            );
                                            setMessage(`✅ Order #${order.order_number} is Cancelled!`);
                                          } catch (error) {
                                            setMessage(`❌ ${error instanceof Error ? error.message : 'Failed to cancel order'}`);
                                          } finally {
                                            setIsLoading(false);
                                          }
                                        }}
                                        className="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                                        style={{
                                          backgroundColor: '#dc2626',
                                          color: 'var(--text-on-primary)',
                                        }}
                                        disabled={isLoading}
                                    >
                                      Cancel Order
                                    </button>
                                  </div>
                              )}
                              {activeTab === 'ready' && order.order_type === 'online' && (
                                  <button
                                      onClick={() => handleRiderAssignment(order)}
                                      className="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md"
                                      style={{
                                        backgroundColor: 'var(--info-color)',
                                        color: 'var(--text-on-primary)',
                                      }}
                                  >
                                    Assign Rider & Send Out
                                  </button>
                              )}
                              {activeTab === 'ready' && order.order_type === 'physical' && (
                                  <button
                                      onClick={async () => {
                                        if (!token) {
                                          setMessage('Please log in');
                                          return;
                                        }
                                        setIsLoading(true);
                                        try {
                                          const updatedOrder = await markOrderAsServed(token, logout, order.order_number);
                                          updatedOrder.status = updatedOrder.status?.toLowerCase();

                                          setOrders(prev =>
                                              prev.map(o =>
                                                  o.order_number === updatedOrder.order_number
                                                      ? { ...updatedOrder, items: o.items, notification_status: 1 }
                                                      : o
                                              )
                                          );

                                          setMessage(`✅ Order #${order.order_number} is now served!`);
                                        } catch (err) {
                                          setMessage('❌ Failed to mark order as served');
                                        } finally {
                                          setIsLoading(false);
                                        }
                                      }}
                                      className="px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 hover:shadow-md"
                                      style={{
                                        backgroundColor: 'var(--success-color)',
                                        color: 'var(--text-on-primary)',
                                      }}
                                  >
                                    Mark as Served
                                  </button>
                              )}

                              {(activeTab === 'served' || activeTab === 'out_for_delivery') && (
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
                                            style={
                                              {
                                                backgroundColor: isLoading ? undefined : 'var(--primary-color)',
                                                color: isLoading ? 'var(--disabled-text)' : 'var(--text-on-primary)',
                                                '--tw-ring-color': 'var(--focus-ring)',
                                              } as React.CSSProperties & Record<string, string>
                                            }

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

        {filteredOrders.length > 0 && (
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
                        style={
                          {
                            backgroundColor: page === 1 ? 'var(--background-secondary)' : 'var(--primary-color)',
                            color: page === 1 ? 'var(--text-secondary)' : 'var(--text-on-primary)',
                            borderColor: 'var(--border-color)',
                            '--tw-ring-color': 'var(--focus-ring)',
                          } as React.CSSProperties & Record<string, string>
                        }

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
                        style={
                          {
                            backgroundColor:
                                page === Math.ceil(filteredOrders.length / itemsPerPage)
                                    ? 'var(--background-secondary)'
                                    : 'var(--primary-color)',
                            color:
                                page === Math.ceil(filteredOrders.length / itemsPerPage)
                                    ? 'var(--text-secondary)'
                                    : 'var(--text-on-primary)',
                            borderColor: 'var(--border-color)',
                            '--tw-ring-color': 'var(--focus-ring)',
                          } as React.CSSProperties & Record<string, string>
                        }

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

export type { OrderListProps, QueueOrder };
