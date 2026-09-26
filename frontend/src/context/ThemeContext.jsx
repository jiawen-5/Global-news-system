import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const darkThemeStyles = {
  header: {
    backgroundColor: '#2d2d2d',
    color: 'white',
    padding: 0,
  },
  card: {
    backgroundColor: '#2d2d2d',
    color: 'white',
    padding: 0,
    borderRadius: '8px',
  },
  table: {
    backgroundColor: '#2d2d2d',
    color: 'white',
    padding: 0,
  },
  content: {
    backgroundColor: '#2d2d2d',
    color: 'white',
    padding: 0,
  },
};

export const ThemeProvider = ({ children }) => {
  // 存储深色/浅色模式状态
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('isDarkMode') === 'true',
  );

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  useEffect(() => {
    localStorage.setItem('isDarkMode', isDarkMode);
  }, [isDarkMode]);

  const value = {
    isDarkMode,
    toggleDarkMode,
    appStyles: isDarkMode ? darkThemeStyles : {},
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within an ThemeProvider');
  }
  return context;
};

