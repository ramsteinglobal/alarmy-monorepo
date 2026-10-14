import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type ThemeColors, type ThemeMode } from '../theme';

const THEME_MODE_KEY = '@wakely_theme_mode';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  setMode: () => {},
  colors: lightColors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemDark, setSystemDark] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_MODE_KEY)
      .then(saved => {
        if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
      })
      .catch(error => console.error('Failed to load theme mode:', error));
  }, []);

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemDark(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(THEME_MODE_KEY, next).catch(error =>
      console.error('Failed to save theme mode:', error),
    );
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const isDark = mode === 'system' ? systemDark : mode === 'dark';
    return { mode, setMode, colors: isDark ? darkColors : lightColors, isDark };
  }, [mode, setMode, systemDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Current palette — use in every themed component instead of COLORS. */
export const useThemeColors = (): ThemeColors => useContext(ThemeContext).colors;
