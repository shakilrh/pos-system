import React, { useState, useEffect } from 'react';
import { XMarkIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { createFloor, updateFloor } from '../../services/floorTableService';
import { Floor } from './tableTypes';
import FlashMessage from '../FlashMessage';

interface FloorCrudProps {
  token: string | null;
  logout: () => void;
  floors: Floor[];
  setFloors: React.Dispatch<React.SetStateAction<Floor[]>>;
  floor?: Floor | null;
  editingFloorId?: string | null;
  deleteFloorId?: string | null;
  onCancel: () => void;
  isProductFormActive: boolean;
  mode: 'add' | 'edit' | 'delete';
  setFlashMessageInParent: (message: { message: string; type: 'success' | 'error' }) => void;
}

export default function FloorCrud({
                                    token,
                                    logout,
                                    floors,
                                    setFloors,
                                    floor,
                                    editingFloorId,
                                    deleteFloorId,
                                    onCancel,
                                    isProductFormActive,
                                    mode,
                                    setFlashMessageInParent,
                                  }: FloorCrudProps) {
  const [newFloorName, setNewFloorName] = useState(floor?.name || '');
  const [newFloorDesc, setNewFloorDesc] = useState(floor?.description || '');
  const [flashMessage, setFlashMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<{
    name?: string[];
    description?: string[];
  }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    setNewFloorName(floor?.name || '');
    setNewFloorDesc(floor?.description || '');
    setErrors({});
    setTouchedFields(new Set());
  }, [floor]);

  const validateName = (name: string): string[] => {
    const errors: string[] = [];
    if (!name.trim()) {
      errors.push('Floor name is required');
    } else {
      if (name.length < 2) errors.push('Floor name must be at least 2 characters long');
      if (name.length > 100) errors.push('Floor name must be less than 100 characters');
      if (!/^[A-Za-z0-9\s&'-.,()]+$/.test(name)) {
        errors.push('Floor name can only contain letters, numbers, spaces, and common punctuation');
      }
      if (/^\s|\s$/.test(name)) errors.push('Floor name cannot start or end with spaces');
      if (/\s{2,}/.test(name)) errors.push('Floor name cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const validateDescription = (description: string): string[] => {
    const errors: string[] = [];
    if (description && description.length > 500) {
      errors.push('Description must be less than 500 characters');
    }
    return errors;
  };

  const getFieldErrors = (fieldName: string): string[] => {
    switch (fieldName) {
      case 'name': return validateName(newFloorName);
      case 'description': return validateDescription(newFloorDesc);
      default: return [];
    }
  };

  const isFormValid = (): boolean => {
    return validateName(newFloorName).length === 0;
  };

  const handleInputChange = (fieldName: string, value: string) => {
    if (fieldName === 'name') setNewFloorName(value);
    if (fieldName === 'description') setNewFloorDesc(value);

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
      const allFields = ['name', 'description'];
      setTouchedFields(new Set(allFields));
      const allErrors: any = {};
      allFields.forEach((field) => {
        allErrors[field] = getFieldErrors(field);
      });
      setErrors(allErrors);

      if (validateName(newFloorName).length > 0) {
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
      let updatedFloor;
      if (mode === 'add') {
        updatedFloor = await createFloor(token, logout, { name: newFloorName, description: newFloorDesc || undefined });
        setFloors([...floors, updatedFloor]);
        setFlashMessageInParent({ message: `Floor "${newFloorName}" added successfully!`, type: 'success' });
      } else if (mode === 'edit' && editingFloorId) {
        updatedFloor = await updateFloor(token, logout, { floor_id: editingFloorId, name: newFloorName, description: newFloorDesc || undefined });
        setFloors(floors.map((f) => (f._id === editingFloorId ? updatedFloor : f)));
        setFlashMessageInParent({ message: `Floor "${newFloorName}" updated successfully!`, type: 'success' });
      }
      onCancel();
    } catch (err) {
      let message = err instanceof Error ? err.message : `Failed to ${mode} floor`;
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
              <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
                {mode === 'edit' ? 'Edit Floor' : 'Create New Floor'}
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
                <label htmlFor="floorName" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Floor Name *</label>
                <input
                  id="floorName"
                  type="text"
                  value={newFloorName}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onFocus={() => handleFocus('name')}
                  onBlur={() => handleBlur('name')}
                  placeholder="Enter floor name"
                  className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${errors.name && errors.name.length > 0 ? 'ring-1' : ''}`}
                  style={{
                    borderColor: errors.name && errors.name.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    outlineColor: 'var(--focus-ring)',
                  }}
                  maxLength={100}
                  required
                />
                {renderFieldErrors('name')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{newFloorName.length}/100</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="floorDescription" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description (Optional)</label>
                <textarea
                  id="floorDescription"
                  value={newFloorDesc}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  onFocus={() => handleFocus('description')}
                  onBlur={() => handleBlur('description')}
                  placeholder="Floor description (optional)"
                  className={`w-full p-2 text-sm rounded-lg border resize-none focus:outline-none focus:ring-2 transition-colors duration-200 ${errors.description && errors.description.length > 0 ? 'ring-1' : ''}`}
                  style={{
                    borderColor: errors.description && errors.description.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    outlineColor: 'var(--focus-ring)',
                  }}
                  rows={3}
                  maxLength={500}
                />
                {renderFieldErrors('description')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>{newFloorDesc.length}/500</p>
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
                {mode === 'edit' ? 'Update Floor' : 'Create Floor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (mode === 'delete' && deleteFloorId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="rounded-lg p-6 w-full max-w-md mx-4 shadow-xl" style={{ backgroundColor: 'var(--surface-color)' }}>
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
            Are you sure you want to delete the floor "{floor?.name}"? This action cannot be undone.
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
