import { FontAwesome5 } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHabits } from "../../contexts/habitContext";
import { useTheme } from "../../contexts/themeContext";
import categorydata from "../../data/category.json";
import { useAuth } from "../context/authContext";

const { width: screenWidth } = Dimensions.get('window');

// Helper function to get category data
const getCategoryData = (categoryId: string) => {
    return categorydata.find(cat => cat.id === categoryId) || {
        name: 'Other',
        icon: 'ellipsis-h',
        color: '#BCAAA4'
    };
};

interface HabitDetailModalProps {
    habit: any;
    visible: boolean;
    onClose: () => void;
    onDelete: (habitId: string) => void;
    isDark: boolean;
}

const HabitDetailModal = ({ habit, visible, onClose, onDelete, isDark }: HabitDetailModalProps) => {
    const categoryData = getCategoryData(habit?.category);
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatFrequency = (frequency: string, daysOfWeek?: string[], daysOfMonth?: number[]) => {
        switch (frequency) {
            case 'daily':
                return 'Every day';
            case 'weekly':
                return daysOfWeek ? `Every ${daysOfWeek.join(', ')}` : 'Weekly';
            case 'monthly':
                return daysOfMonth ? `Day ${daysOfMonth.join(', ')} of month` : 'Monthly';
            default:
                return frequency;
        }
    };

    const handleDeleteSwipe = () => {
        Alert.alert(
            "Delete Habit",
            `Are you sure you want to delete "${habit.title}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: () => {
                        onDelete(habit.$id);
                        onClose();
                    }
                }
            ]
        );
    };

    if (!habit) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-[#EEDEDE]'}`}>
                {/* Header */}
                <View className={`${isDark ? 'bg-gray-800/95' : 'bg-orange-300/80'} px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-800/50'}`}>
                    <View className="flex-row items-center justify-between">
                        {/* <View className="w-10" /> */}
                        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Habit Details
                        </Text>
                        <TouchableOpacity 
                            onPress={onClose} 
                            className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-[#E5DDD0]'}`}
                            activeOpacity={0.7}
                        >
                            <FontAwesome5 name="times" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        </TouchableOpacity>
                        
                    </View>
                </View>

                <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
                    {/* Habit Header */}
                    <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-orange-300 border-gray-800/50'} rounded-3xl p-6 mb-3 border shadow-sm`}>
                        <View className="flex-row items-start mb-4">
                            <View 
                                className="w-20 h-20 rounded-3xl items-center border border-gray-800/30 justify-center mr-5 shadow-md"
                                style={{ backgroundColor: categoryData.color }}
                            >
                                <FontAwesome5 
                                    name={categoryData.icon as any} 
                                    size={28} 
                                    color="#1F2937" 
                                />
                            </View>
                            <View className="flex-1">
                                <Text className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                                    {habit.title}
                                </Text>
                                <View className="flex-row items-center">
                                    <View 
                                        className="px-3 py-1 rounded-full mr-3"
                                        style={isDark ? { backgroundColor: `${categoryData.color}20` } : { borderColor: 'black', borderWidth: 1 , borderRadius: 99 }}
                                    >
                                        <Text 
                                            className="text-sm font-medium "
                                            style={{ color: isDark ? categoryData.color : "text-gray-800/30" }}
                                        >
                                            {categoryData.name}
                                        </Text>
                                    </View>
                                    {habit.isCompletedToday && (
                                        <View className="bg-green-500 px-3 py-1 rounded-full">
                                            <Text className="text-white text-sm font-medium">Completed</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {habit.description && (
                            <View className={`${isDark ? 'bg-gray-700' : 'bg-[#E5DDD0]'} rounded-2xl p-4`}>
                                <Text className={`text-base leading-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {habit.description}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Stats Grid */}
                    <View className="flex-row gap-2 mb-3">
                        <View className={`flex-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#E5DDD0] border-gray-800/50'} rounded-2xl p-5 border`}>
                            <View className="flex-row items-center mb-2">
                                <View className="bg-orange-100 w-10 h-10 rounded-xl items-center justify-center">
                                    <FontAwesome5 name="fire" size={18} color="#F97316" />
                                </View>
                            </View>
                            <Text className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {habit.streak}
                            </Text>
                            <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Habit Streak
                            </Text>
                        </View>

                        <View className={`flex-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#E5DDD0] border-gray-800/50'} rounded-2xl p-5 border`}>
                            <View className="flex-row items-center mb-2">
                                <View className="bg-green-100 w-10 h-10 rounded-xl items-center justify-center">
                                    <FontAwesome5 name="check-circle" size={18} color="#10B981" />
                                </View>
                            </View>
                            <Text className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {habit.completionHistory?.length || 0}
                            </Text>
                            <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Total Completed
                            </Text>
                        </View>
                    </View>

                    {/* Details */}
                    <View className={`${isDark ? 'bg-gray-800' : 'bg-orange-300/80'} rounded-3xl p-6 mb-3`}>
                        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Details
                        </Text>
                        
                        <View className="space-y-4">
                            <View className="flex-row items-center">
                                <FontAwesome5 name="calendar" size={16} color="#8B5CF6" />
                                <Text className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Created on {formatDate(habit.$createdAt)}
                                </Text>
                            </View>

                            <View className="flex-row items-center">
                                <FontAwesome5 name="clock" size={16} color="#3B82F6" />
                                <Text className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {formatFrequency(habit.frequency, habit.daysOfWeek, habit.daysOfMonth)}
                                </Text>
                            </View>

                            {habit.reminderTime && (
                                <View className="flex-row items-center">
                                    <FontAwesome5 name="bell" size={16} color="#F59E0B" />
                                    <Text className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Reminder at {habit.reminderTime}
                                    </Text>
                                </View>
                            )}

                            <View className="flex-row items-center">
                                <FontAwesome5 name="check-circle" size={16} color="#EF4444" />
                                <Text className={`ml-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {habit.isCompletedToday ? 'Completed today' : 'Not completed today'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Progress Chart Placeholder */}
                    <View className={`${isDark ? 'bg-gray-800' : 'bg-orange-300/80'} rounded-3xl p-6 mb-3`}>
                        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Recent Progress
                        </Text>
                        <View className="h-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl items-center justify-center">
                            <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Progress chart coming soon
                            </Text>
                        </View>
                    </View>

                    {/* Delete Section */}
                    <View className="mb-8">
                        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Danger Zone
                        </Text>
                        
                        <View className={`${isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-200/80 border-red-800/50'} rounded-2xl p-4 border`}>
                            <View className="flex-row items-center mb-3">
                                <FontAwesome5 name="exclamation-triangle" size={16} color="#EF4444" />
                                <Text className={`ml-2 font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                                    Delete this habit permanently
                                </Text>
                            </View>
                            
                            <Text className={`text-sm mb-4 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
                                This action cannot be undone. All progress and data for this habit will be permanently removed.
                            </Text>
                            
                            <TouchableOpacity
                                onPress={handleDeleteSwipe}
                                className="bg-red-500 rounded-xl p-4 flex-row items-center justify-center"
                                activeOpacity={0.8}
                            >
                                <FontAwesome5 name="trash" size={16} color="white" />
                                <Text className="text-white font-semibold ml-2 text-base">
                                    Delete Habit
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

interface HabitCardProps {
    habit: any;
    onPress: () => void;
    isDark: boolean;
}

const HabitCard = ({ habit, onPress, isDark }: HabitCardProps) => {
    const categoryData = getCategoryData(habit.category);

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-orange-300 border-gray-800/50'} rounded-3xl p-6 mb-4 border shadow-sm`}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center">
                {/* Category Icon */}
                <View 
                    className="w-16 h-16 rounded-2xl items-center justify-center border border-gray-800/80 mr-4 shadow-sm"
                    style={{ backgroundColor: categoryData.color }}
                >
                    <FontAwesome5 
                        name={categoryData.icon as any} 
                        size={22} 
                        color="#1F2937" 
                    />
                </View>
                
                {/* Habit Info */}
                <View className="flex-1 mr-3 ">
                    <View className="flex-row items-center justify-between mb-1">
                        <Text className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {habit.title}
                        </Text>
                        
                    </View>
                    
                    {habit.description && (
                        <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-3 leading-5`} numberOfLines={2}>
                            {habit.description}
                        </Text>
                    )}
                    
                    
                </View>
                
                {/* Chevron */}
                <FontAwesome5 name="chevron-right" size={16} color="#1F2937" />
            </View>
        </TouchableOpacity>
    );
};

export default function AllHabits() {
    const { 
        habits, 
        loading, 
        refreshing, 
        onRefresh, 
        getTodayStats,
        deleteHabit
    } = useHabits();
    const { user } = useAuth();
    const { isDark } = useTheme();
    const [selectedHabit, setSelectedHabit] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const todayStats = getTodayStats();
    const insets = useSafeAreaInsets();
    const handleHabitPress = (habit: any) => {
        setSelectedHabit(habit);
        setModalVisible(true);
    };

    const handleDeleteHabit = async (habitId: string) => {
        try {
            await deleteHabit(habitId);
        } catch (error) {
            console.error('Error deleting habit:', error);
        }
    };

    return (
        <View style={{ paddingBottom: insets.bottom + 50 , paddingTop: insets.top + 15 }} className={`flex-1  ${isDark ? 'bg-gray-900' : 'bg-[#EEDEDE]'}`}>
            <View className="flex-1 px-6 py-6">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-8">
                    <View>
                        <Text className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                            My Habits
                        </Text>
                        <Text className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {habits.length} habits • {todayStats.completed}/{todayStats.total} completed today
                        </Text>
                    </View>
                    <Link href="/AddHabit" asChild>
                        <TouchableOpacity className="bg-blue-500 w-14 h-14 rounded-2xl items-center justify-center shadow-lg">
                            <FontAwesome5 name="plus" size={18} color="white" />
                        </TouchableOpacity>
                    </Link>
                </View>


                {/* Habits List */}
                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <View className={`${isDark ? 'bg-gray-800' : 'bg-orange-300/80'} rounded-3xl p-8 items-center shadow-sm`}>
                            <FontAwesome5 name="spinner" size={32} color="#9CA3AF" />
                            <Text className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-4`}>
                                Loading your habits...
                            </Text>
                        </View>
                    </View>
                ) : habits.length === 0 ? (
                    <View className={`${isDark ? 'bg-gray-800' : 'bg-orange-300/80'} rounded-3xl p-10 items-center shadow-lg`}>
                        <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6">
                            <FontAwesome5 name="seedling" size={32} color="#3B82F6" />
                        </View>
                        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                            Start Your Journey
                        </Text>
                        <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-center text-lg leading-6 mb-8`}>
                            Create your first habit and begin building a better version of yourself
                        </Text>
                        <Link href="/AddHabit" asChild>
                            <TouchableOpacity className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-4 rounded-2xl shadow-lg">
                                <Text className="text-white font-bold text-lg">Create Your First Habit</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                ) : (
                    <ScrollView 
                        showsVerticalScrollIndicator={false} 
                        className="flex-1"
                        refreshControl={
                            <View>{/* Add pull to refresh if needed */}</View>
                        }
                    >
                        <View className="mb-4">
                            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                                All Habits ({habits.length})
                            </Text>
                            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                                Tap any habit to view details and manage
                            </Text>
                        </View>
                        
                        {habits.map((habit: any) => (
                            <HabitCard
                                key={habit.$id}
                                habit={habit}
                                onPress={() => handleHabitPress(habit)}
                                isDark={isDark}
                            />
                        ))}
                        
                        {/* Bottom spacing */}
                        <View className="h-6" />
                    </ScrollView>
                )}
            </View>

            {/* Habit Detail Modal */}
            <HabitDetailModal
                habit={selectedHabit}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onDelete={handleDeleteHabit}
                isDark={isDark}
            />
        </View>
    );
}