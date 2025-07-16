import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Query } from 'react-native-appwrite';
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
    fetchStreaks: () => Promise<any>;
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
                Query.equal("userId", user?.$id!)
            ]);
            setHabits(response.documents as unknown as Habit[]);
        } catch (error) {
            console.error('Error fetching habits:', error);
            setHabits([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStreaks = async () => {
        if (!user) return;
        try {
            const response = await database.listDocuments(
                DB_ID!,
                process.env.EXPO_PUBLIC_USER_STREAK_COLLECTION_ID!,
                [Query.equal("userId", user.$id)]
            );
            const streakDoc = response.documents[0];
            if (!streakDoc) {
                return {
                    currentStreak: 0,
                    longestStreak: 0,
                };
            }
            return  {
                currentStreak: streakDoc.currentStreak || 0,
                longestStreak: streakDoc.longestStreak || 0,
                lastStreakDate: streakDoc.lastStreakDate || ''
            }

        } catch (error) {
            console.error('Error fetching user streak:', error);
            return null;
        }
    };

const markHabitComplete = async (habitId: string) => {
  try {
    const habit = habits.find(h => h.$id === habitId);
    if (!habit || !user) return;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    // 1. CREATE LOG IN habit-logs
    await database.createDocument(
      DB_ID!,
      process.env.EXPO_PUBLIC_HABIT_LOG_COLLECTION_ID!,
      "unique()",
      {
        userId: user.$id,
        habitId,
        date: new Date(todayStr), // store as datetime
        isCompleted: true,
        completedAt: now,
        category: habit.category,
      },
    //   [`user:${user.$id}`],
        
    );

    // 2. UPDATE HABIT STATS
    const updatedHabitData = {
      isCompletedToday: true,
      lastCompleted: now.toISOString(),
      streak: habit.streak + 1,
      longestStreak: Math.max(habit.longestStreak, habit.streak + 1),
      completionHistory: [...habit.completionHistory, now.toISOString()],
    };

    await database.updateDocument(
      DB_ID!,
      COLLECTION_ID!,
      habitId,
      updatedHabitData
    );

    // 3. UPDATE LOCAL STATE
    const updatedHabits = habits.map(h =>
      h.$id === habitId ? { ...h, ...updatedHabitData } : h
    );
    setHabits(updatedHabits);

    // 4. CHECK IF ALL TODAY’S HABITS ARE COMPLETED
    const dueHabits = updatedHabits.filter(h => {
      if (h.frequency === "daily") return true;
      if (h.frequency === "weekly") {
        const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
        return h.daysOfWeek?.includes(today);
      }
      if (h.frequency === "monthly") {
        const date = now.getDate();
        return h.daysOfMonth?.includes(date);
      }
      return false;
    });

    const allCompleted = dueHabits.every(h => h.isCompletedToday);

    if (allCompleted) {
      await updateUserGlobalStreak(todayStr);
    }

  } catch (error) {
    console.error('Error in markHabitComplete:', error);
  }
};

const updateUserGlobalStreak = async (todayStr: string) => {
  try {
    const response = await database.listDocuments(
      DB_ID!,
      process.env.EXPO_PUBLIC_USER_STREAK_COLLECTION_ID!,
      [Query.equal("userId", user?.$id ?? "")]
    );

    const streakDoc = response.documents[0];

    if (!streakDoc) return null;

    const lastDate = streakDoc.lastStreakDate;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let current = streakDoc.currentStreak;
    if (lastDate === yesterdayStr) {
      current += 1;
    } else {
      current = 1;
    }

    const updatedStreak = {
        currentStreak: current,
        longestStreak: Math.max(streakDoc.longestStreak, current),
        lastStreakDate: todayStr,
        totalHabitsCompleted: (streakDoc.totalHabitsCompleted || 0) + 1
    };

    await database.updateDocument(
      DB_ID!,
      process.env.EXPO_PUBLIC_USER_STREAK_COLLECTION_ID!,
      streakDoc.$id,
      updatedStreak
    );

    return {
        currentStreak: current,
        longestStreak: Math.max(streakDoc.longestStreak, current)
    };
    
  } catch (error) {
    console.error("Error updating user streak:", error);
    return null;
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
        fetchStreaks
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

