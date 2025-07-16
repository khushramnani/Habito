import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Link } from "expo-router";
import { useEffect, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHabits } from '../../contexts/habitContext';
import CalendarRow from '../Components/HomeTab/CalendarRow';
import DailyCards from '../Components/HomeTab/DailyCards';
import { useAuth } from '../context/authContext';

export default function Index() {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = Dimensions.get('window');
    const [globalStreak, setGlobalStreak] = useState({ currentStreak: 0, longestStreak: 0 });
    const { 
        habits, 
        loading, 
        refreshing, 
        markHabitComplete, 
        onRefresh, 
        getTodayStats,
        fetchStreaks 
    } = useHabits();

    const refreshStreaks = async () => {
        if (user) {
            const streaks = await fetchStreaks();
            if (streaks) {
                setGlobalStreak(streaks);
            }
        }
    };

    useEffect(() => {
        refreshStreaks();
    }, [user]);

    // Refresh streaks when habits change (after completing a habit)
    useEffect(() => {
        refreshStreaks();
    }, [habits]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (!user) {
        return (
            <View 
                className="bg-gray-50 flex items-center justify-center px-4"
                style={{ 
                    flex: 1,
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                }}
            >
                <FontAwesome5 name="user-circle" size={64} color="#9CA3AF" />
                <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2">Welcome to HabitTracker</Text>
                <Text className="text-gray-600 text-center mb-6">Please log in to start tracking your habits</Text>
                <Link href="/Login" asChild>
                    <TouchableOpacity className="bg-orange-500 px-6 py-3 rounded-lg">
                        <Text className="text-white font-semibold">Get Started</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        );
    }

    return (
        <View 
            className="flex-1 bg-[#EEDEDE] dark:bg-[#283342]"
            style={{ paddingTop: insets.top + 15 }}
        >
            <ScrollView  
                className="flex-1"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ 
                    paddingBottom: Math.max(insets.bottom + 100, 120),
                    minHeight: screenHeight - insets.top - insets.bottom,
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View className="px-4 pt-4 pb-2">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-1">
                            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                                {getGreeting()}! 👋
                            </Text>
                            <Text className="text-gray-600 dark:text-gray-300">
                                {user.name || 'User'}
                            </Text>
                        </View>
                        <View className="bg-orange-500 px-4 py-2 rounded-full">
                            <Text className="text-white font-bold text-lg">
                                {globalStreak.currentStreak }
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Calendar Section */}
                <View className="mb-2">
                    <CalendarRow />
                </View>

                {/* Daily Habits Cards */}
                <View className="flex-1">
                    <DailyCards />
                </View>
            </ScrollView>
        </View>
    );
}
