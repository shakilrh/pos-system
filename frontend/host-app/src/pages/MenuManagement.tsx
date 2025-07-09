import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Categories from './Categories/categories';
import Products from './Products/products';
import { Category, Product } from './Products/productTypes';

export default function MenuManagement() {
  const { isAuthenticated, token, logout } = useAuth();
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
      setClientLoaded(true);
    }
  }, []);

  if (!clientLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--background-color)]">
        <div className="text-center p-6 max-w-md bg-[var(--background-secondary)] rounded-xl shadow-lg border border-[var(--border-color)]">
          <div className="text-[var(--primary-color)] text-2xl mb-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--background-color)]">
        <div className="text-center p-6 max-w-md bg-[var(--background-secondary)] rounded-xl shadow-lg border border-[var(--border-color)]">
          <h2 className="text-2xl font-bold text-[var(--text-color)] mb-4">Access Denied</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Please log in to access the Menu Management Dashboard.
          </p>
          <button
            onClick={() => window.location.href = '/pos-system/login'}
            className="px-4 py-2 bg-[var(--primary-color)] text-[var(--sidebar-text)] rounded-lg hover:bg-[var(--primary-700)] transition-colors"
          >
            Go to Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pl-4 pr-4 py-4 bg-[var(--background-color)]">
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 h-full">
        <div className="lg:col-span-3 pl-2">
          <Categories
            token={token}
            isAuthenticated={isAuthenticated}
            logout={logout}
            categories={categories}
            setCategories={setCategories}
            onFormActive={setIsCategoryFormActive}
            isProductFormActive={isProductFormActive}
          />
        </div>
        <div className="lg:col-span-7">
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
    </div>
  );
}