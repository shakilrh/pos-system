import { useState, useEffect } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import Categories from './Categories';
import Products from './products';

interface Category {
  _id: string;
  name: string;
  description: string;
  created_by: string;
  createdAt?: string;
  updatedAt?: string;
  __v: number;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  category_id: string;
  categoryName: string;
  description: string;
  pictureUrl?: string | null;
  displayPrice: string;
}

export default function MenuManagement() {
  const { isAuthenticated, token, logout } = useAuth();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [clientLoaded, setClientLoaded] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryFormActive, setIsCategoryFormActive] = useState<boolean>(false);
  const [isProductFormActive, setIsProductFormActive] = useState<boolean>(false);

  const handleSetFormMode = (mode: 'add' | 'edit' | null, component: 'category' | 'product', product?: Product) => {
    if (component === 'category') {
      setIsCategoryFormActive(!!mode);
    } else {
      setIsProductFormActive(!!mode);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      setDarkMode(savedTheme === 'dark');
      setClientLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (clientLoaded) {
      document.documentElement.classList.toggle('dark', darkMode);
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', darkMode ? 'dark' : 'light');
      }
    }
  }, [darkMode, clientLoaded]);

  if (!clientLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center p-6 max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="text-indigo-500 dark:text-indigo-400 text-2xl mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center p-6 max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="text-indigo-500 dark:text-indigo-400 text-2xl mb-4">Authentication Required</div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Please log in to access the Menu Management Dashboard.
          </p>
          <button
            onClick={() => window.location.href = '/pos-system/login'}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-900">
      <div className="flex justify-end mb-4">

      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Categories
          token={token}
          isAuthenticated={isAuthenticated}
          logout={logout}
          categories={categories}
          setCategories={setCategories}
          onFormActive={setIsCategoryFormActive}
          isProductFormActive={isProductFormActive}
        />
        <Products
          token={token}
          isAuthenticated={isAuthenticated}
          logout={logout}
          categories={categories}
          setFormMode={(mode, product) => handleSetFormMode(mode, 'product', product)}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          isFormActive={isProductFormActive}
          isCategoryFormActive={isCategoryFormActive}
        />
      </div>
    </div>
  );
}
