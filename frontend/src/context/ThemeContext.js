import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const validThemes = ['default', 'dark', 'blue-ocean', 'warm-sunset', 'forest-mist', 'twilight-glow'];
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme && validThemes.includes(savedTheme) ? savedTheme : 'default';
  });

  useEffect(() => {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const switchTheme = (newTheme) => {
    if (validThemes.includes(newTheme)) {
      setTheme(newTheme);
    } else {
      setTheme('default');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, switchTheme, validThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};
