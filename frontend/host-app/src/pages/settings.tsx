import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [language, setLanguage] = useState('English');
  const [darkMode, setDarkMode] = useState(false);
  const [theme, setTheme] = useState('default');

  useEffect(() => {
    const savedTheme = localStorage.getItem('appTheme') || 'default';
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setTheme(savedTheme);
    setDarkMode(savedDarkMode);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (selectedTheme: string) => {
    document.documentElement.setAttribute('data-theme', selectedTheme);
    localStorage.setItem('appTheme', selectedTheme);
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme: selectedTheme } }));
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Customize your experience</p>
        </div>

        {/* Settings Cards */}
        <div className="space-y-6">
          {/* Language Setting */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Language</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred language</p>
              </div>
              <div className="text-2xl">🌐</div>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="English">English</option>
              <option value="Spanish">Español</option>
              <option value="French">Français</option>
              <option value="German">Deutsch</option>
            </select>
          </div>

          {/* Theme Setting */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Theme</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select your color theme</p>
              </div>
              <div className="text-2xl">🎨</div>
            </div>

            {/* Theme Options as Buttons */}
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'default', label: 'Default', color: 'bg-orange-500', border: 'border-orange-200' },
                { value: 'blue', label: 'Blue', color: 'bg-blue-500', border: 'border-blue-200' },
                { value: 'green', label: 'Green', color: 'bg-emerald-600', border: 'border-emerald-200' },
                { value: 'defaultNo2', label: 'Default No2', color: 'bg-blue-800', border: 'border-blue-300' },
                { value: 'professional', label: 'Professional', color: 'bg-gray-900', border: 'border-gray-400' },
                { value: 'modern-blue', label: 'Modern Blue', color: 'bg-teal-700', border: 'border-teal-200' },
                { value: 'warm-minimal', label: 'Warm Minimal', color: 'bg-orange-900', border: 'border-orange-300' },
                { value: 'dark-pro', label: 'Dark Pro', color: 'bg-gray-800', border: 'border-gray-500' },
              ].map((themeOption) => {
                const isActive = theme === themeOption.value;
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => {
                      setTheme(themeOption.value);
                      applyTheme(themeOption.value);
                    }}
                    className={`group relative flex flex-col items-center justify-center w-28 h-20 rounded-xl border bg-white dark:bg-gray-900 shadow-sm transition-all duration-150
          ${isActive
                        ? 'border-primary ring-2 ring-primary/40 scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/60 hover:shadow-md'
                      }
          focus:outline-none focus:ring-2 focus:ring-primary/60
        `}
                    style={isActive ? { boxShadow: '0 2px 12px 0 var(--primary-color, #f97316, 0.08)' } : {}}
                    aria-label={`Select ${themeOption.label} theme`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full mb-2 border-2 ${themeOption.color} ${themeOption.border} shadow-sm`}
                    />
                    <span className={`text-xs font-medium text-gray-900 dark:text-white`}>
                      {themeOption.label}
                    </span>
                    {isActive && (
                      <span className="absolute top-2 right-2 text-primary text-base font-bold">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}