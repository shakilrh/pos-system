import React, { useState, useEffect } from 'react';
import { XMarkIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { createTable, updateTable, deleteTable } from '../../services/floorTableService';
import { Table, Floor } from './tableTypes';
import FlashMessage from '../FlashMessage';

interface TableCrudProps {
  token: string | null;
  logout: () => void;
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  floors: Floor[];
  table?: Table | null;
  editingTableId?: string | null;
  deleteTableId?: string | null;
  onCancel: () => void;
  isProductFormActive: boolean;
  mode: 'add' | 'edit' | 'delete';
  setFlashMessageInParent: (message: { message: string; type: 'success' | 'error' }) => void;
  loadTables: () => Promise<void>; // Add loadTables prop
}

export default function TableCrud({
                                    token,
                                    logout,
                                    tables,
                                    setTables,
                                    floors,
                                    table,
                                    editingTableId,
                                    deleteTableId,
                                    onCancel,
                                    isProductFormActive,
                                    mode,
                                    setFlashMessageInParent,
                                    loadTables, // Destructure loadTables
                                  }: TableCrudProps) {
  const [newTableNumber, setNewTableNumber] = useState(table?.number?.toString() || '');
  const [newTableFloorId, setNewTableFloorId] = useState(table?.floor_id?._id || '');
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<{
    number?: string[];
    floor_id?: string[];
  }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    setNewTableNumber(table?.number?.toString() || '');
    setNewTableFloorId(table?.floor_id?._id || floors[0]?._id || '');
    setErrors({});
    setTouchedFields(new Set());
  }, [table, floors]);

  const validateNumber = (number: string): string[] => {
    const errors: string[] = [];
    if (!number.trim()) {
      errors.push('Table number is required');
    } else {
      const num = parseInt(number);
      if (isNaN(num) || num < 1) errors.push('Table number must be a valid number greater than 0');
      if (num > 999) errors.push('Table number must be less than 1000');
    }
    return errors;
  };

  const validateFloor = (floorId: string): string[] => {
    const errors: string[] = [];
    if (!floorId) errors.push('Floor selection is required');
    return errors;
  };

  const getFieldErrors = (fieldName: string): string[] => {
    switch (fieldName) {
      case 'number':
        return validateNumber(newTableNumber);
      case 'floor_id':
        return validateFloor(newTableFloorId);
      default:
        return [];
    }
  };

  const isFormValid = (): boolean => {
    return validateNumber(newTableNumber).length === 0 && validateFloor(newTableFloorId).length === 0;
  };

  const handleInputChange = (fieldName: string, value: string) => {
    if (fieldName === 'number') setNewTableNumber(value);
    if (fieldName === 'floor_id') setNewTableFloorId(value);

    if (touchedFields.has(fieldName)) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName),
      }));
    }
  };

  const handleFocus = (fieldName: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
    setErrors((prev) => ({
      ...prev,
      [fieldName]: getFieldErrors(fieldName),
    }));
  };

  const handleBlur = (fieldName: string) => {
    if (touchedFields.has(fieldName)) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName),
      }));
    }
  };

  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = errors[fieldName as keyof typeof errors] || [];
    if (fieldErrors.length === 0) return null;
    return (
      <div className="mt-1 space-y-1">
        {fieldErrors.map((error, index) => (
          <p key={index} className="text-xs flex items-start" style={{ color: 'var(--error-color)' }}>
            <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        ))}
      </div>
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (mode === 'add' || mode === 'edit') {
      const allFields = ['number', 'floor_id'];
      setTouchedFields(new Set(allFields));
      const allErrors: any = {};
      allFields.forEach((field) => {
        allErrors[field] = getFieldErrors(field);
      });
      setErrors(allErrors);

      if (!isFormValid()) {
        setFlashMessage({ message: 'Please fix all errors before submitting', type: 'error' });
        return;
      }
    }

    if (!token) {
      const errorMessage = { message: 'Please log in to perform this action', type: 'error' };
      setFlashMessage(errorMessage);
      return;
    }

    try {
      let updatedTable;
      if (mode === 'add') {
        console.log('Creating table:', { number: parseInt(newTableNumber), floor_id: newTableFloorId });
        updatedTable = await createTable(token, logout, {
          number: parseInt(newTableNumber),
          floor_id: newTableFloorId,
        });
        // setTables([...tables, updatedTable]); // Remove local state update
        setFlashMessageInParent({ message: `Table ${newTableNumber} added successfully!`, type: 'success' });
        await loadTables(); // Refresh table list
      } else if (mode === 'edit' && editingTableId) {
        console.log('Updating table:', { table_id: editingTableId, number: parseInt(newTableNumber), floor_id: newTableFloorId });
        updatedTable = await updateTable(token, logout, {
          table_id: editingTableId,
          number: parseInt(newTableNumber),
          floor_id: newTableFloorId,
        });
        // setTables(tables.map((t) => (t._id === editingTableId ? updatedTable : t))); // Remove local state update
        setFlashMessageInParent({ message: `Table ${newTableNumber} updated successfully!`, type: 'success' });
        await loadTables(); // Refresh table list
      } else if (mode === 'delete' && deleteTableId) {
        console.log('Deleting table:', deleteTableId);
        await deleteTable(token, logout, deleteTableId);
        // setTables(tables.filter((t) => t._id !== deleteTableId)); // Remove local state update
        setFlashMessageInParent({ message: `Table ${table?.number} deleted successfully!`, type: 'success' });
        await loadTables(); // Refresh table list
      }
      onCancel();
    } catch (err) {
      let message = err instanceof Error ? err.message : `Failed to ${mode} table`;
      if (mode === 'delete' && err instanceof Error && err.message.includes('occupied')) {
        message = `Cannot delete table ${table?.number} because it is occupied.`;
      }
      console.error('Table operation error:', err);
      setFlashMessage({ message, type: 'error' });
    }
  };

  if (mode === 'add' || mode === 'edit') {
    return (
      <div className="rounded-lg p-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        {flashMessage && (
          <FlashMessage
            message={flashMessage.message}
            type={flashMessage.type}
            onClose={() => setFlashMessage(null)}
          />
        )}
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: 'var(--background-color)', borderBottom: '1px solid var(--border-color)', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TableCellsIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
                {mode === 'edit' ? 'Edit Table' : 'Create New Table'}
              </h3>
            </div>
          </div>
          <button onClick={onCancel} className="hover:text-[var(--text-secondary)]" style={{ color: 'var(--text-secondary)' }}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border-color)' }}>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label htmlFor="tableNumber" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Table Number *</label>
                <input
                  id="tableNumber"
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  onFocus={() => handleFocus('number')}
                  onBlur={() => handleBlur('number')}
                  placeholder="Enter table number"
                  className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${errors.number && errors.number.length > 0 ? 'ring-1' : ''}`}
                  style={{
                    borderColor: errors.number && errors.number.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    outlineColor: 'var(--focus-ring)',
                  }}
                  min="1"
                  max="999"
                  required
                />
                {renderFieldErrors('number')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{newTableNumber.length}/3</p>
              </div>
              <div>
                <label htmlFor="tableFloor" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Floor *</label>
                <select
                  id="tableFloor"
                  value={newTableFloorId}
                  onChange={(e) => handleInputChange('floor_id', e.target.value)}
                  onFocus={() => handleFocus('floor_id')}
                  onBlur={() => handleBlur('floor_id')}
                  className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${errors.floor_id && errors.floor_id.length > 0 ? 'ring-1' : ''}`}
                  style={{
                    borderColor: errors.floor_id && errors.floor_id.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    outlineColor: 'var(--focus-ring)',
                  }}
                  required
                >
                  <option value="">Select Floor</option>
                  {floors.map((floor) => (
                    <option key={floor._id} value={floor._id}>{floor.name}</option>
                  ))}
                </select>
                {renderFieldErrors('floor_id')}
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isProductFormActive ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--background-secondary)]'}`}
                style={{ backgroundColor: 'var(--background-color)', '--tw-ring-color': 'var(--focus-ring)' }}
                disabled={isProductFormActive}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isProductFormActive || !isFormValid() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--primary-color)] text-[var(--text-on-primary)] hover:bg-[var(--background-color)]'}`}
                style={{ '--tw-ring-color': 'var(--focus-ring)' }}
                disabled={isProductFormActive || !isFormValid()}
              >
                {mode === 'edit' ? 'Update Table' : 'Create Table'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'delete' && deleteTableId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--surface-color)] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
          {flashMessage && (
            <FlashMessage
              message={flashMessage.message}
              type={flashMessage.type}
              onClose={() => setFlashMessage(null)}
            />
          )}
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-6 h-6" fill="currentColor" style={{ color: 'var(--error-color)' }} viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>Confirm Delete</h3>
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete Table {table?.number}? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 bg-[var(--error-color)] text-[var(--text-on-primary)] hover:bg-opacity-90`}
              style={{ '--tw-ring-color': 'var(--focus-ring)' }}
            >
              Delete
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--background-secondary)]"
              style={{ backgroundColor: 'var(--background-color)', '--tw-ring-color': 'var(--focus-ring)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
