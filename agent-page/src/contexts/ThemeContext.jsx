import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Always use light theme
  const theme = 'light';

  useEffect(() => {
    // Apply theme to document root - always light
    const root = document.documentElement;
    root.classList.remove('dark');
    root.style.colorScheme = 'light';

    // Save to localStorage
    localStorage.setItem('theme', 'light');

    console.log('Theme set to:', theme);
  }, []);

  // No-op toggle function
  const toggleTheme = () => {
    console.log('Theme toggle disabled - only light theme available');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
};
