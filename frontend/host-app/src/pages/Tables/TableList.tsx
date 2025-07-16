import React from 'react';
import { Edit3, Trash2, Plus } from 'lucide-react';

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

  // Calculate counts
  const freeCount = tablesWithStatus.filter(table => table.status === 'free').length;
  const reservedCount = tablesWithStatus.filter(table => table.status === 'reserved').length;
  const totalTables = tablesWithStatus.length;

  // Calculate capacity percentage for progress bar
  const capacityPercentage = totalTables > 0 ? Math.round((reservedCount / totalTables) * 100) : 0;

  const handleFloorClick = (floorId: string | null) => {
    setActiveFloor(floorId);
  };

  return (
    <div className="p-6">
      {/* Header with Floor Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleFloorClick(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeFloor === null
                ? 'shadow-lg transform scale-105'
                : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: activeFloor === null ? 'var(--primary-color)' : 'var(--background-color)',
              color: activeFloor === null ? 'var(--text-on-primary)' : 'var(--text-color)',
              border: `1px solid ${activeFloor === null ? 'var(--primary-color)' : 'var(--border-color)'}`
            }}
          >
            All Floors
          </button>
          {floors.map(floor => (
            <button
              key={floor._id}
              onClick={() => handleFloorClick(floor._id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeFloor === floor._id
                  ? 'shadow-lg transform scale-105'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeFloor === floor._id ? 'var(--primary-color)' : 'var(--background-color)',
                color: activeFloor === floor._id ? 'var(--text-on-primary)' : 'var(--text-color)',
                border: `1px solid ${activeFloor === floor._id ? 'var(--primary-color)' : 'var(--border-color)'}`
              }}
            >
              {floor.name}
            </button>
          ))}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div
            className="rounded-lg p-2 shadow-sm border"
            style={{
              backgroundColor: 'var(--background-color)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Seats</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-color)' }}>{totalTables}</p>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-color)' }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--text-on-primary)' }}></div>
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-2 shadow-sm border"
            style={{
              backgroundColor: 'var(--background-color)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Reserved</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--warning-color)' }}>{reservedCount}</p>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--warning-color)' }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--text-on-primary)' }}></div>
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-2 shadow-sm border"
            style={{
              backgroundColor: 'var(--background-color)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Free</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--success-color)' }}>{freeCount}</p>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--success-color)' }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--text-on-primary)' }}></div>
              </div>
            </div>
          </div>

          <div
            className="rounded-lg p-2 shadow-sm border"
            style={{
              backgroundColor: 'var(--background-color)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Actual Capacity</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--primary-color)' }}>{capacityPercentage}%</p>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-color)' }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--text-on-primary)' }}></div>
              </div>
            </div>
            <div className="mt-2 w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-color)' }}>
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${capacityPercentage}%`,
                  backgroundColor: 'var(--primary-color)'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <div className="flex justify-end">
          <button
            onClick={onAdd}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'var(--text-on-primary)'
            }}
          >
            <Plus size={18} />
            <span>Add Table</span>
          </button>
        </div>
      </div>

      {/* Table Grid */}
      {isLoading.fetch ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary-color)' }}></div>
          <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>Loading tables...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {tablesWithStatus.map((table) => (
            <div key={table._id} className="group relative">
              <div
                className="relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 border-2"
                style={{
                  backgroundColor: 'var(--background-color)',
                  borderColor: table.status === 'free' ? 'var(--success-color)' : 'var(--warning-color)'
                }}
              >
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{
                      backgroundColor: table.status === 'free' ? 'var(--success-color)' : 'var(--warning-color)'
                    }}
                  >
                    {table.status === 'free' ? '● Free' : '● Reserved'}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => onEdit(table)}
                    className="p-2 text-white rounded-full hover:opacity-90 transition-all duration-200 shadow-md"
                    style={{ backgroundColor: 'var(--primary-color)' }}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(table._id)}
                    disabled={itemBeingDeleted === table._id}
                    className="p-2 text-white rounded-full hover:opacity-90 transition-all duration-200 shadow-md"
                    style={{ backgroundColor: 'var(--error-color)' }}
                  >
                    {itemBeingDeleted === table._id ? (
                      <svg className="animate-spin w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>

                {/* Table Icon */}
                <div className="flex justify-center mb-4 mt-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white"
                    style={{
                      backgroundColor: table.status === 'free' ? 'var(--success-color)' : 'var(--warning-color)'
                    }}
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                </div>

                {/* Table Info */}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-color)' }}>
                    Table {table.number}
                  </h3>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {table.floor_id.name}
                  </p>
                </div>

                {/* Decorative Elements */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{
                    backgroundColor: table.status === 'free' ? 'var(--success-color)' : 'var(--warning-color)'
                  }}
                ></div>

                {/* Status Indicator Dots */}
                <div className="absolute -top-2 -right-2 flex space-x-1">
                  <div
                    className="w-4 h-4 rounded-full animate-pulse"
                    style={{
                      backgroundColor: table.status === 'free' ? 'var(--success-color)' : 'var(--warning-color)'
                    }}
                  ></div>
                </div>

                {/* Side Indicators like in your image */}
                <div
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-8 rounded-r-full"
                  style={{
                    backgroundColor: table.status === 'free' ? 'var(--success-color)' : 'var(--warning-color)'
                  }}
                ></div>
                <div
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-8 rounded-l-full"
                  style={{
                    backgroundColor: table.status === 'free' ? 'var(--success-color)' : 'var(--warning-color)'
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading.fetch && tablesWithStatus.length === 0 && (
        <div className="text-center py-12">
          <div
            className="rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--border-color)' }}
          >
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-secondary)' }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
            No tables found
          </h3>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {activeFloor ? 'This floor has no tables yet.' : 'No tables have been created yet.'}
          </p>
          <button
            onClick={onAdd}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'var(--text-on-primary)'
            }}
          >
            Create First Table
          </button>
        </div>
      )}
    </div>
  );
}
