import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { fetchFloors, fetchTables, fetchFreeTables, deleteTable, deleteFloor } from '../../services/floorTableService';
import { Floor, Table } from './tableTypes';
import FlashMessage from '../FlashMessage';
import FloorCrud from './FloorCrud';
import TableList from './TableList';
import FloorList from './FloorList';
import TableCrud from './TableCrud';
import AssignTable from './AssignTable';
import { UserGroupIcon } from '@heroicons/react/24/outline';

interface FloorTableManagementProps {
  onFormActive?: (active: boolean) => void;
  isProductFormActive?: boolean;
}

export default function FloorTableManagement({
                                               onFormActive,
                                               isProductFormActive = false,
                                             }: FloorTableManagementProps) {
  const { isAuthenticated, token, logout } = useAuth();
  const router = useRouter();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [freeTables, setFreeTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemBeingDeleted, setItemBeingDeleted] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [deleteFloorConfirm, setDeleteFloorConfirm] = useState<string | null>(null);
  const [deleteTableConfirm, setDeleteTableConfirm] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tables' | 'floors' | 'assignTable'>('tables');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<string>('default');

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
    if (!isClient || !isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setFlashMessage(null);
      try {
        const [floorList, tableList, freeTableList] = await Promise.all([
          fetchFloors(token, logout),
          fetchTables(token, logout),
          fetchFreeTables(token, logout),
        ]);
        setFloors(floorList);
        setTables(tableList);
        setFreeTables(freeTableList);
        if (floorList.length > 0 && activeFloor === null) setActiveFloor(null);
      } catch (err) {
        setFlashMessage({
          message: err instanceof Error ? err.message : 'Failed to fetch data',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isClient, isAuthenticated, token, logout]);

  useEffect(() => {
    const isFormActive = !!editingFloorId || !!editingTableId;
    if (onFormActive) {
      onFormActive(isFormActive);
    }
  }, [editingFloorId, editingTableId, onFormActive]);

  if (!isClient || !isAuthenticated) {
    return null;
  }

  const handleAddFloor = () => {
    setSelectedFloor(null);
    setEditingFloorId('add');
  };

  const handleEditFloor = (floor: Floor) => {
    setSelectedFloor(floor);
    setEditingFloorId(floor._id);
  };

  const handleDeleteFloor = (floorId: string) => {
    const floor = floors.find((f) => f._id === floorId);
    if (floor) {
      setSelectedFloor(floor);
      setDeleteFloorConfirm(floorId);
    }
  };

  const handleDeleteFloorConfirm = async (floorId: string) => {
    setItemBeingDeleted(floorId);
    try {
      await deleteFloor(token!, logout, floorId);
      setFloors(floors.filter((f) => f._id !== floorId));
      setFlashMessage({
        message: `Floor "${selectedFloor?.name}" deleted successfully!`,
        type: 'success',
      });
    } catch (err) {
      setFlashMessage({
        message: err instanceof Error ? err.message : 'Failed to delete floor',
        type: 'error',
      });
    } finally {
      setItemBeingDeleted(null);
      setDeleteFloorConfirm(null);
      setSelectedFloor(null);
    }
  };

  const handleAddTable = () => {
    setSelectedTable(null);
    setEditingTableId('add');
  };

  const handleEditTable = (table: Table) => {
    setSelectedTable(table);
    setEditingTableId(table._id);
  };

  const handleDeleteTable = (tableId: string) => {
    const table = tables.find((t) => t._id === tableId);
    if (table) {
      setSelectedTable(table);
      setDeleteTableConfirm(tableId);
    }
  };

  const handleDeleteTableConfirm = async (tableId: string) => {
    setItemBeingDeleted(tableId);
    try {
      await deleteTable(token!, logout, tableId);
      setTables(tables.filter((t) => t._id !== tableId));
      setFlashMessage({
        message: `Table "${selectedTable?.number}" deleted successfully!`,
        type: 'success',
      });
    } catch (err) {
      setFlashMessage({
        message: err instanceof Error ? err.message : 'Failed to delete table',
        type: 'error',
      });
    } finally {
      setItemBeingDeleted(null);
      setDeleteTableConfirm(null);
      setSelectedTable(null);
    }
  };

  const resetTableForm = () => {
    setSelectedTable(null);
    setEditingTableId(null);
  };

  const resetFloorForm = () => {
    setSelectedFloor(null);
    setEditingFloorId(null);
  };

  const handleTabChange = (tab: 'tables' | 'floors' | 'assignTable') => {
    setActiveTab(tab);
  };

  const getThemeColors = () => {
    if (currentTheme === 'dark' || currentTheme === 'dark-pro') {
      return {
        cardBackground: '#1f2937',
        cardBorder: '#374151',
        cardText: '#ffffff',
        headingText: '#ffffff',
        inactiveTabText: '#d1d5db',
        hoverTabText: '#ffffff',
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
          hoverTabText: '#1e3a8a',
        };
      case 'green':
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#064e3b',
          headingText: '#064e3b',
          inactiveTabText: '#6b7280',
          hoverTabText: '#064e3b',
        };
      default:
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#111827',
          headingText: '#111827',
          inactiveTabText: '#6b7280',
          hoverTabText: '#111827',
        };
    }
  };

  const themeColors = getThemeColors();

  if (loading) {
    return <div>Loading...</div>;
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
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-6" style={{ color: themeColors.headingText }}>
            Floor & Table Management
          </h1>
          <div
            className="border-b mb-6 w-full"
            style={{
              borderColor: themeColors.cardBorder,
            }}
          >
            <nav className="flex space-x-6" aria-label="Tabs">
              {[
                { label: 'Tables', key: 'tables' },
                { label: 'Floors', key: 'floors' },
                { label: 'Assign Table', key: 'assignTable' },
              ].map(({ label, key }) => (
                <button
                  key={key}
                  onClick={() => handleTabChange(key as 'tables' | 'floors' | 'assignTable')}
                  style={{
                    borderBottomColor:
                      activeTab === key ? 'var(--primary-color)' : 'transparent',
                    color:
                      activeTab === key ? 'var(--primary-color)' : themeColors.inactiveTabText,
                    background: 'none',
                  }}
                  className="
                    py-3 px-4 text-sm font-medium border-b-2
                    focus:outline-none transition-colors duration-150
                  "
                  onMouseEnter={(e) => {
                    if (activeTab !== key) {
                      e.currentTarget.style.color = themeColors.hoverTabText;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== key) {
                      e.currentTarget.style.color = themeColors.inactiveTabText;
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="bg-[var(--background-secondary)] border border-[var(--border-color)] p-6" style={{ borderRadius: '0px' }}>
            {flashMessage && (
              <FlashMessage
                message={flashMessage.message}
                type={flashMessage.type}
                onClose={() => setFlashMessage(null)}
              />
            )}

            {/* Tables Tab */}
            {activeTab === 'tables' && (
              editingTableId ? (
                <TableCrud
                  token={token}
                  logout={logout}
                  tables={tables}
                  setTables={setTables}
                  floors={floors}
                  table={selectedTable}
                  editingTableId={editingTableId}
                  onCancel={resetTableForm}
                  isProductFormActive={isProductFormActive}
                  mode={editingTableId === 'add' ? 'add' : 'edit'}
                  setFlashMessageInParent={setFlashMessage}
                />
              ) : (
                <TableList
                  token={token}
                  isAuthenticated={isAuthenticated}
                  logout={logout}
                  tables={tables}
                  floors={floors}
                  freeTables={freeTables}
                  activeFloor={activeFloor}
                  setActiveFloor={setActiveFloor}
                  onAdd={handleAddTable}
                  onEdit={handleEditTable}
                  onDelete={handleDeleteTable}
                  isLoading={{ fetch: loading, delete: !!itemBeingDeleted }}
                  itemBeingDeleted={itemBeingDeleted}
                  flashMessage={flashMessage}
                  setFlashMessage={setFlashMessage}
                  isProductFormActive={isProductFormActive}
                />
              )
            )}

            {/* Floors Tab */}
            {activeTab === 'floors' && (
              editingFloorId ? (
                <FloorCrud
                  token={token}
                  logout={logout}
                  floors={floors}
                  setFloors={setFloors}
                  floor={selectedFloor}
                  editingFloorId={editingFloorId}
                  onCancel={resetFloorForm}
                  isProductFormActive={isProductFormActive}
                  mode={editingFloorId === 'add' ? 'add' : 'edit'}
                  setFlashMessageInParent={setFlashMessage}
                />
              ) : (
                <FloorList
                  floors={floors}
                  activeFloor={activeFloor}
                  setActiveFloor={setActiveFloor}
                  onAdd={handleAddFloor}
                  onEdit={handleEditFloor}
                  onDelete={handleDeleteFloor}
                  isLoading={{ fetch: loading, delete: !!itemBeingDeleted }}
                  itemBeingDeleted={itemBeingDeleted}
                  setDeleteConfirm={setDeleteFloorConfirm}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                />
              )
            )}

            {/* Assign Table Tab */}
            {activeTab === 'assignTable' && (
              <AssignTable
                token={token}
                isAuthenticated={isAuthenticated}
                logout={logout}
                tables={tables}
                freeTables={freeTables}
                setTables={setTables}
                setFlashMessage={setFlashMessage}
                isProductFormActive={isProductFormActive}
              />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modals */}
      {deleteTableConfirm && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface-color)] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-6 h-6" fill="currentColor" style={{ color: 'var(--error-color)' }} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Confirm Delete</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete the table "{selectedTable.number}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteTableConfirm(deleteTableConfirm)}
                disabled={itemBeingDeleted === deleteTableConfirm}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${itemBeingDeleted === deleteTableConfirm ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--error-color)] text-white hover:bg-opacity-90'}`}
                style={{ '--tw-ring-color': 'var(--focus-ring)' }}
              >
                {itemBeingDeleted === deleteTableConfirm ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                onClick={() => setDeleteTableConfirm(null)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${itemBeingDeleted === deleteTableConfirm ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--background-secondary)]'}`}
                style={{ backgroundColor: itemBeingDeleted === deleteTableConfirm ? undefined : 'var(--background-color)', '--tw-ring-color': 'var(--focus-ring)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteFloorConfirm && selectedFloor && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface-color)] rounded-lg p-3 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-6 h-6" fill="currentColor" style={{ color: 'var(--error-color)' }} viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Confirm Delete</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete the floor "{selectedFloor.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteFloorConfirm(deleteFloorConfirm)}
                disabled={itemBeingDeleted === deleteFloorConfirm}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${itemBeingDeleted === deleteFloorConfirm ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--error-color)] text-white hover:bg-opacity-90'}`}
                style={{ '--tw-ring-color': 'var(--focus-ring)' }}
              >
                {itemBeingDeleted === deleteFloorConfirm ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
              <button
                onClick={() => setDeleteFloorConfirm(null)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${itemBeingDeleted === deleteFloorConfirm ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--background-secondary)]'}`}
                style={{ backgroundColor: itemBeingDeleted === deleteTableConfirm ? undefined : 'var(--background-color)', '--tw-ring-color': 'var(--focus-ring)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
