import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import { lightTheme } from './lightTheme';
import { darkTheme } from './darkTheme';
import { Theme } from './lightTheme';

// Define the theme context type
type ThemeContextType = {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
};

// Create the theme context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: 'light' | 'dark' | 'system';
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'system',
}) => {
  // State to track if dark mode is active
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Initialize based on initialTheme prop
    if (initialTheme === 'light') return false;
    if (initialTheme === 'dark') return true;
    
    // If 'system', check user's system preference
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    return false;
  });

  // Listen for system theme changes if initialTheme is 'system'
  useEffect(() => {
    if (initialTheme !== 'system' || typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [initialTheme]);

  // Get the current theme object
  const theme = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Set a specific theme
  const setTheme = (theme: 'light' | 'dark') => {
    setIsDarkMode(theme === 'dark');
  };

  // Context value
  const contextValue = useMemo(
    () => ({
      theme,
      isDarkMode,
      toggleTheme,
      setTheme,
    }),
    [theme, isDarkMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <EmotionThemeProvider theme={theme}>
        {children}
      </EmotionThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};