import React from 'react';
import { XMarkIcon, UserIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { User, Role, FormData, FormErrors } from './userTypes';

interface UserCrudProps {
  token: string | null;
  logout: () => void;
  users: User[];
  roles: Role[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setFilteredUsers: React.Dispatch<React.SetStateAction<User[]>>;
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  editUser: User | null;
  setEditUser: (user: User | null) => void;
  originalUser: User | null;
  setOriginalUser: (user: User | null) => void;
  setMessage: (msg: string | null) => void;
  setIsSuccess: (success: boolean) => void;
  isLoading: { create: boolean; update: boolean; delete: boolean };
  setIsLoading: React.Dispatch<React.SetStateAction<{ create: boolean; update: boolean; delete: boolean }>>;
  onCreateUser: (userData: Partial<User>) => Promise<void>;
  onUpdateUser: (userData: Partial<User>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  mode: 'create' | 'edit' | 'delete';
  deleteUserId: string | null;
  onCancel: () => void;
}

const UserCrud: React.FC<UserCrudProps> = ({
                                             token,
                                             logout,
                                             users,
                                             roles,
                                             setUsers,
                                             setFilteredUsers,
                                             showCreateForm,
                                             setShowCreateForm,
                                             editUser,
                                             setEditUser,
                                             originalUser,
                                             setOriginalUser,
                                             setMessage,
                                             setIsSuccess,
                                             isLoading,
                                             setIsLoading,
                                             onCreateUser,
                                             onUpdateUser,
                                             onDeleteUser,
                                             mode,
                                             deleteUserId,
                                             onCancel,
                                           }) => {
  const [newUser, setNewUser] = React.useState<FormData>({
    name: '',
    email: '',
    password: '',
    user_type: 'worker', // Default value remains for initialization
    role_id: null,
    phone_number: '',
    job_title: '',
    shift_time: '',
    salary: '',
  });
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());
  const formRef = React.useRef<HTMLDivElement>(null);

  const validateName = (name: string): string[] => {
    const errors: string[] = [];
    if (!name.trim()) errors.push('Name is required');
    else {
      if (name.length < 2) errors.push('Name must be at least 2 characters long');
      if (name.length > 100) errors.push('Name must be less than 100 characters');
      if (!/^[A-Za-z\s'-]+$/.test(name)) errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
      if (/^\s|\s$/.test(name)) errors.push('Name cannot start or end with spaces');
      if (/\s{2,}/.test(name)) errors.push('Name cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const validateEmail = (email: string, isEdit: boolean = false): string[] => {
    const errors: string[] = [];
    if (!email.trim()) errors.push('Email is required');
    else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) errors.push('Please enter a valid email address');
      if (email.length > 255) errors.push('Email address is too long');
      if (email.includes('..')) errors.push('Email cannot contain consecutive dots');
      if (!isEdit || (isEdit && originalUser && email.toLowerCase() !== originalUser.email.toLowerCase())) {
        const isDuplicate = users.some((user) => user.email.toLowerCase() === email.toLowerCase());
        if (isDuplicate) errors.push('Email already exists');
      }
    }
    return errors;
  };

  const validatePassword = (password: string, isEdit: boolean = false): string[] => {
    const errors: string[] = [];
    if (!isEdit && !password.trim()) errors.push('Password is required');
    else if (password && password.trim()) {
      if (password.length < 8) errors.push('Password must be at least 8 characters long');
      if (password.length > 100) errors.push('Password must be less than 100 characters');
      if (!/[A-Z]/.test(password)) errors.push('Password must include at least one uppercase letter');
      if (!/[a-z]/.test(password)) errors.push('Password must include at least one lowercase letter');
      if (!/[0-9]/.test(password)) errors.push('Password must include at least one number');
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
        errors.push('Password must include at least one special character');
      if (/\s/.test(password)) errors.push('Password cannot contain spaces');
      if (/(.)\1{2,}/.test(password)) errors.push('Password cannot contain more than 2 consecutive identical characters');
    }
    return errors;
  };

  const validatePhoneNumber = (phone: string): string[] => {
    const errors: string[] = [];
    if (phone && phone.trim()) {
      if (!/^\+?[\d\s-()]{7,20}$/.test(phone.trim())) errors.push('Invalid phone number format');
      if (phone.length > 20) errors.push('Phone number is too long');
    }
    return errors;
  };

  const validateJobTitle = (jobTitle: string): string[] => {
    const errors: string[] = [];
    if (jobTitle && jobTitle.trim()) {
      if (jobTitle.length > 100) errors.push('Job title must be less than 100 characters');
      if (!/^[A-Za-z0-9\s&'-.,()]+$/.test(jobTitle))
        errors.push('Job title can only contain letters, numbers, spaces, and common punctuation');
      if (/^\s|\s$/.test(jobTitle)) errors.push('Job title cannot start or end with spaces');
      if (/\s{2,}/.test(jobTitle)) errors.push('Job title cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const validateShiftTime = (shiftTime: string): string[] => {
    const errors: string[] = [];
    if (shiftTime && shiftTime.trim()) {
      if (shiftTime.length > 100) errors.push('Shift time must be less than 100 characters');
      if (!/^[A-Za-z0-9\s:-]+$/.test(shiftTime))
        errors.push('Shift time can only contain letters, numbers, spaces, colons, and hyphens');
      if (/^\s|\s$/.test(shiftTime)) errors.push('Shift time cannot start or end with spaces');
      if (/\s{2,}/.test(shiftTime)) errors.push('Shift time cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const validateSalary = (salary: string | number): string[] => {
    const errors: string[] = [];
    const salaryStr = salary.toString();
    if (salaryStr && salaryStr.trim()) {
      const numSalary = parseFloat(salaryStr);
      if (isNaN(numSalary)) errors.push('Salary must be a valid number');
      else if (numSalary < 0) errors.push('Salary cannot be negative');
      else if (numSalary > 999999) errors.push('Salary is too large');
    }
    return errors;
  };

  const validateUserType = (userType: string): string[] => {
    const errors: string[] = [];
    if (!userType.trim()) errors.push('User type is required');
    else if (!['worker', 'waiter','rider'].includes(userType.toLowerCase())) {
      errors.push('User type must be either Worker or Waiter');
    }
    return errors;
  };

  const getFieldErrors = (fieldName: string, isEdit: boolean = false): string[] => {
    const data = isEdit ? editUser : newUser;
    if (!data) return [];
    switch (fieldName) {
      case 'name': return validateName(data.name);
      case 'email': return validateEmail(data.email, isEdit);
      case 'password': return validatePassword(data.password || '', isEdit);
      case 'phone_number': return validatePhoneNumber(data.phone_number || '');
      case 'job_title': return validateJobTitle(data.job_title || '');
      case 'shift_time': return validateShiftTime(data.shift_time || '');
      case 'salary': return validateSalary(data.salary || '');
      case 'user_type': return validateUserType(data.user_type || '');
      default: return [];
    }
  };

  const isFormValid = (isEdit: boolean = false): boolean => {
    const requiredFields = ['name', 'email', 'user_type'];
    if (!isEdit) requiredFields.push('password');
    return requiredFields.every(field => getFieldErrors(field, isEdit).length === 0);
  };

  const handleInputChange = (field: keyof FormData, value: string, isEdit: boolean) => {
    if (isEdit && editUser) {
      setEditUser({ ...editUser, [field]: value });
    } else {
      setNewUser({ ...newUser, [field]: value });
    }
    if (touchedFields.has(field)) {
      setFormErrors(prev => ({ ...prev, [field]: getFieldErrors(field, isEdit) }));
    }
  };

  const handleFocus = (fieldName: string, isEdit: boolean) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    setFormErrors(prev => ({ ...prev, [fieldName]: getFieldErrors(fieldName, isEdit) }));
  };

  const handleBlur = (fieldName: string, isEdit: boolean) => {
    if (touchedFields.has(fieldName)) {
      setFormErrors(prev => ({ ...prev, [fieldName]: getFieldErrors(fieldName, isEdit) }));
    }
  };

  const resetForm = () => {
    setNewUser({
      name: '',
      email: '',
      password: '',
      user_type: 'worker',
      role_id: null,
      phone_number: '',
      job_title: '',
      shift_time: '',
      salary: '',
    });
    setEditUser(null);
    setOriginalUser(null);
    setFormErrors({});
    setTouchedFields(new Set());
    setShowCreateForm(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields = ['name', 'email', 'password', 'user_type'];
    const allFields = ['name', 'email', 'password', 'user_type', 'phone_number', 'job_title', 'shift_time', 'salary'];
    setTouchedFields(new Set(allFields));
    const allErrors: any = {};
    allFields.forEach(field => {
      allErrors[field] = getFieldErrors(field, false);
    });
    setFormErrors(allErrors);
    const hasErrors = Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0);
    if (hasErrors) {
      setMessage('Please fix all errors before submitting');
      setIsSuccess(false);
      return;
    }
    setIsLoading((prev) => ({ ...prev, create: true }));
    try {
      const userData: Partial<User> = {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password?.trim() || undefined,
        user_type: newUser.user_type,
        phone_number: newUser.phone_number?.trim() || undefined,
        job_title: newUser.job_title?.trim() || undefined,
        shift_time: newUser.shift_time?.trim() || undefined,
        salary: newUser.salary ? parseFloat(newUser.salary) : undefined,
        role_id: newUser.role_id === '' || newUser.role_id === undefined ? null : newUser.role_id,
      };
      await onCreateUser(userData);
      setMessage('User created successfully');
      setIsSuccess(true);
      resetForm();
    } catch (error) {
      let errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      if (errorMessage.includes('already exists')) {
        setFormErrors(prev => ({ ...prev, email: ['Email already exists'] }));
        setTouchedFields(prev => new Set(prev).add('email'));
        errorMessage = 'Please fix all errors before submitting';
      } else {
        setFormErrors(prev => ({ ...prev, email: [errorMessage] }));
        setTouchedFields(prev => new Set(prev).add('email'));
      }
      setMessage(errorMessage);
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    const allFields = ['name', 'email', 'password', 'user_type', 'phone_number', 'job_title', 'shift_time', 'salary'];
    setTouchedFields(new Set(allFields));
    const allErrors: any = {};
    allFields.forEach(field => {
      allErrors[field] = getFieldErrors(field, true);
    });
    setFormErrors(allErrors);
    const hasErrors = Object.values(allErrors).some((fieldErrors: any) => fieldErrors.length > 0);
    if (hasErrors) {
      setMessage('Please fix all errors before submitting');
      setIsSuccess(false);
      return;
    }
    setIsLoading((prev) => ({ ...prev, update: true }));
    try {
      const userData: Partial<User> = {
        _id: editUser._id,
        name: editUser.name.trim(),
        email: editUser.email.trim(),
        password: editUser.password?.trim() || undefined,
        user_type: editUser.user_type,
        role_id: editUser.role_id === '' || editUser.role_id === undefined ? null : editUser.role_id,
        phone_number: editUser.phone_number?.trim() || undefined,
        job_title: editUser.job_title?.trim() || undefined,
        shift_time: editUser.shift_time?.trim() || undefined,
        salary: editUser.salary ? parseFloat(editUser.salary.toString()) : undefined,
      };
      await onUpdateUser(userData);
      setUsers(prev => prev.map(user => user._id === editUser._id ? { ...user, ...userData } : user));
      setFilteredUsers(prev => prev.map(user => user._id === editUser._id ? { ...user, ...userData } : user));
      resetForm();
      setMessage('User updated successfully');
      setIsSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      setMessage(errorMessage);
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    setIsLoading((prev) => ({ ...prev, delete: true }));
    try {
      await onDeleteUser(deleteUserId);
      setMessage('User deleted successfully');
      setIsSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      setMessage(errorMessage);
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, delete: false }));
      onCancel();
    }
  };

  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = formErrors[fieldName as keyof FormErrors];
    if (!fieldErrors || fieldErrors.length === 0) return null;

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

  const renderForm = (isEdit: boolean) => {
    const data = isEdit ? editUser : newUser;
    const isSubmitting = isEdit ? isLoading.update : isLoading.create;
    return (
      <div ref={formRef} className="rounded-lg p-3 mb-3 shadow-sm" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: 'var(--background-color)', borderBottom: '1px solid var(--border-color)', borderTopLeftRadius: '0.5rem', borderTopRightRadius: '0.5rem' }}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
                {isEdit ? 'Edit User' : 'Create New User'}
              </h3>
            </div>
          </div>
          <button onClick={onCancel} style={{ color: 'var(--text-secondary)' }}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--background-secondary)', border: '1px solid var(--border-color)' }}>
          <form onSubmit={isEdit ? handleEditUser : handleCreateUser} className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={data?.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value, isEdit)}
                  onFocus={() => handleFocus('name', isEdit)}
                  onBlur={() => handleBlur('name', isEdit)}
                  className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${formErrors.name && formErrors.name.length > 0 ? 'ring-1' : ''}`}
                  style={{
                    borderColor: formErrors.name && formErrors.name.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    outlineColor: 'var(--focus-ring)',
                  }}
                  placeholder="Enter full name"
                  maxLength={100}
                  required
                />
                {renderFieldErrors('name')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {data?.name.length || 0}/100
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={data?.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value, isEdit)}
                  onFocus={() => handleFocus('email', isEdit)}
                  onBlur={() => handleBlur('email', isEdit)}
                  className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${formErrors.email && formErrors.email.length > 0 ? 'ring-1' : ''}`}
                  style={{
                    borderColor: formErrors.email && formErrors.email.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    outlineColor: 'var(--focus-ring)',
                  }}
                  placeholder="Enter email address"
                  maxLength={255}
                  required
                />
                {renderFieldErrors('email')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {data?.email.length || 0}/255
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {isEdit ? 'Password (Optional)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={data?.password || ''}
                  onChange={(e) => handleInputChange('password', e.target.value, isEdit)}
                  onFocus={() => handleFocus('password', isEdit)}
                  onBlur={() => handleBlur('password', isEdit)}
                  className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${formErrors.password && formErrors.password.length > 0 ? 'ring-1' : ''}`}
                  style={{
                    borderColor: formErrors.password && formErrors.password.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    outlineColor: 'var(--focus-ring)',
                  }}
                  placeholder={isEdit ? 'Leave empty to keep current password' : 'Enter password'}
                  maxLength={100}
                  required={!isEdit}
                />
                {renderFieldErrors('password')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {data?.password?.length || 0}/100
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  User Type *
                </label>
                <select
                    value={data?.user_type || 'worker'}
                    onChange={(e) => handleInputChange('user_type', e.target.value, isEdit)}
                    onFocus={() => handleFocus('user_type', isEdit)}
                    onBlur={() => handleBlur('user_type', isEdit)}
                    className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${formErrors.user_type && formErrors.user_type.length > 0 ? 'ring-1' : ''}`}
                    style={{
                      borderColor: formErrors.user_type && formErrors.user_type.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                      backgroundColor: 'var(--background-color)',
                      color: 'var(--text-color)',
                      outlineColor: 'var(--focus-ring)',
                    }}
                    required
                >
                  <option value="worker">Worker</option>
                  <option value="waiter">Waiter</option>
                  <option value="rider">Rider</option>
                </select>
                {renderFieldErrors('user_type')}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={data?.phone_number || ''}
                  onChange={(e) => handleInputChange('phone_number', e.target.value, isEdit)}
                  onFocus={() => handleFocus('phone_number', isEdit)}
                  onBlur={() => handleBlur('phone_number', isEdit)}
                  className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${formErrors.phone_number && formErrors.phone_number.length > 0 ? 'ring-1' : ''}`}
                  style={{
                    borderColor: formErrors.phone_number && formErrors.phone_number.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    outlineColor: 'var(--focus-ring)',
                  }}
                  placeholder="e.g., +1234567890"
                  maxLength={20}
                />
                {renderFieldErrors('phone_number')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {data?.phone_number?.length || 0}/20
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Job Title (Optional)
                </label>
                <input
                  type="text"
                  value={data?.job_title || ''}
                  onChange={(e) => handleInputChange('job_title', e.target.value, isEdit)}
                  onFocus={() => handleFocus('job_title', isEdit)}
                  onBlur={() => handleBlur('job_title', isEdit)}
                  className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${formErrors.job_title && formErrors.job_title.length > 0 ? 'ring-1' : ''}`}
                  style={{
                    borderColor: formErrors.job_title && formErrors.job_title.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    outlineColor: 'var(--focus-ring)',
                  }}
                  placeholder="e.g., Chef, Server, Manager"
                  maxLength={100}
                />
                {renderFieldErrors('job_title')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {data?.job_title?.length || 0}/100
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Shift Time (Optional)
                </label>
                <input
                  type="text"
                  value={data?.shift_time || ''}
                  onChange={(e) => handleInputChange('shift_time', e.target.value, isEdit)}
                  onFocus={() => handleFocus('shift_time', isEdit)}
                  onBlur={() => handleBlur('shift_time', isEdit)}
                  className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${formErrors.shift_time && formErrors.shift_time.length > 0 ? 'ring-1' : ''}`}
                  style={{
                    borderColor: formErrors.shift_time && formErrors.shift_time.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    outlineColor: 'var(--focus-ring)',
                  }}
                  placeholder="e.g., 9:00 AM - 5:00 PM"
                  maxLength={100}
                />
                {renderFieldErrors('shift_time')}
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {data?.shift_time?.length || 0}/100
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Salary (Optional)
                </label>
                <input
                  type="number"
                  value={data?.salary || ''}
                  onChange={(e) => handleInputChange('salary', e.target.value, isEdit)}
                  onFocus={() => handleFocus('salary', isEdit)}
                  onBlur={() => handleBlur('salary', isEdit)}
                  className={`w-full p-2 text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors duration-200 ${formErrors.salary && formErrors.salary.length > 0 ? 'ring-1' : ''}`}
                  style={{
                    borderColor: formErrors.salary && formErrors.salary.length > 0 ? 'var(--error-color)' : 'var(--border-color)',
                    backgroundColor: 'var(--background-color)',
                    color: 'var(--text-color)',
                    outlineColor: 'var(--focus-ring)',
                  }}
                  placeholder="e.g., 50000"
                  min="0"
                  step="0.01"
                />
                {renderFieldErrors('salary')}
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                disabled={isLoading.create || isLoading.update || !isFormValid(isEdit)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.create || isLoading.update || !isFormValid(isEdit) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white'}`}
                style={{
                  backgroundColor: isLoading.create || isLoading.update || !isFormValid(isEdit) ? undefined : 'var(--primary-color)',
                  color: isLoading.create || isLoading.update || !isFormValid(isEdit) ? undefined : 'var(--text-on-primary)',
                  cursor: isLoading.create || isLoading.update || !isFormValid(isEdit) ? 'not-allowed' : 'pointer',
                  '--tw-ring-color': 'var(--focus-ring)',
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--text-on-primary)' }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEdit ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  isEdit ? 'Update User' : 'Create User'
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.create || isLoading.update ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''}`}
                style={{
                  backgroundColor: 'var(--background-color)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  cursor: isLoading.create || isLoading.update ? 'not-allowed' : 'pointer',
                  '--tw-ring-color': 'var(--focus-ring)',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDeleteConfirmation = () => {
    const userToDelete = users.find((user) => user._id === deleteUserId);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
        <div className="bg-[--surface-color] rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
          <div className="flex items-center space-x-2 mb-4">
            <ExclamationCircleIcon className="w-6 h-6" style={{ color: 'var(--error-color)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
              Confirm Delete
            </h3>
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to delete {userToDelete?.name || 'this user'}? This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleDeleteUser}
              disabled={isLoading.delete}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.delete ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[var(--error-color)] text-white hover:bg-opacity-90'}`}
              style={{ '--tw-ring-color': 'var(--focus-ring)' } as React.CSSProperties}
            >
              {isLoading.delete ? (
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
              onClick={onCancel}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 transition-colors duration-200 ${isLoading.delete ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--background-secondary)]'}`}
              style={{
                backgroundColor: isLoading.delete ? undefined : 'var(--background-color)',
                '--tw-ring-color': 'var(--focus-ring)',
              } as React.CSSProperties}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {(showCreateForm || editUser) && renderForm(!!editUser)}
      {mode === 'delete' && renderDeleteConfirmation()}
    </>
  );
};

export default UserCrud;
