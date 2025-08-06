import React, { useState, useMemo } from 'react';
import { Edit3, Trash2, Plus, ChevronLeft, ChevronRight, Users, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
// Import Heroicons for consistency with RoleList
import { PlusIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
interface Table {
  _id: string;
  number: number;
  floor_id: { _id: string; name: string };
  status?: 'free' | 'reserved';
}

interface TableListProps {
  token: string | null;
  isAuthenticated: boolean;
  logout: () => void;
  tables: Table[];
  activeFloor: string | null;
  floors: { _id: string; name: string }[];
  freeTables: Table[];
  setActiveFloor: (id: string | null) => void;
  onAdd: () => void;
  onEdit: (table: Table) => void;
  onDelete: (id: string) => void;
  isLoading: { fetch: boolean; delete: boolean };
  itemBeingDeleted: string | null;
  flashMessage?: { message: string; type: 'success' | 'error' } | null;
  setFlashMessage?: (message: { message: string; type: 'success' | 'error' } | null) => void;
  isProductFormActive: boolean;
  loadTables: () => Promise<void>; // Add loadTables prop
}

export default function TableList({
                                    token,
                                    isAuthenticated,
                                    logout,
                                    tables,
                                    activeFloor,
                                    floors,
                                    freeTables,
                                    setActiveFloor,
                                    onAdd,
                                    onEdit,
                                    onDelete,
                                    isLoading,
                                    itemBeingDeleted,
                                    flashMessage,
                                    setFlashMessage,
                                    isProductFormActive,
                                    loadTables, // Destructure loadTables
                                  }: TableListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter tables by active floor
  const filteredTables = tables.filter(table =>
    activeFloor ? table.floor_id._id === activeFloor : true
  );

  // Add status to tables based on freeTables
  const tablesWithStatus = filteredTables.map(table => {
    const isFree = freeTables.some(freeTable => freeTable._id === table._id);
    return {
      ...table,
      status: isFree ? 'free' as const : 'reserved' as const
    };
  });

  // Pagination logic
  const totalItems = tablesWithStatus.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTables = tablesWithStatus.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeFloor, itemsPerPage]);

  // Calculate counts
  const freeCount = tablesWithStatus.filter(table => table.status === 'free').length;
  const reservedCount = tablesWithStatus.filter(table => table.status === 'reserved').length;
  const totalTables = tablesWithStatus.length;
  const { userPermissions, permissionsLoaded } = useAuth();

  // Calculate capacity percentage for progress bar
  const capacityPercentage = totalTables > 0 ? Math.round((reservedCount / totalTables) * 100) : 0;

  const handleFloorClick = (floorId: string | null) => {
    setActiveFloor(floorId);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  // Enhanced professional color scheme
  const getStatusColors = (status: 'free' | 'reserved') => {
    if (status === 'free') {
      return {
        primary: '#10B981', // Emerald-500
        light: '#D1FAE5', // Emerald-100
        dark: '#047857', // Emerald-700
        border: '#6EE7B7', // Emerald-300
        shadow: 'rgba(16, 185, 129, 0.2)'
      };
    } else {
      return {
        primary: '#F59E0B', // Amber-500
        light: '#FEF3C7', // Amber-100
        dark: '#D97706', // Amber-600
        border: '#FCD34D', // Amber-300
        shadow: 'rgba(245, 158, 11, 0.2)'
      };
    }
  };

  return (
    <div className="p-4">
      {/* Header with Floor Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
              onClick={() => handleFloorClick(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeFloor === null
                      ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]'
                      : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary))] hover:bg-[var(--surface-secondary)]'
              }`}
          >
            <i className="fas fa-layer-group mr-2"></i>
            All Floors
          </button>
          {floors.map(floor => (
              <button
                  key={floor._id}
                  onClick={() => handleFloorClick(floor._id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeFloor === floor._id
                          ? 'bg-[var(--primary-color)] text-[var(--text-on-primary)]'
                          : 'bg-[var(--background-secondary)] text-[var(--button-inactive-text, var(--text-secondary))] hover:bg-[var(--surface-secondary)]'
                  }`}
              >
                <i className="fas fa-building mr-2"></i>
                {floor.name}
              </button>
          ))}
        </div>

        {/* Compact Status Cards - Reduced Height */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-blue-500 text-white rounded-lg p-3 shadow-sm transform hover:scale-102 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Total Tables</p>
                <p className="text-xl font-bold">{totalTables}</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Users size={14} />
              </div>
            </div>
          </div>

          <div className="bg-amber-500 text-white rounded-lg p-3 shadow-sm transform hover:scale-102 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Reserved</p>
                <p className="text-xl font-bold">{reservedCount}</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Clock size={14} />
              </div>
            </div>
          </div>

          <div className="bg-emerald-500 text-white rounded-lg p-3 shadow-sm transform hover:scale-102 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Available</p>
                <p className="text-xl font-bold">{freeCount}</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <CheckCircle size={14} />
              </div>
            </div>
          </div>

          <div className="bg-purple-500 text-white rounded-lg p-3 shadow-sm transform hover:scale-102 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Capacity</p>
                <p className="text-xl font-bold">{capacityPercentage}%</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <BarChart3 size={14} />
              </div>
            </div>
            <div className="mt-2 w-full rounded-full h-1 bg-white bg-opacity-30">
              <div
                className="h-1 rounded-full transition-all duration-500 bg-white"
                style={{ width: `${capacityPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Add Button Only */}
        <div className="flex justify-end mb-4">
          {userPermissions.includes('can_add_tables') && (
              <button
                  onClick={onAdd}
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200"
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'var(--text-on-primary)',
                    '--tw-ring-color': 'var(--focus-ring)',
                  }}
              >
                <PlusIcon className="w-5 h-5" />
                <span>Add New Table</span>
              </button>
          )}
        </div>
      </div>

      {/* Table Grid - 5 tables per line */}
      {isLoading.fetch ? (
        <div className="flex justify-center items-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200"></div>
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent absolute top-0"></div>
          </div>
          <span className="ml-4 text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
            Loading tables...
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 mb-4">
            {currentTables.map((table) => {
              const colors = getStatusColors(table.status);
              return (
                <div key={table._id} className="group relative">
                  <div
                    className="relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 bg-white"
                    style={{
                      borderColor: colors.border,
                      boxShadow: `0 4px 15px ${colors.shadow}`,
                    }}
                  >
                    {/* Decorative Corner Elements */}
                    <div
                      className="absolute top-0 left-0 w-8 h-8 rounded-br-full opacity-20"
                      style={{ backgroundColor: colors.primary }}
                    ></div>
                    <div
                      className="absolute bottom-0 right-0 w-6 h-6 rounded-tl-full opacity-20"
                      style={{ backgroundColor: colors.primary }}
                    ></div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <div
                        className="px-2 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        {table.status === 'free' ? 'FREE' : 'RESERVED'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {userPermissions.includes('can_edit_tables') && (
                        <button
                          onClick={() => onEdit(table)}
                          className="p-1.5 bg-blue-500 text-white rounded-full hover:scale-110 transition-all duration-200 shadow-md"
                          title="Edit Table"
                        >
                          <Edit3 size={10} />
                        </button>
                      )}
                      {userPermissions.includes('can_delete_tables') && (
                        <button
                          onClick={() => onDelete(table._id)}
                          disabled={itemBeingDeleted === table._id}
                          className="p-1.5 bg-red-500 text-white rounded-full hover:scale-110 transition-all duration-200 shadow-md"
                          title="Delete Table"
                        >
                          {itemBeingDeleted === table._id ? (
                            <div className="animate-spin w-2.5 h-2.5 border border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <Trash2 size={10} />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Table Visual */}
                    <div className="flex justify-center mb-3 mt-4">
                      <div className="relative">
                        {/* Table surface */}
                        <div
                          className="w-12 h-8 rounded-lg shadow-md flex items-center justify-center relative"
                          style={{
                            backgroundColor: colors.light,
                            border: `2px solid ${colors.primary}`
                          }}
                        >
                          {/* Table number */}
                          <span
                            className="text-sm font-bold"
                            style={{ color: colors.dark }}
                          >
                            {table.number}
                          </span>

                          {/* Decorative dots */}
                          <div className="absolute top-1 left-1">
                            <div
                              className="w-1 h-1 rounded-full"
                              style={{ backgroundColor: colors.primary }}
                            ></div>
                          </div>
                          <div className="absolute top-1 right-1">
                            <div
                              className="w-1 h-1 rounded-full"
                              style={{ backgroundColor: colors.primary }}
                            ></div>
                          </div>
                        </div>

                        {/* Table legs */}
                        <div className="absolute -bottom-1 left-1">
                          <div
                            className="w-1 h-2 rounded-b-full"
                            style={{ backgroundColor: colors.dark }}
                          ></div>
                        </div>
                        <div className="absolute -bottom-1 right-1">
                          <div
                            className="w-1 h-2 rounded-b-full"
                            style={{ backgroundColor: colors.dark }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Table Info */}
                    <div className="text-center">
                      <h3
                        className="text-lg font-bold mb-1"
                        style={{ color: colors.dark }}
                      >
                        Table {table.number}
                      </h3>
                      <p
                        className="text-xs font-medium flex items-center justify-center gap-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <i className="fas fa-map-marker-alt text-xs"></i>
                        {table.floor_id.name}
                      </p>
                    </div>

                    {/* Animated bottom border */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl transition-all duration-300 group-hover:h-2"
                      style={{ backgroundColor: colors.primary }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              {/* Items per page and info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Show:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-md border text-sm font-medium focus:outline-none focus:ring-2 transition-all duration-200"
                    style={{
                      backgroundColor: 'var(--background-color)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-color)'
                    }}
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>

                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Showing {Math.min(startIndex + 1, totalItems)}-{Math.min(endIndex, totalItems)} of {totalItems} tables
                </div>
              </div>

              {/* Pagination */}
              <div className="flex items-center gap-2">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-color)',
                    }}
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                        <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                currentPage === pageNum ? 'text-white' : ''
                            }`}
                            style={{
                              backgroundColor: currentPage === pageNum ? 'var(--primary-color)' : 'var(--background-secondary)',
                              color: currentPage === pageNum ? 'var(--text-on-primary)' : 'var(--text-secondary)',
                              borderColor: 'var(--border-color)',
                            }}
                        >
                          {pageNum}
                        </button>
                    );
                  })}
                </div>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--background-secondary)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-color)',
                    }}
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>

                <div className="text-sm font-medium ml-2" style={{ color: 'var(--text-secondary)' }}>
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Enhanced Empty State */}
      {!isLoading.fetch && tablesWithStatus.length === 0 && (
        <div className="text-center py-16">
          <div className="rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 bg-gray-100 shadow-lg">
            <i className="fas fa-utensils text-3xl" style={{ color: 'var(--text-secondary)' }}></i>
          </div>
          <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-color)' }}>
            No tables found
          </h3>
          <p className="text-base mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {activeFloor ? 'This floor has no tables yet.' : 'No tables have been created yet.'}
          </p>
          {userPermissions.includes('can_add_tables') && (
            <button
              onClick={onAdd}
              className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <i className="fas fa-plus mr-2"></i>
              Create Your First Table
            </button>
          )}
        </div>
      )}
    </div>
  );
}
