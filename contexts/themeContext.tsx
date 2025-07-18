import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useUserProfile } from './userProfileContext';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
    isDark: boolean;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    systemTheme: 'light' | 'dark' | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const systemColorScheme = useColorScheme();
    const { colorScheme, setColorScheme } = useNativeWindColorScheme();
    const { userProfile, loading } = useUserProfile();
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');
    const [isDark, setIsDark] = useState<boolean>(systemColorScheme === 'dark');

    useEffect(() => {
        // console.log('ThemeProvider - userProfile changed:', userProfile);
        // console.log('ThemeProvider - loading:', loading);
        // console.log('ThemeProvider - systemColorScheme:', systemColorScheme);
        
        // Wait for userProfile to finish loading
        if (!loading) {
            // Get theme mode from user profile or default to 'system'
            const savedThemeMode = userProfile?.themeMode || 'system';
            // console.log('Setting theme mode to:', savedThemeMode);
            setThemeMode(savedThemeMode);
            
            // Calculate isDark based on theme mode
            calculateTheme(savedThemeMode, systemColorScheme);
        }
    }, [userProfile?.themeMode, systemColorScheme, loading]);

    // Recalculate theme when system theme changes (only if using system mode)
    useEffect(() => {
        if (themeMode === 'system') {
            // console.log('System theme changed, updating to:', systemColorScheme === 'dark');
            const newIsDark = systemColorScheme === 'dark';
            setIsDark(newIsDark);
            setColorScheme(newIsDark ? 'dark' : 'light');
        }
    }, [systemColorScheme, themeMode]);

    const calculateTheme = (mode: ThemeMode, systemTheme: typeof systemColorScheme) => {
        let newIsDark: boolean;
        
        switch (mode) {
            case 'light':
                newIsDark = false;
                break;
            case 'dark':
                newIsDark = true;
                break;
            case 'system':
            default:
                newIsDark = systemTheme === 'dark';
                break;
        }
        
        // console.log('calculateTheme - mode:', mode, 'systemTheme:', systemTheme, 'result:', newIsDark);
        setIsDark(newIsDark);
        // Update NativeWind's color scheme
        setColorScheme(newIsDark ? 'dark' : 'light');
    };

    const handleSetThemeMode = (mode: ThemeMode) => {
        // console.log('setThemeMode called with:', mode);
        setThemeMode(mode);
        calculateTheme(mode, systemColorScheme);
    };

    const value: ThemeContextType = {
        isDark,
        themeMode,
        setThemeMode: handleSetThemeMode,
        systemTheme: systemColorScheme as 'light' | 'dark' | null,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
