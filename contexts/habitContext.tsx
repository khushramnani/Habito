import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from '../app/context/authContext';
import { database } from '../lib/appwrite';

interface Habit {
    $id: string;
    userId: string;
    title: string;
    description?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: string[];     // for weekly habits like ["Monday", "Friday"]
    daysOfMonth?: number[];    // for monthly habits like [1, 15, 30]
    createdAt: string;
    streak: number;
    lastCompleted: string;
    isCompletedToday: boolean;
    longestStreak: number;
    completionHistory: string[]; 
    category: string;
}

interface HabitContextType {
    habits: Habit[];
    loading: boolean;
    refreshing: boolean;
    fetchHabits: () => Promise<void>;
    markHabitComplete: (habitId: string) => Promise<void>;
    addHabit: (habitData: {
        title: string;
        description?: string;
        frequency: 'daily' | 'weekly' | 'monthly';
        category: string;
        daysOfWeek?: string[];
        daysOfMonth?: number[];
    }) => Promise<Habit>;
    updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
    deleteHabit: (habitId: string) => Promise<void>;
    onRefresh: () => Promise<void>;
    getTodayStats: () => { completed: number; total: number };
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

interface HabitProviderProps {
    children: ReactNode;
}

export function HabitProvider({ children }: HabitProviderProps) {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
    const COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COLLECTION_ID;

    const fetchHabits = async () => {
        if (!user) {
            setHabits([]);
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            const response = await database.listDocuments(DB_ID!, COLLECTION_ID!, [
                // Add query to filter by userId if needed
            ]);
            setHabits(response.documents as unknown as Habit[]);
        } catch (error) {
            console.error('Error fetching habits:', error);
            setHabits([]);
        } finally {
            setLoading(false);
        }
    };

    const markHabitComplete = async (habitId: string) => {
        try {
            const habit = habits.find(h => h.$id === habitId);
            
            if (!habit) return;

            const updatedHabit = {
                ...habit,
                isCompletedToday: true,
                lastCompleted: new Date().toISOString(),
                streak: habit.streak + 1,
                longestStreak: Math.max(habit.longestStreak, habit.streak + 1),
                completionHistory: [...habit.completionHistory, new Date().toISOString()]
            };

            await database.updateDocument(DB_ID!, COLLECTION_ID!, habitId, updatedHabit);
            
            // Update local state
            setHabits(habits.map(h => h.$id === habitId ? updatedHabit : h));
        } catch (error) {
            console.error('Error marking habit complete:', error);
        }
    };

    const addHabit = async (habitData: {
        title: string;
        description?: string;
        frequency: 'daily' | 'weekly' | 'monthly';
        category: string;
        daysOfWeek?: string[];
        daysOfMonth?: number[];
    }) => {
        try {
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Validate input data
            if (!habitData.title.trim()) {
                throw new Error('Habit title is required');
            }

            if (!habitData.category) {
                throw new Error('Habit category is required');
            }

            // Validate weekly habits
            if (habitData.frequency === 'weekly' && (!habitData.daysOfWeek || habitData.daysOfWeek.length === 0)) {
                throw new Error('Please select at least one day for weekly habits');
            }

            // Validate monthly habits
            if (habitData.frequency === 'monthly' && (!habitData.daysOfMonth || habitData.daysOfMonth.length === 0)) {
                throw new Error('Please select at least one day for monthly habits');
            }

            // Create the complete habit object with default values
            const newHabit = {
                userId: user.$id,
                title: habitData.title.trim(),
                description: habitData.description?.trim() || '',
                frequency: habitData.frequency,
                category: habitData.category,
                daysOfWeek: habitData.frequency === 'weekly' ? (habitData.daysOfWeek || []) : undefined,
                daysOfMonth: habitData.frequency === 'monthly' ? (habitData.daysOfMonth || []) : undefined,
                createdAt: new Date().toISOString(),
                streak: 0,
                lastCompleted: '',
                isCompletedToday: false,
                longestStreak: 0,
                completionHistory: []
            };

            const response = await database.createDocument(
                DB_ID!,
                COLLECTION_ID!,
                'unique()',
                newHabit
            );
            
            const createdHabit = response as unknown as Habit;
            setHabits(prev => [...prev, createdHabit]);
            
            return createdHabit;
        } catch (error) {
            console.error('Error adding habit:', error);
            throw error;
        }
    };

    const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
        try {
            const updatedHabit = await database.updateDocument(
                DB_ID!,
                COLLECTION_ID!,
                habitId,
                updates
            );
            
            setHabits(habits.map(h => h.$id === habitId ? updatedHabit as unknown as Habit : h));
        } catch (error) {
            console.error('Error updating habit:', error);
            throw error;
        }
    };

    const deleteHabit = async (habitId: string) => {
        try {
            await database.deleteDocument(DB_ID!, COLLECTION_ID!, habitId);
            setHabits(habits.filter(h => h.$id !== habitId));
        } catch (error) {
            console.error('Error deleting habit:', error);
            throw error;
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchHabits();
        setRefreshing(false);
    };

    const getTodayStats = () => {
        const completedToday = habits.filter(h => h.isCompletedToday).length;
        const totalHabits = habits.length;
        return { completed: completedToday, total: totalHabits };
    };

    useEffect(() => {
        fetchHabits();
    }, [user]);

    const value: HabitContextType = {
        habits,
        loading,
        refreshing,
        fetchHabits,
        markHabitComplete,
        addHabit,
        updateHabit,
        deleteHabit,
        onRefresh,
        getTodayStats,
    };

    return (
        <HabitContext.Provider value={value}>
            {children}
        </HabitContext.Provider>
    );
}

export function useHabits() {
    const context = useContext(HabitContext);
    if (context === undefined) {
        throw new Error('useHabits must be used within a HabitProvider');
    }
    return context;
}

export type { Habit };

