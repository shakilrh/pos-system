import React, { useState, useMemo } from 'react';
import { Edit3, Trash2, Plus, ChevronLeft, ChevronRight, Users, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
        primary: '#3B82F6', // Blue-500
        light: '#EFF6FF', // Blue-50
        dark: '#1E40AF', // Blue-800
        gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'
      };
    } else {
      return {
        primary: '#8B5CF6', // Violet-500
        light: '#F5F3FF', // Violet-50
        dark: '#6D28D9', // Violet-700
        gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
      };
    }
  };

  return (
    <div className="p-6">
      {/* Header with Floor Buttons */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => handleFloorClick(null)}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
              activeFloor === null
                ? 'shadow-lg scale-105'
                : 'hover:shadow-md'
            }`}
            style={{
              background: activeFloor === null
                ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                : 'var(--background-color)',
              color: activeFloor === null ? '#FFFFFF' : 'var(--text-color)',
              border: `2px solid ${activeFloor === null ? '#8B5CF6' : 'var(--border-color)'}`
            }}
          >
            <i className="fas fa-layer-group mr-2"></i>
            All Floors
          </button>
          {floors.map(floor => (
            <button
              key={floor._id}
              onClick={() => handleFloorClick(floor._id)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeFloor === floor._id
                  ? 'shadow-lg scale-105'
                  : 'hover:shadow-md'
              }`}
              style={{
                background: activeFloor === floor._id
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                  : 'var(--background-color)',
                color: activeFloor === floor._id ? '#FFFFFF' : 'var(--text-color)',
                border: `2px solid ${activeFloor === floor._id ? '#8B5CF6' : 'var(--border-color)'}`
              }}
            >
              <i className="fas fa-building mr-2"></i>
              {floor.name}
            </button>
          ))}
        </div>

        {/* Compact Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            className="rounded-lg p-4 shadow-sm border-0 transform hover:scale-102 transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
              color: '#FFFFFF'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Total Tables</p>
                <p className="text-2xl font-bold">{totalTables}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-4 shadow-sm border-0 transform hover:scale-102 transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
              color: '#FFFFFF'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Reserved</p>
                <p className="text-2xl font-bold">{reservedCount}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-4 shadow-sm border-0 transform hover:scale-102 transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
              color: '#FFFFFF'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Available</p>
                <p className="text-2xl font-bold">{freeCount}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <CheckCircle size={16} />
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-4 shadow-sm border-0 transform hover:scale-102 transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
              color: '#FFFFFF'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-90">Capacity</p>
                <p className="text-2xl font-bold">{capacityPercentage}%</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <BarChart3 size={16} />
              </div>
            </div>
            <div className="mt-2 w-full rounded-full h-1.5 bg-white bg-opacity-30">
              <div
                className="h-1.5 rounded-full transition-all duration-500 bg-white"
                style={{ width: `${capacityPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Add Button Only */}
        <div className="flex justify-end mb-6">
          {userPermissions.includes('can_add_tables') && (
            <button
              onClick={onAdd}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: '#FFFFFF'
              }}
            >
              <Plus size={16} />
              <span>Add New Table</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Grid */}
      {isLoading.fetch ? (
        <div className="flex justify-center items-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent absolute top-0"></div>
          </div>
          <span className="ml-4 text-lg font-medium" style={{ color: 'var(--text-secondary)' }}>
            Loading tables...
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 mb-6">
            {currentTables.map((table) => {
              const colors = getStatusColors(table.status);
              return (
                <div key={table._id} className="group relative">
                  <div
                    className="relative overflow-hidden rounded-lg p-4 transition-all duration-200 hover:shadow-lg hover:scale-102 border"
                    style={{
                      backgroundColor: 'var(--background-color)',
                      borderColor: colors.primary,
                      borderWidth: '2px'
                    }}
                  >
                    {/* Compact Status Badge */}
                    <div className="absolute top-2 right-2">
                      <div
                        className="px-2 py-1 rounded-full text-xs font-medium text-white shadow-sm flex items-center gap-1"
                        style={{ background: colors.gradient }}
                      >
                        <i className={`fas ${table.status === 'free' ? 'fa-check-circle' : 'fa-clock'} text-xs`}></i>
                        {table.status === 'free' ? 'Free' : 'Reserved'}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {userPermissions.includes('can_edit_tables') && (
                        <button
                          onClick={() => onEdit(table)}
                          className="p-1.5 text-white rounded-full hover:scale-110 transition-all duration-200 shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' }}
                          title="Edit Table"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                      {userPermissions.includes('can_delete_tables') && (
                        <button
                          onClick={() => onDelete(table._id)}
                          disabled={itemBeingDeleted === table._id}
                          className="p-1.5 text-white rounded-full hover:scale-110 transition-all duration-200 shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
                          title="Delete Table"
                        >
                          {itemBeingDeleted === table._id ? (
                            <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Compact Table Icon */}
                    <div className="flex justify-center mb-3 mt-6">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm"
                        style={{ background: colors.gradient }}
                      >
                        <i className="fas fa-utensils text-sm"></i>
                      </div>
                    </div>

                    {/* Table Info */}
                    <div className="text-center">
                      <h3 className="text-lg font-bold mb-1" style={{ color: colors.dark }}>
                        <i className="fas fa-hashtag mr-1 text-sm"></i>
                        {table.number}
                      </h3>
                      <p className="text-xs font-medium flex items-center justify-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                        <i className="fas fa-map-marker-alt text-xs"></i>
                        {table.floor_id.name}
                      </p>
                    </div>

                    {/* Simple bottom border */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ background: colors.gradient }}
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
                  className="p-2 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  style={{
                    backgroundColor: currentPage === 1 ? 'var(--border-color)' : '#8B5CF6',
                    color: currentPage === 1 ? 'var(--text-secondary)' : '#FFFFFF'
                  }}
                >
                  <ChevronLeft size={16} />
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
                        className={`w-8 h-8 rounded-md text-sm font-medium transition-all duration-200 ${
                          currentPage === pageNum ? 'scale-105 shadow-sm' : 'hover:scale-105'
                        }`}
                        style={{
                          background: currentPage === pageNum
                            ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                            : 'var(--background-color)',
                          color: currentPage === pageNum ? '#FFFFFF' : 'var(--text-color)',
                          border: `1px solid ${currentPage === pageNum ? '#8B5CF6' : 'var(--border-color)'}`
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
                  className="p-2 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  style={{
                    backgroundColor: currentPage === totalPages ? 'var(--border-color)' : '#8B5CF6',
                    color: currentPage === totalPages ? 'var(--text-secondary)' : '#FFFFFF'
                  }}
                >
                  <ChevronRight size={16} />
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
        <div className="text-center py-20">
          <div
            className="rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #E5E7EB 0%, #D1D5DB 100%)' }}
          >
            <i className="fas fa-utensils text-4xl" style={{ color: 'var(--text-secondary)' }}></i>
          </div>
          <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-color)' }}>
            No tables found
          </h3>
          <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {activeFloor ? 'This floor has no tables yet.' : 'No tables have been created yet.'}
          </p>
          {userPermissions.includes('can_add_tables') && (
            <button
              onClick={onAdd}
              className="px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                color: '#FFFFFF'
              }}
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
