import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Categories from './Categories/categories';
import Products from './Products/products';
import { Category, Product } from './Products/productTypes';

export default function MenuManagement() {
  const { isAuthenticated, token, logout } = useAuth();
  const [clientLoaded, setClientLoaded] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryFormActive, setIsCategoryFormActive] = useState<boolean>(false);
  const [isProductFormActive, setIsProductFormActive] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<string>('default');

  const handleSetFormMode = (mode: 'add' | 'edit' | null, component: 'category' | 'product', product?: Product) => {
    if (component === 'category') {
      setIsCategoryFormActive(!!mode);
    } else {
      setIsProductFormActive(!!mode);
    }
  };

  useEffect(() => {
    setClientLoaded(true);
    const theme = document.querySelector('html')?.getAttribute('data-theme') || 'default';
    setCurrentTheme(theme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.querySelector('html')?.getAttribute('data-theme') || 'default';
          setCurrentTheme(newTheme);
        }
      });
    });

    const htmlElement = document.querySelector('html');
    if (htmlElement) {
      observer.observe(htmlElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }

    return () => observer.disconnect();
  }, []);

  const getThemeColors = () => {
    if (currentTheme === 'dark' || currentTheme === 'dark-pro') {
      return {
        cardBackground: '#1f2937',
        cardBorder: '#374151',
        cardText: '#ffffff',
        headingText: '#ffffff',
      };
    }

    switch (currentTheme) {
      case 'blue':
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#1e3a8a',
          headingText: '#000',
        };
      case 'green':
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#064e3b',
          headingText: '#064e3b',
        };
      default:
        return {
          cardBackground: '#ffffff',
          cardBorder: '#e5e7eb',
          cardText: '#111827',
          headingText: '#111827',
        };
    }
  };

  const themeColors = getThemeColors();

  if (!clientLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--background-color)]">
        <div
          className="text-center p-6 max-w-md rounded-lg shadow-md border"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.cardBorder,
            color: themeColors.cardText,
          }}
        >
          <div className="text-2xl mb-4" style={{ color: themeColors.headingText }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--background-color)]">
        <div
          className="text-center p-6 max-w-md rounded-lg shadow-md border"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.cardBorder,
            color: themeColors.cardText,
          }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: themeColors.headingText }}>
            Access Denied
          </h2>
          <p className="mb-6" style={{ color: themeColors.cardText }}>
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
    <div className="w-full min-h-screen py-4 bg-[var(--background-color)]">
      <div
        className="rounded-lg shadow-md border w-full p-4 mb-6"
        style={{
          backgroundColor: themeColors.cardBackground,
          borderColor: themeColors.cardBorder,
          color: themeColors.cardText,
        }}
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <div className="mb-3 lg:mb-0">
          <h1 className="text-2xl font-bold" style={{color: themeColors.headingText}}>Menu Management</h1>
          </div>
        </div>
      </div>
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
            <div className="lg:col-span-3">
              <div
                  className="rounded-lg shadow-md border"
                  style={{
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.cardBorder,
                    color: themeColors.cardText,
                  }}
              >
                <Categories
                    token={token}
                    isAuthenticated={isAuthenticated}
                    logout={logout}
                    categories={categories as any}  // 🚨 temporary bypass
                    setCategories={setCategories as any}
                    onFormActive={setIsCategoryFormActive}
                    isProductFormActive={isProductFormActive}
                />

              </div>
            </div>
            <div className="lg:col-span-7">
              <div
                  className="rounded-lg shadow-md border"
                  style={{
                    backgroundColor: themeColors.cardBackground,
                    borderColor: themeColors.cardBorder,
                    color: themeColors.cardText,
                  }}
              >
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
        </div>

  );
}
