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

    const isHabitDueToday = (habit: Habit): boolean => {
        const now = new Date();
        const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
        const currentDate = now.getDate();

        if (habit.frequency === 'daily') {
            return true;
        }
        if (habit.frequency === 'weekly') {
            return habit.daysOfWeek?.includes(today) || false;
        }
        if (habit.frequency === 'monthly') {
            return habit.daysOfMonth?.includes(currentDate) || false;
        }
        return false;
    };

    // NEW: Helper function to check if habit was completed today
const isHabitCompletedToday = (habit: Habit): boolean => {
    if (!habit.completionHistory || habit.completionHistory.length === 0) {
        return false;
    }
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Check if today's date exists in completion history
    const isCompletedToday = habit.completionHistory.some(completionDate => {
        const completionDateStr = new Date(completionDate).toISOString().split('T')[0];
        return completionDateStr === todayStr;
    });
    
    return isCompletedToday;
};

    const isHabitCompletedTodayFromLogs = async (habitId: string, userId: string): Promise<boolean> => {
    try {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const response = await database.listDocuments(
            DB_ID!,
            process.env.EXPO_PUBLIC_HABIT_LOG_COLLECTION_ID!,
            [
                Query.equal("userId", userId),
                Query.equal("habitId", habitId),
                Query.equal("date", todayStr), // Check for today's date
                Query.equal("isCompleted", true)
            ]
        );
        
        return response.documents.length > 0;
    } catch (error) {
        console.error('Error checking habit completion from logs:', error);
        return false;
    }
};

    // NEW: Helper function to reset daily completion status
const resetDailyCompletionStatus = (fetchedHabits: Habit[]): Habit[] => {
    return fetchedHabits.map(habit => {
        const isDueToday = isHabitDueToday(habit);
        const isCompletedToday = isHabitCompletedToday(habit);
        
        
        // console.log(`Habit: ${habit.title}`);
        // console.log(`Due today: ${isDueToday}`);
        // console.log(`Completed today: ${isCompletedToday}`);
        // console.log(`Completion history:`, habit.completionHistory);
        
        return {
            ...habit,
            isCompletedToday: isDueToday && isCompletedToday
        };
    });
}

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
            const rawHabits = response.documents as unknown as Habit[];
            const processedHabits = resetDailyCompletionStatus(rawHabits); // ✅ reset logic here

            setHabits(processedHabits);
        } catch (error) {
            console.error('Error fetching habits:', error);
            setHabits([]);
        } finally {
            setLoading(false);
        }
    };

    // const fetchStreaks = async () => {
    //         if (!user) return { currentStreak: 0, longestStreak: 0 };

    //         try {
    //             const response = await database.listDocuments(
    //                 DB_ID!,
    //                 process.env.EXPO_PUBLIC_USER_STREAK_COLLECTION_ID!,
    //                 [Query.equal("userId", user.$id)]
    //             );

    //             const streakDoc = response.documents[0];
    //             if (!streakDoc) {
    //                 // CHANGED: Create initial streak document if it doesn't exist
    //                 try {
    //                     const newStreakDoc = await database.createDocument(
    //                         DB_ID!,
    //                         process.env.EXPO_PUBLIC_USER_STREAK_COLLECTION_ID!,
    //                         'unique()',
    //                         {
    //                             userId: user.$id,
    //                             currentStreak: 0,
    //                             longestStreak: 0,
    //                             lastStreakDate: '',
    //                             totalHabitsCompleted: 0
    //                         }
    //                     );
    //                     return {
    //                         currentStreak: 0,
    //                         longestStreak: 0,
    //                         lastStreakDate: ''
    //                     };
    //                 } catch (createError) {
    //                     console.error('Error creating streak document:', createError);
    //                     return { currentStreak: 0, longestStreak: 0 };
    //                 }
    //             }

    //             return {
    //                 currentStreak: streakDoc.currentStreak || 0,
    //                 longestStreak: streakDoc.longestStreak || 0,
    //                 lastStreakDate: streakDoc.lastStreakDate || ''
    //             };

    //         } catch (error) {
    //             console.error('Error fetching user streak:', error);
    //             return { currentStreak: 0, longestStreak: 0 };
    //         }
    //     };


    const fetchStreaks = async () => {
        if (!user) return { currentStreak: 0, longestStreak: 0 };

        try {
            const response = await database.listDocuments(
                DB_ID!,
                process.env.EXPO_PUBLIC_USER_STREAK_COLLECTION_ID!,
                [Query.equal("userId", user.$id)]
            );

            let streakDoc = response.documents[0];

            if (!streakDoc) {
                // Create initial streak doc if missing
                streakDoc = await database.createDocument(
                    DB_ID!,
                    process.env.EXPO_PUBLIC_USER_STREAK_COLLECTION_ID!,
                    "unique()",
                    {
                        userId: user.$id,
                        currentStreak: 0,
                        longestStreak: 0,
                        lastStreakDate: "",
                        totalHabitsCompleted: 0,
                    }
                );
            }

            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            const todayStr = today.toISOString().split("T")[0];
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            // Update only once per day
            if (streakDoc.lastStreakDate === todayStr) {
                return {
                    currentStreak: streakDoc.currentStreak,
                    longestStreak: streakDoc.longestStreak,
                    lastStreakDate: streakDoc.lastStreakDate,
                };
            }

            // Fetch all habits
            const habitsRes = await database.listDocuments(
                DB_ID!,
                COLLECTION_ID!,
                [Query.equal("userId", user.$id)]
            );

            const rawHabits = habitsRes.documents as unknown as Habit[];

            // Filter habits due yesterday
            const habitsDueYesterday = rawHabits.filter((habit) => {
                const habitDate = new Date(yesterdayStr);
                const weekday = new Intl.DateTimeFormat("en-US", {
                    weekday: "long",
                }).format(habitDate);
                const day = habitDate.getDate();

                if (habit.frequency === "daily") return true;
                if (habit.frequency === "weekly")
                    return habit.daysOfWeek?.includes(weekday);
                if (habit.frequency === "monthly")
                    return habit.daysOfMonth?.includes(day);
                return false;
            });

            // Count completed habits from due habits
            let completedCount = 0;
            const allCompletedYesterday = habitsDueYesterday.every((habit) => {
                const isCompleted = habit.completionHistory?.some((d) =>
                    d.startsWith(yesterdayStr)
                );
                if (isCompleted) completedCount += 1;
                return isCompleted;
            });

            if (allCompletedYesterday && habitsDueYesterday.length > 0) {
                let current = 1;

                if (streakDoc.lastStreakDate === yesterdayStr) {
                    current = (streakDoc.currentStreak || 0) + 1;
                }

                const updatedStreak = {
                    currentStreak: current,
                    longestStreak: Math.max(streakDoc.longestStreak || 0, current),
                    lastStreakDate: todayStr,
                    totalHabitsCompleted:
                        (streakDoc.totalHabitsCompleted || 0) + completedCount,
                };

                await database.updateDocument(
                    DB_ID!,
                    process.env.EXPO_PUBLIC_USER_STREAK_COLLECTION_ID!,
                    streakDoc.$id,
                    updatedStreak
                );

                return {
                    currentStreak: updatedStreak.currentStreak,
                    longestStreak: updatedStreak.longestStreak,
                    lastStreakDate: updatedStreak.lastStreakDate,
                };
            }

            return {
                currentStreak: streakDoc.currentStreak,
                longestStreak: streakDoc.longestStreak,
                lastStreakDate: streakDoc.lastStreakDate,
            };
        } catch (error) {
            console.error("Error fetching user streak:", error);
            return { currentStreak: 0, longestStreak: 0 };
        }
    };


    const markHabitComplete = async (habitId: string) => {
        try {
            const habit = habits.find(h => h.$id === habitId);
            if (!habit || !user) return;

            const now = new Date();
            const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

            if (habit.isCompletedToday) {
                console.log('Habit already completed today');
                return;
            }


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

            let newStreak = 1;
            if (habit.lastCompleted) {
                const lastCompleted = new Date(habit.lastCompleted);
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);

                // If last completed was yesterday, increment streak
                if (lastCompleted.toDateString() === yesterday.toDateString()) {
                    newStreak = habit.streak + 1;
                }
            }

            // 2. UPDATE HABIT STATS
            const updatedHabitData = {
                isCompletedToday: true,
                lastCompleted: now.toISOString(),
                streak: newStreak,
                longestStreak: Math.max(habit.longestStreak, newStreak),
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
            const dueHabits = updatedHabits.filter(h => isHabitDueToday(h));
            const allCompleted = dueHabits.every(h => h.isCompletedToday);

            if (allCompleted && dueHabits.length > 0) {
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

            let streakDoc = response.documents[0];

            // CHANGED: Create streak document if it doesn't exist
            if (!streakDoc) {
                streakDoc = await database.createDocument(
                    DB_ID!,
                    process.env.EXPO_PUBLIC_USER_STREAK_COLLECTION_ID!,
                    'unique()',
                    {
                        userId: user?.$id,
                        currentStreak: 0,
                        longestStreak: 0,
                        lastStreakDate: '',
                        totalHabitsCompleted: 0
                    }
                );
            }

            const lastDate = streakDoc.lastStreakDate;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            let current = streakDoc.currentStreak || 0;

            // CHANGED: Improved streak calculation logic
            if (!lastDate) {
                // First time completing all habits
                current = 1;
            } else if (lastDate === yesterdayStr) {
                // Consecutive day - increment streak
                current += 1;
            } else if (lastDate === todayStr) {
                // Already completed today - don't change streak
                // console.log('Global streak already updated today');
                return {
                    currentStreak: current,
                    longestStreak: streakDoc.longestStreak || 0
                };
            } else {
                // Gap in completion - reset streak
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

        const dueToday = habits.filter(h => isHabitDueToday(h));
        const completedToday = dueToday.filter(h => h.isCompletedToday).length;
        return { completed: completedToday, total: dueToday.length };
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

