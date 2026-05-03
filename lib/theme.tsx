import React, { createContext, useContext, useEffect } from 'react';
import { useColorScheme as useNativewindScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Scheme = 'light' | 'dark';
const STORAGE_KEY = 'colorScheme';
const STORAGE_OVERRIDE_KEY = 'colorSchemeOverride';

const ThemeContext = createContext<{
  colorScheme: Scheme;
  toggleColorScheme: () => void;
}>({ colorScheme: 'light', toggleColorScheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme: nwScheme, setColorScheme } = useNativewindScheme();
  const colorScheme: Scheme = nwScheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    let active = true;
    AsyncStorage.multiGet([STORAGE_KEY, STORAGE_OVERRIDE_KEY])
      .then(([[, saved], [, override]]) => {
        if (!active) return;
        if (override === 'true' && (saved === 'light' || saved === 'dark')) {
          setColorScheme(saved);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [setColorScheme]);

  const toggleColorScheme = () => {
    const next: Scheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(next);
    AsyncStorage.multiSet([
      [STORAGE_KEY, next],
      [STORAGE_OVERRIDE_KEY, 'true'],
    ]).catch(() => {});
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
