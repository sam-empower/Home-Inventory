import React, { createContext, useState, useEffect, useContext, useCallback } from "react";

type ThemeMode = "light" | "dark" | "system";
type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for the theme mode (light, dark, or system)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    // Initialize from localStorage, default to system
    const savedThemeMode = localStorage.getItem('themeMode') as ThemeMode | null;
    return savedThemeMode || 'system';
  });
  
  // Actual theme that is applied (light or dark only)
  const [theme, setTheme] = useState<Theme>(() => {
    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeMode as Theme;
  });

  // Function to update theme based on mode
  const updateThemeFromMode = useCallback((mode: ThemeMode) => {
    if (mode === 'system') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(isDarkMode ? 'dark' : 'light');
    } else {
      setTheme(mode as Theme);
    }
  }, []);

  // Set up system theme change listeners
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (themeMode === 'system') {
        updateThemeFromMode('system');
      }
    };
    
    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [themeMode, updateThemeFromMode]);

  // Update theme when mode changes
  useEffect(() => {
    updateThemeFromMode(themeMode);
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode, updateThemeFromMode]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'system') {
        return theme === 'light' ? 'dark' : 'light';
      } else {
        return prev === 'light' ? 'dark' : 'light';
      }
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
