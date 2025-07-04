import React from 'react';
import { XMarkIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';
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
                                           }) => {
  const [newUser, setNewUser] = React.useState<FormData>({
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
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(new Set());
  const formRef = React.useRef<HTMLDivElement>(null);

  // Enhanced validation functions that return arrays of error messages
  const validateName = (name: string): string[] => {
    const errors: string[] = [];
    if (!name.trim()) {
      errors.push('Name is required');
    } else {
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
    if (!email.trim()) {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) errors.push('Please enter a valid email address');
      if (email.length > 255) errors.push('Email address is too long');
      if (email.includes('..')) errors.push('Email cannot contain consecutive dots');

      if (!isEdit || (isEdit && originalUser && email.toLowerCase() !== originalUser.email.toLowerCase())) {
        const isDuplicate = users.some((user) => user.email.toLowerCase() === email.toLowerCase());
        if (isDuplicate) {
          errors.push('Email already exists');
        }
      }
    }
    return errors;
  };

  const validatePassword = (password: string, isEdit: boolean = false): string[] => {
    const errors: string[] = [];
    if (!isEdit && !password.trim()) {
      errors.push('Password is required');
    } else if (password && password.trim()) {
      if (password.length < 8) errors.push('Password must be at least 8 characters long');
      if (password.length > 100) errors.push('Password must be less than 100 characters');
      if (!/[A-Z]/.test(password)) errors.push('Password must include at least one uppercase letter');
      if (!/[a-z]/.test(password)) errors.push('Password must include at least one lowercase letter');
      if (!/[0-9]/.test(password)) errors.push('Password must include at least one number');
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must include at least one special character');
      }
      if (/\s/.test(password)) errors.push('Password cannot contain spaces');
      if (/(.)\1{2,}/.test(password)) errors.push('Password cannot contain more than 2 consecutive identical characters');
    }
    return errors;
  };

  const validatePhoneNumber = (phone: string): string[] => {
    const errors: string[] = [];
    if (phone && phone.trim()) {
      if (!/^\+?[\d\s-()]{7,20}$/.test(phone.trim())) {
        errors.push('Invalid phone number format');
      }
      if (phone.length > 20) errors.push('Phone number is too long');
    }
    return errors;
  };

  const validateJobTitle = (jobTitle: string): string[] => {
    const errors: string[] = [];
    if (jobTitle && jobTitle.trim()) {
      if (jobTitle.length > 100) errors.push('Job title must be less than 100 characters');
      if (!/^[A-Za-z0-9\s&'-.,()]+$/.test(jobTitle)) {
        errors.push('Job title can only contain letters, numbers, spaces, and common punctuation');
      }
      if (/^\s|\s$/.test(jobTitle)) errors.push('Job title cannot start or end with spaces');
      if (/\s{2,}/.test(jobTitle)) errors.push('Job title cannot contain multiple consecutive spaces');
    }
    return errors;
  };

  const validateShiftTime = (shiftTime: string): string[] => {
    const errors: string[] = [];
    if (shiftTime && shiftTime.trim()) {
      if (shiftTime.length > 100) errors.push('Shift time must be less than 100 characters');
      if (!/^[A-Za-z0-9\s:-]+$/.test(shiftTime)) {
        errors.push('Shift time can only contain letters, numbers, spaces, colons, and hyphens');
      }
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

  const getFieldErrors = (fieldName: string, isEdit: boolean = false): string[] => {
    const data = isEdit ? editUser : newUser;
    if (!data) return [];

    switch (fieldName) {
      case 'name':
        return validateName(data.name);
      case 'email':
        return validateEmail(data.email, isEdit);
      case 'password':
        return validatePassword(data.password || '', isEdit);
      case 'phone_number':
        return validatePhoneNumber(data.phone_number || '');
      case 'job_title':
        return validateJobTitle(data.job_title || '');
      case 'shift_time':
        return validateShiftTime(data.shift_time || '');
      case 'salary':
        return validateSalary(data.salary || '');
      default:
        return [];
    }
  };

  const isFormValid = (isEdit: boolean = false): boolean => {
    const requiredFields = ['name', 'email'];
    if (!isEdit) requiredFields.push('password');

    return requiredFields.every(field => {
      const errors = getFieldErrors(field, isEdit);
      return errors.length === 0;
    });
  };

  React.useEffect(() => {
    if (editUser && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editUser]);

  const handleInputChange = (field: keyof FormData, value: string, isEdit: boolean) => {
    if (isEdit && editUser) {
      setEditUser({ ...editUser, [field]: value });
    } else {
      setNewUser({ ...newUser, [field]: value });
    }

    if (touchedFields.has(field)) {
      setFormErrors(prev => ({
        ...prev,
        [field]: getFieldErrors(field, isEdit)
      }));
    }
  };

  const handleFocus = (fieldName: string, isEdit: boolean) => {
    setTouchedFields(prev => new Set(prev).add(fieldName));
    setFormErrors(prev => ({
      ...prev,
      [fieldName]: getFieldErrors(fieldName, isEdit)
    }));
  };

  const handleBlur = (fieldName: string, isEdit: boolean) => {
    if (touchedFields.has(fieldName)) {
      setFormErrors(prev => ({
        ...prev,
        [fieldName]: getFieldErrors(fieldName, isEdit)
      }));
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
      salary: ''
    });
    setEditUser(null);
    setOriginalUser(null);
    setFormErrors({});
    setTouchedFields(new Set());
    setShowCreateForm(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = ['name', 'email', 'password'];
    const allFields = ['name', 'email', 'password', 'phone_number', 'job_title', 'shift_time', 'salary Bolivia'];
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
      resetForm();
      setMessage('User created successfully');
      setIsSuccess(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create user');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    const allFields = ['name', 'email', 'password', 'phone_number', 'job_title', 'shift_time', 'salary'];
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
      setMessage(error instanceof Error ? error.message : 'Failed to update user');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const renderFieldErrors = (fieldName: string) => {
    const fieldErrors = formErrors[fieldName as keyof FormErrors];
    if (!fieldErrors || (Array.isArray(fieldErrors) ? fieldErrors.length === 0 : !fieldErrors)) return null;

    const errors = Array.isArray(fieldErrors) ? fieldErrors : [fieldErrors];

    return (
      <div className="mt-1 space-y-1">
        {errors.map((error, index) => (
          <p key={index} className="text-red-500 text-xs flex items-start">
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
      <div ref={formRef} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit User' : 'Create New User'}
          </h3>
          <button
            onClick={resetForm}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={isEdit ? handleEditUser : handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={data?.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value, isEdit)}
                onFocus={() => handleFocus('name', isEdit)}
                onBlur={() => handleBlur('name', isEdit)}
                className={`w-full p-2.5 text-sm rounded-lg border ${
                  formErrors.name && (Array.isArray(formErrors.name) ? formErrors.name.length > 0 : formErrors.name)
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                placeholder="Enter full name"
                required
              />
              {renderFieldErrors('name')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={data?.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value, isEdit)}
                onFocus={() => handleFocus('email', isEdit)}
                onBlur={() => handleBlur('email', isEdit)}
                className={`w-full p-2.5 text-sm rounded-lg border ${
                  formErrors.email && (Array.isArray(formErrors.email) ? formErrors.email.length > 0 : formErrors.email)
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                placeholder="Enter email address"
                required
              />
              {renderFieldErrors('email')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {isEdit ? 'Password (Optional)' : 'Password *'}
              </label>
              <input
                type="password"
                value={data?.password || ''}
                onChange={(e) => handleInputChange('password', e.target.value, isEdit)}
                onFocus={() => handleFocus('password', isEdit)}
                onBlur={() => handleBlur('password', isEdit)}
                className={`w-full p-2.5 text-sm rounded-lg border ${
                  formErrors.password && (Array.isArray(formErrors.password) ? formErrors.password.length > 0 : formErrors.password)
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                placeholder={isEdit ? 'Leave empty to keep current password' : 'Enter password'}
                required={!isEdit}
              />
              {renderFieldErrors('password')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User Type
              </label>
              <input
                type="text"
                value="Worker"
                className="w-full p-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role (Optional)
              </label>
              <select
                value={data?.role_id || ''}
                onChange={(e) => handleInputChange('role_id', e.target.value, isEdit)}
                className="w-full p-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <option value="">Select Role</option>
                {roles.map((role: Role) => (
                  <option key={role._id} value={role._id}>{role.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={data?.phone_number || ''}
                onChange={(e) => handleInputChange('phone_number', e.target.value, isEdit)}
                onFocus={() => handleFocus('phone_number', isEdit)}
                onBlur={() => handleBlur('phone_number', isEdit)}
                className={`w-full p-2.5 text-sm rounded-lg border ${
                  formErrors.phone_number && (Array.isArray(formErrors.phone_number) ? formErrors.phone_number.length > 0 : formErrors.phone_number)
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                placeholder="e.g., +1234567890"
              />
              {renderFieldErrors('phone_number')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Title (Optional)
              </label>
              <input
                type="text"
                value={data?.job_title || ''}
                onChange={(e) => handleInputChange('job_title', e.target.value, isEdit)}
                onFocus={() => handleFocus('job_title', isEdit)}
                onBlur={() => handleBlur('job_title', isEdit)}
                className={`w-full p-2.5 text-sm rounded-lg border ${
                  formErrors.job_title && (Array.isArray(formErrors.job_title) ? formErrors.job_title.length > 0 : formErrors.job_title)
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                placeholder="e.g., Chef, Server, Manager"
              />
              {renderFieldErrors('job_title')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Shift Time (Optional)
              </label>
              <input
                type="text"
                value={data?.shift_time || ''}
                onChange={(e) => handleInputChange('shift_time', e.target.value, isEdit)}
                onFocus={() => handleFocus('shift_time', isEdit)}
                onBlur={() => handleBlur('shift_time', isEdit)}
                className={`w-full p-2.5 text-sm rounded-lg border ${
                  formErrors.shift_time && (Array.isArray(formErrors.shift_time) ? formErrors.shift_time.length > 0 : formErrors.shift_time)
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                placeholder="e.g., 9:00 AM - 5:00 PM"
              />
              {renderFieldErrors('shift_time')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Salary (Optional)
              </label>
              <input
                type="number"
                value={data?.salary || ''}
                onChange={(e) => handleInputChange('salary', e.target.value, isEdit)}
                onFocus={() => handleFocus('salary', isEdit)}
                onBlur={() => handleBlur('salary', isEdit)}
                className={`w-full p-2.5 text-sm rounded-lg border ${
                  formErrors.salary && (Array.isArray(formErrors.salary) ? formErrors.salary.length > 0 : formErrors.salary)
                    ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                placeholder="e.g., 50000"
                min="0"
                step="0.01"
              />
              {renderFieldErrors('salary')}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid(isEdit)}
              className={`flex-1 ${
                isSubmitting || !isFormValid(isEdit)
                  ? 'bg-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mt-6">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management</h2>
          </div>
          {!showCreateForm && !editUser && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add User</span>
            </button>
          )}
        </div>
      </div>
      {(showCreateForm || editUser) && renderForm(!!editUser)}
    </div>
  );
};

export default UserCrud;
