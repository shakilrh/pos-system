import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getAllOrders, assignTable, Order } from '../../services/orderService';
import { Table } from './tableTypes';
import FlashMessage from '../FlashMessage';

interface AssignTableProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  tables: Table[];
  freeTables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  setFlashMessage: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' } | null>>;
  isProductFormActive?: boolean;
}

const AssignTable: React.FC<AssignTableProps> = ({
                                                   token,
                                                   isAuthenticated,
                                                   logout,
                                                   tables,
                                                   freeTables = [],
                                                   setTables,
                                                   setFlashMessage,
                                                   isProductFormActive = false,
                                                 }) => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null); // Changed to table_id
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
        setOrders(fetchedOrders.filter(order => order.service_type === 'dine_in' && !order.table_number));
      } catch (err) {
        setFlashMessage({
          message: err instanceof Error ? err.message : 'Failed to fetch orders',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
    if (isClient && isAuthenticated && token) {
      fetchOrders();
    }
  }, [isClient, isAuthenticated, token, logout, setFlashMessage]);

  const getThemeColors = () => {
    if (currentTheme === 'dark' || currentTheme === 'dark-pro') {
      return {
        cardBackground: '#1f2937',
        cardBorder: '#374151',
        cardText: '#ffffff',
        headingText: '#ffffff',
        inactiveTabText: '#d1d5db',
        hoverTabText: '#ffffff'
      };
    }
    switch (currentTheme) {
      case 'blue':
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#1e3a8a',
          headingText: '#1e3a8a',
          inactiveTabText: '#6b7280',
          hoverTabText: '#1e3a8a'
        };
      case 'green':
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#064e3b',
          headingText: '#064e3b',
          inactiveTabText: '#6b7280',
          hoverTabText: '#064e3b'
        };
      default:
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#111827',
          headingText: '#111827',
          inactiveTabText: '#6b7280',
          hoverTabText: '#111827'
        };
    }
  };

  const themeColors = getThemeColors();

  const ordersPerPage = 6;
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
    setSelectedOrder(order);
    setSelectedTableId(null);
  };

  const handleConfirmAssign = async () => {
    if (!selectedOrder || !selectedTableId || !token) return;

    setAssigning(selectedOrder.order_number);
    try {
      const updatedOrder = await assignTable(token, logout, selectedOrder.order_number, selectedTableId);
      setOrders(orders.filter(o => o.order_number !== selectedOrder.order_number));
      setTables(tables.map(t =>
        t._id === selectedTableId ? { ...t, status: 'occupied' } : t
      ));
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

  if (!isClient || !isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-[var(--background-color)]">
      <div
        className="rounded-lg shadow-md border w-full mt-6"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.cardBorder,
          color: themeColors.cardText,
        }}
      >
        <div className="p-8">
          <h1 className="text-2xl font-semibold mb-8" style={{ color: themeColors.headingText }}>
            Assign Tables
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="w-full sm:w-72">
              <label className="block text-sm font-medium mb-2" style={{ color: themeColors.inactiveTabText }}>
                Search Orders
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2.5 pl-10 text-sm rounded-lg border focus:ring-2 transition-colors duration-200"
                  style={{
                    borderColor: themeColors.cardBorder,
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.cardText,
                    outlineColor: 'var(--focus-ring)',
                  }}
                  placeholder="Search by order number or customer name..."
                />
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: themeColors.inactiveTabText }} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary-color)' }}></div>
              <span className="ml-2" style={{ color: themeColors.inactiveTabText }}>Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-10">
              <div
                className="rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: themeColors.cardBorder }}
              >
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24" style={{ color: themeColors.inactiveTabText }}>
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.011 3.011 0 0 0 16.98 7c-.8 0-1.54.37-2.01.97L12 11.5l-2.97-3.53A3.011 3.011 0 0 0 7.02 7c-.8 0-1.54.37-2.01.97L2.5 16H5v6h2v-6h2l2.48-2.48L14 16h2v6h4zM7.5 6c.83 0 1.5-.67 1.5-1.5S8.33 3 7.5 3 6 3.67 6 4.5 6.67 6 7.5 6z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: themeColors.headingText }}>
                No Orders Available
              </h3>
              <p className="text-sm" style={{ color: themeColors.inactiveTabText }}>
                {searchQuery ? 'No orders match your search criteria.' : 'No dine-in orders are currently available for table assignment.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y table-fixed" style={{ borderColor: themeColors.cardBorder }}>
                <thead style={{ backgroundColor: 'var(--background-secondary)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/4" style={{ color: themeColors.inactiveTabText }}>
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/4" style={{ color: themeColors.inactiveTabText }}>
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/4" style={{ color: themeColors.inactiveTabText }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider w-1/4" style={{ color: themeColors.inactiveTabText }}>
                    Actions
                  </th>
                </tr>
                </thead>
                <tbody className="divide-y" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.cardBorder }}>
                {currentOrders.map((order) => (
                  <tr
                    key={order.order_number}
                    className="transition-colors duration-150 hover:bg-opacity-10"
                    style={{ '--hover-bg': 'var(--primary-color)' } as React.CSSProperties}
                  >
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: themeColors.cardText }}>
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: themeColors.cardText }}>
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'var(--warning-color)',
                          color: 'var(--text-on-primary)'
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handleAssignTable(order)}
                        disabled={isProductFormActive || assigning === order.order_number}
                        className="p-2 rounded-lg hover:bg-opacity-10 transition-colors duration-200 disabled:opacity-50"
                        style={{
                          color: 'var(--primary-color)',
                          backgroundColor: 'transparent'
                        }}
                        title="Assign table"
                      >
                        {assigning === order.order_number ? (
                          <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--primary-color)' }}>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <PencilIcon className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm rounded-lg disabled:opacity-50 transition-colors duration-200"
                style={{
                  backgroundColor: 'var(--background-secondary)',
                  color: themeColors.inactiveTabText,
                  borderColor: themeColors.cardBorder
                }}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                    currentPage === page ? 'text-white' : ''
                  }`}
                  style={{
                    backgroundColor: currentPage === page ? 'var(--primary-color)' : 'var(--background-secondary)',
                    color: currentPage === page ? 'var(--text-on-primary)' : themeColors.inactiveTabText,
                    borderColor: themeColors.cardBorder
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
                  backgroundColor: 'var(--background-secondary)',
                  color: themeColors.inactiveTabText,
                  borderColor: themeColors.cardBorder
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div
              className="rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl border"
              style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.cardBorder }}
            >
              <div className="flex justify-between items-center mb-5 border-b pb-3" style={{ borderColor: themeColors.cardBorder }}>
                <h3 className="text-xl font-bold" style={{ color: themeColors.headingText }}>Assign Table</h3>
                <button
                  onClick={closeModal}
                  className="transition-colors duration-200 hover:opacity-80"
                  style={{ color: themeColors.inactiveTabText }}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: themeColors.inactiveTabText }}>Order Number:</span>
                  <span style={{ color: themeColors.cardText }}>{selectedOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{ color: themeColors.inactiveTabText }}>Customer Name:</span>
                  <span style={{ color: themeColors.cardText }}>{selectedOrder.customer_name}</span>
                </div>
                <div className="space-y-2">
                  <label className="block font-medium" style={{ color: themeColors.inactiveTabText }}>Select Table:</label>
                  <select
                    value={selectedTableId || ''}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 transition-colors duration-200"
                    style={{
                      borderColor: themeColors.cardBorder,
                      backgroundColor: themeColors.cardBackground,
                      color: themeColors.cardText,
                      outlineColor: 'var(--focus-ring)'
                    }}
                  >
                    <option value="" disabled>Select a table</option>
                    {freeTables.length > 0 ? (
                      freeTables.map((table) => (
                        <option key={table._id} value={table._id}>
                          Table {table.number} - {table.floor_id?.name || 'Unknown Floor'}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No free tables available</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-sm font-medium border hover:opacity-80 transition-colors duration-200"
                  style={{
                    borderColor: themeColors.cardBorder,
                    color: themeColors.inactiveTabText,
                    backgroundColor: 'var(--background-secondary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAssign}
                  disabled={!selectedTableId || assigning === selectedOrder.order_number}
                  className="px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: !selectedTableId || assigning === selectedOrder.order_number ? themeColors.cardBorder : 'var(--primary-color)',
                    color: !selectedTableId || assigning === selectedOrder.order_number ? themeColors.inactiveTabText : 'var(--text-on-primary)',
                    ringColor: 'var(--focus-ring)'
                  }}
                >
                  {assigning === selectedOrder.order_number ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Assigning...
                    </span>
                  ) : (
                    'Assign Table'
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
