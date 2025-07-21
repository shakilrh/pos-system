import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, PencilIcon, XMarkIcon, ClockIcon, UserIcon, HashtagIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { getAllOrders, assignTable, Order } from '../../services/orderService';
import { fetchFreeTables, Table } from '../../services/floorTableService';
import FlashMessage from '../FlashMessage';

interface AssignTableProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  setFlashMessage: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' } | null>>;
  isProductFormActive?: boolean;
}

const AssignTable: React.FC<AssignTableProps> = ({
                                                   token,
                                                   isAuthenticated,
                                                   logout,
                                                   tables,
                                                   setTables,
                                                   setFlashMessage,
                                                   isProductFormActive = false,
                                                 }) => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [freeTables, setFreeTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    setIsClient(true);
    const theme = document.querySelector('html')?.getAttribute('data-theme') || 'default';
    setCurrentTheme(theme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.querySelector('html')?.getAttribute('data-theme') || 'default';
          setCurrentTheme(newTheme);
        }
      });
    });

    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      observer.observe(htmlElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isClient && !isAuthenticated) {
      router.push('/login');
    }
  }, [isClient, isAuthenticated, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const fetchedOrders = await getAllOrders(token, logout);
        setOrders(fetchedOrders.filter(order =>
          order.service_type === 'dine_in' &&
          ['processing', 'ready'].includes(order.status.toLowerCase())
        ));
      } catch (err) {
        setFlashMessage({
          message: err instanceof Error ? err.message : 'Failed to fetch orders',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchFreeTablesData = async () => {
      if (!token) return;
      try {
        const fetchedFreeTables = await fetchFreeTables(token, logout);
        setFreeTables(fetchedFreeTables);
      } catch (err) {
        setFlashMessage({
          message: err instanceof Error ? err.message : 'Failed to fetch free tables',
          type: 'error',
        });
      }
    };

    if (isClient && isAuthenticated && token) {
      fetchOrders();
      fetchFreeTablesData();
    }
  }, [isClient, isAuthenticated, token, logout, setFlashMessage]);

  const getThemeColors = () => {
    if (currentTheme === 'dark' || currentTheme === 'dark-pro') {
      return {
        cardBackground: '#e0f2fe',
        cardBorder: '#bfdbfe',
        cardText: '#1e3a8a',
        headingText: '#1e3a8a',
        inactiveTabText: '#64748b',
        hoverTabText: '#1e3a8a',
        backgroundColor: '#1a202c',
        textColor: '#e2e8f0',
        textSecondary: '#a0aec0',
        borderColor: '#2d3748',
        primaryColor: '#3b82f6',
        focusRing: '#60a5fa'
      };
    }
    switch (currentTheme) {
      case 'blue':
        return {
          cardBackground: '#eff6ff',
          cardBorder: '#bfdbfe',
          cardText: '#1e40af',
          headingText: '#1e40af',
          inactiveTabText: '#64748b',
          hoverTabText: '#1e40af',
          backgroundColor: '#f3f4f6',
          textColor: '#374151',
          textSecondary: '#6b7280',
          borderColor: '#d1d5db',
          primaryColor: '#3b82f6',
          focusRing: '#60a5fa'
        };
      case 'green':
        return {
          cardBackground: '#ecfdf5',
          cardBorder: '#6ee7b7',
          cardText: '#065f46',
          headingText: '#065f46',
          inactiveTabText: '#64748b',
          hoverTabText: '#065f46',
          backgroundColor: '#f3f4f6',
          textColor: '#374151',
          textSecondary: '#6b7280',
          borderColor: '#d1d5db',
          primaryColor: '#10b981',
          focusRing: '#34d399'
        };
      default:
        return {
          cardBackground: '#f3f4f6',
          cardBorder: '#d1d5db',
          cardText: '#374151',
          headingText: '#374151',
          inactiveTabText: '#64748b',
          hoverTabText: '#374151',
          backgroundColor: '#ffffff',
          textColor: '#374151',
          textSecondary: '#6b7280',
          borderColor: '#e5e7eb',
          primaryColor: '#3b82f6',
          focusRing: '#60a5fa'
        };
    }
  };

  const themeColors = getThemeColors();

  const ordersPerPage = 8;
  const filteredOrders = orders.filter(order =>
    searchQuery
      ? [
        order.order_number || '',
        order.customer_name || '',
      ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handleAssignTable = (order: Order) => {
    if (['processing', 'ready'].includes(order.status.toLowerCase())) {
      setSelectedOrder(order);
      setSelectedTableId(null);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedOrder || !selectedTableId || !token) return;

    setAssigning(selectedOrder.order_number);
    try {
      const updatedOrder = await assignTable(token, logout, selectedOrder.order_number, selectedTableId);
      setOrders(orders.map(o =>
        o.order_number === updatedOrder.order_number ? { ...o, table_id: selectedTableId } : o
      ));
      setTables(tables.map(t =>
        t._id === selectedTableId ? { ...t, status: 'occupied' } : t
      ));
      setFreeTables(freeTables.filter(t => t._id !== selectedTableId));
      setFlashMessage({
        message: `Table assigned to order ${selectedOrder.order_number}`,
        type: 'success',
      });
      setSelectedOrder(null);
      setSelectedTableId(null);
    } catch (err) {
      setFlashMessage({
        message: err instanceof Error ? err.message : 'Failed to assign table',
        type: 'error',
      });
    } finally {
      setAssigning(null);
    }
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setSelectedTableId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return {
          bg: '#f97316',
          text: '#ffffff',
          icon: ClockIcon
        };
      case 'ready':
        return {
          bg: '#34d399',
          text: '#ffffff',
          icon: CheckCircleIcon
        };
      default:
        return {
          bg: '#64748b',
          text: '#ffffff',
          icon: ClockIcon
        };
    }
  };

  const getCardGradient = (index: number) => {
    const gradients = [
      '#e0f2fe',
      '#ecfdf5',
      '#eff6ff',
      '#fefcbf',
      '#fee2e2',
      '#dbeafe',
    ];
    return gradients[index % gradients.length];
  };

  const getTableNumber = (tableId: string | null | undefined) => {
    if (!tableId) return 'N/A';
    const table = tables.find(t => t._id === tableId);
    return table ? table.number : 'N/A';
  };

  if (!isClient || !isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-[var(--background-color)] p-3" style={{ backgroundColor: themeColors.backgroundColor }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold mb-2" style={{ color: themeColors.headingText }}>🍽️ Table Assignment Center</h1>
            <p className="text-sm opacity-75" style={{ color: themeColors.inactiveTabText }}>Assign tables to your dine-in orders</p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 pl-10 text-sm rounded-lg border focus:ring-2 transition-colors duration-200"
                style={{
                  borderColor: themeColors.borderColor,
                  backgroundColor: themeColors.backgroundColor,
                  color: themeColors.textColor,
                  outlineColor: themeColors.focusRing,
                }}
                placeholder="Search orders by number or customer name..."
              />
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-purple-500 transition-colors duration-200" style={{ color: themeColors.textSecondary }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-base font-medium" style={{ color: themeColors.textSecondary }}>
              Loading orders...
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="relative mx-auto w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-20"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-3xl">🍽️</span>
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: themeColors.headingText }}>
              No Orders Available
            </h3>
            <p className="text-sm max-w-md mx-auto" style={{ color: themeColors.textSecondary }}>
              {searchQuery ? 'No orders match your search criteria.' : 'All caught up! No orders are waiting for table assignment.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {currentOrders.map((order, index) => {
                const statusInfo = getStatusColor(order.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={order.order_number}
                    className="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all duration-200"
                    style={{
                      background: getCardGradient(index),
                      minHeight: '200px'
                    }}
                  >
                    <div className="relative p-3 h-full flex flex-col justify-between" style={{ color: themeColors.cardText }}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <HashtagIcon className="w-4 h-4" />
                            <span className="text-base font-bold">{order.order_number}</span>
                          </div>
                          <div
                            className="px-2 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 shadow-sm"
                            style={{ background: statusInfo.bg, color: statusInfo.text }}
                          >
                            <StatusIcon className="w-4 h-4" />
                            <span>{order.status}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 mb-2">
                          <UserIcon className="w-4 h-4" />
                          <span className="text-base font-medium">{order.customer_name}</span>
                        </div>

                        <div className="space-y-2 mb-2">
                          <div className="flex justify-between text-xs opacity-90">
                            <span>Service Type:</span>
                            <span className="font-medium">Dine In</span>
                          </div>
                          <div className="flex justify-between text-xs opacity-90">
                            <span>Table Status:</span>
                            <span className="font-medium text-yellow-600">⏳ {order.table_id ? `Table ${getTableNumber(order.table_id)}` : 'Awaiting Assignment'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAssignTable(order)}
                        disabled={assigning === order.order_number}
                        className="w-full py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: themeColors.primaryColor,
                          color: themeColors.textColor,
                          borderColor: themeColors.borderColor
                        }}
                      >
                        {assigning === order.order_number ? (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Assigning...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <PencilIcon className="w-4 h-4" />
                            <span>Assign Table</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors duration-200"
                  style={{
                    backgroundColor: themeColors.backgroundColor,
                    color: themeColors.textSecondary,
                    borderColor: themeColors.borderColor,
                  }}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${currentPage === page ? 'text-white' : ''}`}
                    style={{
                      backgroundColor: currentPage === page ? themeColors.primaryColor : themeColors.backgroundColor,
                      color: currentPage === page ? themeColors.textColor : themeColors.textSecondary,
                      borderColor: themeColors.borderColor,
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors duration-200"
                  style={{
                    backgroundColor: themeColors.backgroundColor,
                    color: themeColors.textSecondary,
                    borderColor: themeColors.borderColor,
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--background-color)] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border border-[var(--border-color)]" style={{ backgroundColor: themeColors.backgroundColor, borderColor: themeColors.borderColor }}>
              <div className="flex justify-between items-center mb-5 border-b border-[var(--border-color)] pb-3" style={{ borderColor: themeColors.borderColor }}>
                <h3 className="text-xl font-bold" style={{ color: themeColors.textColor }}>🍽️ Assign Table</h3>
                <button onClick={closeModal} className="hover:text-[var(--error-color)]" style={{ color: themeColors.textSecondary }}>
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: themeColors.textSecondary }}>Order Number:</span>
                  <span style={{ color: themeColors.textColor }}>{selectedOrder.order_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: themeColors.textSecondary }}>Customer Name:</span>
                  <span style={{ color: themeColors.textColor }}>{selectedOrder.customer_name || 'N/A'}</span>
                </div>
                <div className="space-y-2">
                  <label className="block font-medium" style={{ color: themeColors.textSecondary }}>🪑 Select Table</label>
                  <div className="relative">
                    <select
                      value={selectedTableId || ''}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="w-full p-2.5 text-sm rounded-lg border focus:ring-2 transition-colors duration-200 appearance-none"
                      style={{
                        borderColor: selectedTableId ? themeColors.primaryColor : themeColors.borderColor,
                        backgroundColor: themeColors.backgroundColor,
                        color: themeColors.textColor,
                        outlineColor: themeColors.focusRing,
                      }}
                    >
                      <option value="" disabled>Choose a table...</option>
                      {freeTables.length > 0 ? (
                        freeTables.map((table) => (
                          <option key={table._id} value={table._id}>
                            🍽️ Table {table.number} - {table.floor_id?.name || 'Unknown Floor'}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No tables available</option>
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-4 h-4" style={{ color: themeColors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-lg transition-colors duration-200"
                  style={{
                    backgroundColor: themeColors.backgroundColor,
                    color: themeColors.textSecondary,
                    borderColor: themeColors.borderColor,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAssign}
                  disabled={!selectedTableId || assigning === selectedOrder.order_number}
                  className="px-4 py-2 text-sm rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: themeColors.primaryColor,
                    color: themeColors.textColor,
                    borderColor: themeColors.borderColor,
                  }}
                >
                  {assigning === selectedOrder.order_number ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Assigning...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Assign Table</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignTable;
