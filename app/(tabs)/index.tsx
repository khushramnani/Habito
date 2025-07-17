import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
// import { LinearGradient } from 'expo-linear-gradient';
import { Link } from "expo-router";
import { useEffect, useState } from 'react';
import { AppState, Dimensions, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHabits } from '../../contexts/habitContext';
import { useTheme } from '../../contexts/themeContext';
import { useUserProfile } from '../../contexts/userProfileContext';
import CalendarRow from '../Components/HomeTab/CalendarRow';
import DailyCards from '../Components/HomeTab/DailyCards';
import { useAuth } from '../context/authContext';

export default function Index() {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { height: screenHeight } = Dimensions.get('window');
    const [globalStreak, setGlobalStreak] = useState({ currentStreak: 0, longestStreak: 0 });
    const {
        habits,
        loading,
        refreshing,
        markHabitComplete,
        onRefresh,
        fetchHabits,
        getTodayStats,
        fetchStreaks
    } = useHabits();

   const {userProfile} = useUserProfile();

    const refreshStreaks = async () => {
        if (user) {
            try {
                const streaks = await fetchStreaks();
                // console.log('Fetched streaks:', streaks); 
                if (streaks) {
                    setGlobalStreak(streaks);
                }
            } catch (error) {
                console.error('Error refreshing streaks:', error);
                // CHANGED: Set default values on error
                setGlobalStreak({ currentStreak: 0, longestStreak: 0 });
            }
        }
    };

    useEffect(() => {
        refreshStreaks();
    }, [user]);


    useEffect(() => {

        const timer = setTimeout(() => {
            refreshStreaks();
        }, 500);

        return () => clearTimeout(timer);
    }, [habits]);


    useEffect(() => {
        if (!user) return;
        fetchHabits();


        let lastDate = new Date().toDateString();

        const handleAppStateChange = () => {
            if (user) {
                refreshStreaks();
            }
        };

        handleAppStateChange();

        const interval = setInterval(() => {
  const now = new Date().toDateString();
  if (now !== lastDate) {
    lastDate = now;
    fetchHabits();
  }
}, 60 * 1000000);

        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                const currentDate = new Date().toDateString();
                if (currentDate !== lastDate) {
                    // console.log('Date changed while app was in background, refetching...');
                    lastDate = currentDate;
                    fetchHabits();
                }
            }
        });

        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, [user]);

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
                <Link href="/auth" asChild>
                    <TouchableOpacity className="bg-orange-500 px-6 py-3 rounded-lg">
                        <Text className="text-white font-semibold">Get Started</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        );
    }

    
    // const todayStats = getTodayStats();
    // console.log('Today stats:', todayStats); 

    return (
        <View
            className={`flex-1 ${isDark ? 'bg-gray-800' : 'bg-[#EEDEDE]'}`}
            style={{ paddingTop: insets.top + 15 }}
        >
            {/* bg-[#283342] */}
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={async () => {
                            await onRefresh();
                            await refreshStreaks(); // ADDED: Refresh streaks on pull-to-refresh
                        }}
                    />
                }
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
                            <Text className="text-gray-700 text-lg  dark:text-gray-300">
                                {userProfile?.name || 'User'}
                            </Text>
                            {/* ADDED: Debug info - remove this in production */}
                            {/* <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Today: {todayStats.completed}/{todayStats.total} habits
                            </Text> */}
                        </View>
                        <TouchableOpacity className="dark:bg-slate-700  rounded-full flex flex-row items-center justify-center gap-1 p-4 ">
                                <FontAwesome5 name="bolt" size={24} color="#D72638" />
                            <Text className="text-gray-800 dark:text-gray-300 font-bold text-xl">
                                
                                {globalStreak.currentStreak}
                            </Text>
                            {/* ADDED: Show longest streak as well */}
                            {/* <Text className="text-white/80 text-xs text-center">
                                Best: {globalStreak.longestStreak}
                            </Text> */}
                        </TouchableOpacity>
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