import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View, useColorScheme } from "react-native";
import { Query } from 'react-native-appwrite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHabits } from '../../contexts/habitContext';
import { database } from '../../lib/appwrite';
import { useAuth } from "../context/authContext";

interface AnalyticsData {
    totalHabitsCompleted: number;
    currentStreak: number;
    longestStreak: number;
    weeklyCompletion: number;
    monthlyCompletion: number;
    mostProductiveDay: string;
    categoryStats: Array<{ category: string; count: number; percentage: number }>;
    last7DaysData: Array<{ date: string; completed: number; total: number }>;
    personalizedMessage: string;
    completionRate: number;
    averageCompletionTime: string;
    motivationLevel: 'champion' | 'consistent' | 'building' | 'starter';
}

export default function AnalyticsScreen() {
    const { getTodayStats, habits, fetchStreaks } = useHabits();
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const username = user?.name || user?.email?.split('@')[0] || 'User';
    const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
    const HABIT_LOG_COLLECTION_ID = process.env.EXPO_PUBLIC_HABIT_LOG_COLLECTION_ID;

    const insets = useSafeAreaInsets();

    const fetchAnalyticsData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Get streak data
            const streakData = await fetchStreaks();

            // Fetch all habit logs for the user
            const logsResponse = await database.listDocuments(
                DB_ID!,
                HABIT_LOG_COLLECTION_ID!,
                [
                    Query.equal("userId", user.$id),
                    Query.equal("isCompleted", true),
                    Query.orderDesc("date"),
                    Query.limit(1000)
                ]
            );

            const logs = logsResponse.documents;

            // Calculate analytics
            const totalHabitsCompleted = logs.length;
            
            // Calculate weekly completion rate
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const weeklyLogs = logs.filter(log => new Date(log.date) >= oneWeekAgo);
            
            // Calculate monthly completion rate
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
            const monthlyLogs = logs.filter(log => new Date(log.date) >= oneMonthAgo);

            // Calculate category statistics
            const categoryMap = new Map<string, number>();
            logs.forEach(log => {
                const category = log.category || 'Other';
                categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
            });

            const categoryStats = Array.from(categoryMap.entries())
                .map(([category, count]) => ({
                    category,
                    count,
                    percentage: (count / totalHabitsCompleted) * 100
                }))
                .sort((a, b) => b.count - a.count);

            // Find most productive day
            const dayMap = new Map<string, number>();
            logs.forEach(log => {
                const day = new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' });
                dayMap.set(day, (dayMap.get(day) || 0) + 1);
            });
            const mostProductiveDay = Array.from(dayMap.entries())
                .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Monday';

            // Calculate last 7 days data
            const last7DaysData = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                const dayLogs = logs.filter(log => 
                    log.date.startsWith(dateStr)
                );
                
                const dueThatDay = habits.filter(habit => {
                    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const dayOfMonth = date.getDate();
                    
                    if (habit.frequency === 'daily') return true;
                    if (habit.frequency === 'weekly') return habit.daysOfWeek?.includes(weekday);
                    if (habit.frequency === 'monthly') return habit.daysOfMonth?.includes(dayOfMonth);
                    return false;
                }).length;

                last7DaysData.push({
                    date: dateStr,
                    completed: dayLogs.length,
                    total: dueThatDay
                });
            }

            // Calculate overall completion rate
            const totalDue = last7DaysData.reduce((sum, day) => sum + day.total, 0);
            const totalCompleted = last7DaysData.reduce((sum, day) => sum + day.completed, 0);
            const completionRate = totalDue > 0 ? (totalCompleted / totalDue) * 100 : 0;

            // Calculate average completion time
            const completionTimes = logs
                .filter(log => log.completedAt)
                .map(log => new Date(log.completedAt).getHours());
            
            const avgHour = completionTimes.length > 0 
                ? completionTimes.reduce((sum, hour) => sum + hour, 0) / completionTimes.length
                : 12;
            
            const averageCompletionTime = `${Math.round(avgHour)}:00`;

            // Determine motivation level
            let motivationLevel: 'champion' | 'consistent' | 'building' | 'starter' = 'starter';
            if (streakData.currentStreak >= 21 && completionRate >= 85) {
                motivationLevel = 'champion';
            } else if (streakData.currentStreak >= 7 && completionRate >= 70) {
                motivationLevel = 'consistent';
            } else if (streakData.currentStreak >= 3 || completionRate >= 50) {
                motivationLevel = 'building';
            }

            // Generate personalized message
            const personalizedMessage = generatePersonalizedMessage(
                streakData.currentStreak,
                completionRate,
                totalHabitsCompleted,
                mostProductiveDay,
                motivationLevel
            );

            setAnalytics({
                totalHabitsCompleted,
                currentStreak: streakData.currentStreak,
                longestStreak: streakData.longestStreak,
                weeklyCompletion: weeklyLogs.length,
                monthlyCompletion: monthlyLogs.length,
                mostProductiveDay,
                categoryStats,
                last7DaysData,
                personalizedMessage,
                completionRate,
                averageCompletionTime,
                motivationLevel
            });

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const generatePersonalizedMessage = (
        streak: number, 
        completionRate: number, 
        totalCompleted: number,
        mostProductiveDay: string,
        motivationLevel: 'champion' | 'consistent' | 'building' | 'starter'
    ): string => {
        const messages = {
            champion: [
                `🏆 You're absolutely crushing it! ${streak} days strong with ${completionRate.toFixed(1)}% completion rate. You're in the top 1% of habit builders!`,
                `🌟 Legendary status achieved! Your ${streak}-day streak and ${totalCompleted} completed habits prove you're a true champion of consistency.`,
                `🚀 Unstoppable force! You've mastered the art of habit building with ${completionRate.toFixed(1)}% completion rate. Keep inspiring others!`
            ],
            consistent: [
                `💪 You're building an incredible foundation! ${streak} days and counting - consistency is your superpower.`,
                `⚡ Momentum master! Your ${completionRate.toFixed(1)}% completion rate shows you're locked in. The results will compound!`,
                `🎯 You're in the zone! ${streak} days of consistency and ${totalCompleted} habits completed. Success is becoming your habit.`
            ],
            building: [
                `🌱 Beautiful progress! You're building something amazing with ${totalCompleted} habits completed. Every day counts!`,
                `🔥 The spark is igniting! Your ${streak >= 3 ? `${streak}-day streak` : `${completionRate.toFixed(1)}% completion rate`} shows you're gaining momentum.`,
                `🎪 You're in the building phase! ${mostProductiveDay}s are your power days. Keep stacking those wins!`
            ],
            starter: [
                `🌟 Every expert was once a beginner! You've completed ${totalCompleted} habits - that's ${totalCompleted} victories to celebrate!`,
                `🚀 Your journey starts with a single step, and you're already walking! Each habit completed is proof of your potential.`,
                `💎 Small consistent actions create extraordinary results. You're ${totalCompleted} habits closer to your best self!`
            ]
        };

        const messageArray = messages[motivationLevel];
        return messageArray[Math.floor(Math.random() * messageArray.length)];
    };



    const getMotivationIcon = (level: string) => {
        const icons = {
            champion: 'crown',
            consistent: 'fire',
            building: 'rocket',
            starter: 'seedling'
        };
        return icons[level as keyof typeof icons] || 'star';
    };

    const motivationText = (motivationLevel: string) => {
        const texts = {
            champion: `Your streak is longer than Netflix intros, ${username} 📺🔥`,
            consistent: `Your streak is longer than my situationship, ${username} 😭💪`,
            building: `You're lowkey leveling up and it’s kinda hot ngl 😩💯 #Go${username}`,
            starter: `Just touched grass and opened the app? We love that for you, ${username} 🌱`
        };
        return texts[motivationLevel as keyof typeof texts] || "You're doing great!";
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAnalyticsData();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchAnalyticsData();
    }, [user, habits]);

    if (loading) {
        return (
            <View className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <View className="items-center">
                    <View className={`w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4`} />
                    <Text className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Analyzing your journey...
                    </Text>
                </View>
            </View>
        );
    }

    const todayStats = getTodayStats();

    return (
        <ScrollView 
            className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-[#EEDEDE]'}`}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingTop: insets.top + 15, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
        >
            <View className="p-6 flex gap-6">
                {/* Minimal Header */}
                <View className="">
                    <Text className={`text-4xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Analytics
                    </Text>
                    <Text className={`text-base font-light mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Your progress story
                    </Text>
                </View>

                {/* Hero Motivation Card */}
                {analytics && (
                    <View className={`rounded-3xl  px-2 py-6 border border-gray-800/20 dark:border-white/20`}>
                        <View className="flex-row items-start">
                            <View className="bg-white/20 rounded-full p-3 mr-4">
                                <FontAwesome5 name={getMotivationIcon(analytics.motivationLevel)} size={20} color={isDark ? 'white' : 'black'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-700 dark:text-gray-300 text-lg font-semibold mb-2 capitalize">
                                    {motivationText(analytics.motivationLevel)} 
                                </Text>
                                {/* <Text className="text-gray-700 dark:text-gray-300 text-base leading-6 font-light">
                                    {analytics.personalizedMessage}
                                </Text> */}
                            </View>
                        </View>
                    </View>
                )}

                {/* Today's Focus */}
                <View className={`rounded-3xl p-6 ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-orange-300/80 border border-gray-800/50'} backdrop-blur-sm`}>
                    <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Today's Focus
                    </Text>
                    <View className="flex-row items-center">
                        <View className="flex-1">
                            <View className="flex-row items-baseline">
                                <Text className={`text-4xl font-light ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {todayStats.completed}
                                </Text>
                                <Text className={`text-xl font-light ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    /{todayStats.total}
                                </Text>
                            </View>
                            <Text className={`text-sm font-light mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {todayStats.total > 0 ? `${Math.round((todayStats.completed / todayStats.total) * 100)}% completed` : 'No habits today'}
                            </Text>
                        </View>
                        <View className={`w-16 h-16 rounded-full border-4 ${
                            todayStats.total > 0 ? 'border-orange-400 dark:border-blue-500' : 'border-gray-400'
                        } items-center justify-center`}>
                            <Text className={`text-xs font-semibold ${
                                todayStats.total > 0 ? 'text-gray-700 dark:text-blue-500' : 'text-gray-400'
                            }`}>
                                {todayStats.total > 0 ? `${Math.round((todayStats.completed / todayStats.total) * 100)}%` : '0%'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* {analytics && (
                    <View className={`rounded-3xl px-2 py-6 border border-white/20`}>
                        <View className="flex-row items-center">
                            <View className="bg-white/20 rounded-full p-3 mr-4">
                                <FontAwesome5 name={getMotivationIcon(analytics.motivationLevel)} size={20} color={isDark ? 'white' : 'black'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-700 dark:text-gray-300 text-lg font-semibold mb-2 capitalize">
                                    {motivationText(analytics.motivationLevel)} 
                                </Text>
                                <Text className="text-gray-700 p-2 dark:text-gray-300 text-base leading-6 font-light">
                                    {analytics.personalizedMessage}
                                </Text>
                            </View>
                        </View>
                    </View>
                )} */}

                {/* Key Metrics */}
                {analytics && (
                    <View className="flex flex-wrap gap-2">
                        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Key Metrics
                        </Text>
                        
                        <View className="flex-row gap-2 space-x-4">
                            <View className={`flex-1 rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-[#E5DDD0] border border-gray-800/50'}`}>
                                <FontAwesome5 name="bolt" size={16} color="#D72638" />
                                <Text className={`text-2xl font-light mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {analytics.currentStreak}
                                </Text>
                                <Text className={`text-sm font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    day streak
                                </Text>
                            </View>

                            <View className={`flex-1 rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-[#E5DDD0] border border-gray-800/50'}`}>
                                <FontAwesome5 name="percentage" size={16} color="#3B82F6" />
                                <Text className={`text-2xl font-light mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {analytics.completionRate.toFixed(0)}%
                                </Text>
                                <Text className={`text-sm font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    completion rate
                                </Text>
                            </View>
                        </View>

                        <View className="flex-row gap-2 space-x-4">
                            <View className={`flex-1 rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-[#E5DDD0] border border-gray-800/50'}`}>
                                <FontAwesome5 name="check-circle" size={16} color="#10B981" />
                                <Text className={`text-2xl font-light mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {analytics.totalHabitsCompleted}
                                </Text>
                                <Text className={`text-sm font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    total completed
                                </Text>
                            </View>

                            <View className={`flex-1 rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-[#E5DDD0] border border-gray-800/50'}`}>
                                <FontAwesome5 name="calendar-day" size={16} color="#8B5CF6" />
                                <Text className={`text-xl font-light mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {analytics.mostProductiveDay.slice(0, 3)}
                                </Text>
                                <Text className={`text-sm font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    best day
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* 7-Day Rhythm */}
                {analytics && (
                    <View className={`rounded-3xl p-6 ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-amber-500/20 border border-gray-800/50'}`}>
                        <Text className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            7-Day Rhythm
                        </Text>
                        
                        <View className="flex-row justify-between items-end h-30">
                            {analytics.last7DaysData.map((day, index) => {
                                const maxTotal = Math.max(...analytics.last7DaysData.map(d => d.total));
                                const height = day.total > 0 ? Math.max((day.completed / maxTotal) * 100, 12) : 12;
                                const completionPercentage = day.total > 0 ? (day.completed / day.total) * 100 : 0;
                                
                                return (
                                    <View key={index} className="items-center flex-1">
                                        <View 
                                            className={`w-8 rounded-full ${
                                                completionPercentage >= 100 ? 'bg-emerald-500' : 
                                                completionPercentage >= 75 ? 'bg-blue-500' :
                                                completionPercentage >= 50 ? 'bg-amber-500' : 
                                                completionPercentage > 0 ? 'bg-orange-500' : 
                                                isDark ? 'bg-gray-700' : 'bg-gray-200'
                                            }`}
                                            style={{ height }}
                                        />
                                        <Text className={`text-xs mt-3 font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Achievement Banner */}
                {analytics && analytics.longestStreak > 0 && (
                    <View className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-3xl p-6">
                        <View className="flex-row items-center">
                            <FontAwesome5 name="trophy" size={20} color="white" />
                            <Text className="text-white text-lg font-semibold ml-3">
                                Personal Record
                            </Text>
                        </View>
                        <Text className="text-white/95 text-base mt-2 font-light">
                            {analytics.longestStreak} days is your longest streak.
                            {analytics.currentStreak === analytics.longestStreak 
                                ? " You're at your peak right now!" 
                                : ` You're ${analytics.longestStreak - analytics.currentStreak} days away from beating it!`
                            }
                        </Text>
                    </View>
                )}

                {/* Categories */}
                {analytics && analytics.categoryStats.length > 0 && (
                    <View className={`rounded-3xl p-6 ${isDark ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-slate-200/95 border border-gray-800/50'}`}>
                        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Focus Areas
                        </Text>
                        <View className="space-y-3">
                            {analytics.categoryStats.slice(0, 3).map((category, index) => (
                                <View key={category.category} className="flex-row items-center">
                                    <View className={`w-3 h-3 rounded-full mr-4 ${
                                        index === 0 ? 'bg-blue-500' : 
                                        index === 1 ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`} />
                                    <Text className={`flex-1 font-light ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                        {category.category}
                                    </Text>
                                    <Text className={`font-light ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {category.count}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}