import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Theme color definitions
export const themeColors: Record<ThemeMode, ThemeColors> = {
  dark: {
    primary: '#FBBF24', // cc-yellow-400
    secondary: '#F59E0B', // cc-yellow-500
    background: '#000000', // cc-black-950
    surface: '#1F2937', // cc-black-800
    surfaceVariant: '#374151', // cc-black-700
    text: '#FFFFFF',
    textSecondary: '#D1D5DB', // cc-black-300
    accent: '#FBBF24',
    border: '#374151',
    borderAccent: '#FBBF24',
  },
  light: {
    primary: '#F59E0B', // cc-yellow-500
    secondary: '#D97706', // cc-yellow-600
    background: '#FFFFFF',
    surface: '#F9FAFB', // cc-black-50
    surfaceVariant: '#F3F4F6', // cc-black-100
    text: '#111827', // cc-black-900
    textSecondary: '#6B7280', // cc-black-500
    accent: '#F59E0B',
    border: '#E5E7EB', // cc-black-200
    borderAccent: '#F59E0B',
  }
};

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;
  borderAccent: string;
}

interface ThemeContextType {
  isDarkMode: boolean;
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Storage key for theme preference
const THEME_STORAGE_KEY = 'cc-dashboard-theme';

// Helper function to safely access localStorage
const getStoredTheme = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }
  // Default to dark mode for call center aesthetic
  return 'dark';
};

// Helper function to safely store theme
const storeTheme = (mode: ThemeMode): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Failed to store theme in localStorage:', error);
  }
};

// Helper function to apply theme to document
const applyThemeToDocument = (mode: ThemeMode): void => {
  try {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('dark', 'light');

    // Add new theme class
    root.classList.add(mode);

    // Set CSS custom properties for immediate theme switching
    const colors = themeColors[mode];
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--cc-${key}`, value);
    });

    // Set meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.background);
    }
  } catch (error) {
    console.warn('Failed to apply theme to document:', error);
  }
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme());

  // Memoized values
  const isDarkMode = mode === 'dark';
  const colors = themeColors[mode];

  // Apply theme changes
  useEffect(() => {
    applyThemeToDocument(mode);
    storeTheme(mode);
  }, [mode]);

  // Initialize theme on mount
  useEffect(() => {
    applyThemeToDocument(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(prevMode => prevMode === 'dark' ? 'light' : 'dark');
  }, []);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  const contextValue: ThemeContextType = {
    isDarkMode,
    mode,
    colors,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};