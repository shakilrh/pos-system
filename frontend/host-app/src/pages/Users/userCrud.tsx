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

  const validateForm = (isEdit: boolean): boolean => {
    const errors: FormErrors = {};
    const data = isEdit ? editUser : newUser;

    if (!data) return false;

    if (!data.name.trim()) {
      errors.name = 'Name is required';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (data.name.trim().length > 100) {
      errors.name = 'Name must not exceed 100 characters';
    }

    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.email = 'Invalid email format';
    } else if (data.email.trim().length > 255) {
      errors.email = 'Email must not exceed 255 characters';
    } else if (!isEdit) {
      const isDuplicate = users.some((user) => user.email.toLowerCase() === data.email.trim().toLowerCase());
      if (isDuplicate) {
        errors.email = 'Email already exists';
      }
    }

    if (!isEdit && !data.password?.trim()) {
      errors.password = 'Password is required';
    } else if (data.password && data.password.trim().length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (data.password && data.password.trim().length > 100) {
      errors.password = 'Password must not exceed 100 characters';
    }

    if (data.phone_number?.trim()) {
      if (!/^\+?[\d\s-]{7,20}$/.test(data.phone_number.trim())) {
        errors.phone_number = 'Invalid phone number format';
      }
    }

    if (data.job_title?.trim() && data.job_title.trim().length > 100) {
      errors.job_title = 'Job title must not exceed 100 characters';
    }

    if (data.shift_time?.trim() && data.shift_time.trim().length > 100) {
      errors.shift_time = 'Shift time must not exceed 100 characters';
    }

    if (data.salary && (isNaN(parseFloat(data.salary)) || parseFloat(data.salary) < 0)) {
      errors.salary = 'Salary must be a valid positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string, isEdit: boolean) => {
    if (isEdit && editUser) {
      setEditUser({ ...editUser, [field]: value });
    } else {
      setNewUser({ ...newUser, [field]: value });
    }
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setNewUser({ name: '', email: '', password: '', user_type: 'worker', role_id: null, phone_number: '', job_title: '', shift_time: '', salary: '' });
    setEditUser(null);
    setOriginalUser(null);
    setFormErrors({});
    setShowCreateForm(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm(false)) return;

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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create user');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser || !validateForm(true)) return;

    setIsLoading((prev) => ({ ...prev, update: true }));
    try {
      const userData: Partial<User> = { _id: editUser._id };
      if (editUser.name !== originalUser?.name) userData.name = editUser.name.trim();
      if (editUser.email !== originalUser?.email) userData.email = editUser.email.trim();
      if (editUser.password) userData.password = editUser.password.trim();
      if (editUser.user_type !== originalUser?.user_type) userData.user_type = editUser.user_type;
      if (editUser.role_id !== originalUser?.role_id) userData.role_id = editUser.role_id === '' || editUser.role_id === undefined ? null : editUser.role_id;
      if (editUser.phone_number !== originalUser?.phone_number) userData.phone_number = editUser.phone_number?.trim() || undefined;
      if (editUser.job_title !== originalUser?.job_title) userData.job_title = editUser.job_title?.trim() || undefined;
      if (editUser.shift_time !== originalUser?.shift_time) userData.shift_time = editUser.shift_time?.trim() || undefined;
      if (editUser.salary !== originalUser?.salary) userData.salary = editUser.salary ? parseFloat(editUser.salary.toString()) : undefined;

      await onUpdateUser(userData);
      resetForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update user');
      setIsSuccess(false);
    } finally {
      setIsLoading((prev) => ({ ...prev, update: false }));
    }
  };

  const renderForm = (isEdit: boolean) => {
    const data = isEdit ? editUser : newUser;
    const isSubmitting = isEdit ? isLoading.update : isLoading.create;

    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6 shadow-sm">
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
            {[
              { label: 'Name *', field: 'name', type: 'text', value: data?.name || '', required: true },
              { label: 'Email *', field: 'email', type: 'email', value: data?.email || '', required: true },
              { label: isEdit ? 'Password (Optional)' : 'Password *', field: 'password', type: 'password', value: data?.password || '', required: !isEdit },
              { label: 'User Type', field: 'user_type', type: 'text', value: 'Worker', disabled: true },
              { label: 'Role (Optional)', field: 'role_id', type: 'select', value: data?.role_id || '', options: roles },
              { label: 'Phone Number (Optional)', field: 'phone_number', type: 'tel', value: data?.phone_number || '' },
              { label: 'Job Title (Optional)', field: 'job_title', type: 'text', value: data?.job_title || '' },
              { label: 'Shift Time (Optional)', field: 'shift_time', type: 'text', value: data?.shift_time || '' },
              { label: 'Salary (Optional)', field: 'salary', type: 'number', value: data?.salary || '' },
            ].map((field, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={field.value || ''}
                    onChange={(e) => handleInputChange(field.field as keyof FormData, e.target.value, isEdit)}
                    className={`w-full p-2.5 text-sm rounded-lg border ${
                      formErrors[field.field as keyof FormErrors]
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                    disabled={field.disabled}
                  >
                    <option value="">Select Role</option>
                    {field.options?.map((role: Role) => (
                      <option key={role._id} value={role._id}>{role.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={(e) => handleInputChange(field.field as keyof FormData, e.target.value, isEdit)}
                    className={`w-full p-2.5 text-sm rounded-lg border ${
                      formErrors[field.field as keyof FormErrors]
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200`}
                    disabled={field.disabled}
                    required={field.required}
                    maxLength={field.field === 'name' || field.field === 'job_title' || field.field === 'shift_time' ? 100 : field.field === 'email' ? 255 : undefined}
                    placeholder={field.field === 'phone_number' ? 'e.g., +1234567890' : undefined}
                  />
                )}
                {formErrors[field.field as keyof FormErrors] && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors[field.field as keyof FormErrors]}</p>
                )}
                {(field.field === 'name' || field.field === 'email') && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {field.value.length}/{field.field === 'name' ? 100 : 255}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
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
