import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Link } from "expo-router";
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useHabits } from '../../contexts/habitContext';
import CalendarRow from '../Components/HomeTab/CalendarRow';
import { useAuth } from '../context/authContext';

export default function Index() {
    const { user } = useAuth();
    const { 
        habits, 
        loading, 
        refreshing, 
        markHabitComplete, 
        onRefresh, 
        getTodayStats 
    } = useHabits();

    const categoryIcons = {
        health: 'heartbeat',
        productivity: 'rocket',
        learning: 'book',
        mindfulness: 'leaf',
        social: 'users',
        creative: 'paint-brush',
        other: 'star'
    };

    const categoryColors = {
        health: 'bg-red-500',
        productivity: 'bg-blue-500',
        learning: 'bg-green-500',
        mindfulness: 'bg-purple-500',
        social: 'bg-pink-500',
        creative: 'bg-yellow-500',
        other: 'bg-gray-500'
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (!user) {
        return (
            <View className="bg-gray-50 flex items-center justify-center h-full px-4">
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
        <View className="flex-1 bg-[#EEDEDE]">
            <ScrollView 
                className="flex-1"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header Section */}
                <View className=" px-4 py-6 mb-4">
                    <View className="flex-row items-center justify-between mb-4">
                        <View>
                            <Text className="text-2xl font-bold text-gray-900">
                                {getGreeting()}! 👋
                            </Text>
                            <Text className="text-gray-600">
                                {user.name || 'User'}
                            </Text>
                        </View>
                        <TouchableOpacity className="bg-orange-500 p-3 rounded-full">
                            <FontAwesome5 name="bell" size={20} color="white" />
                        </TouchableOpacity>
                    </View>


                </View>

                {/* Calendar Section */}
                <View className=" mb-4">
                    <CalendarRow />
                </View>

               

                {/* Bottom spacing */}
                <View className="h-32" />
            </ScrollView>
        </View>
    );
}
