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
            
            {/* Theme Options as Cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'default', label: 'Default', color: 'bg-gray-500' },
                { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
                { value: 'green', label: 'Green', color: 'bg-green-500' }
              ].map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    setTheme(themeOption.value);
                    applyTheme(themeOption.value);
                  }}
                  className={`relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                    theme === themeOption.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full ${themeOption.color} mx-auto mb-2`}></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {themeOption.label}
                  </span>
                  {theme === themeOption.value && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}