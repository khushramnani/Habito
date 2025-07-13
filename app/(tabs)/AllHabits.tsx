import { useHabits } from "@/contexts/habitContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import categorydata from "../../data/category.json";
import { useAuth } from "../context/authContext";

// Helper function to get category data
const getCategoryData = (categoryId: string) => {
    return categorydata.find(cat => cat.id === categoryId) || {
        name: 'Other',
        icon: 'ellipsis-h',
        color: '#BCAAA4'
    };
};
export default function AllHabits() {
        const { 
            habits, 
            loading, 
            refreshing, 
            markHabitComplete, 
            onRefresh, 
            getTodayStats 
        } = useHabits();
    const { user } = useAuth();
    const todayStats = getTodayStats();

    

    return (
        <View className="flex-1 items-center justify-center">
            {/* Habits Section */}
                <View className="flex-1 w-full px-4 py-6">
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-xl font-bold text-gray-900">Your Habits</Text>
                        <Link href="/AddHabit" asChild>
                            <TouchableOpacity className="bg-orange-500 px-4 py-2 rounded-lg">
                                <Text className="text-white font-semibold">Add New</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {loading ? (
                        <View className="flex-1 items-center justify-center py-12">
                            <Text className="text-gray-500">Loading habits...</Text>
                        </View>
                    ) : habits.length === 0 ? (
                        <View className="bg-white rounded-2xl p-8 items-center">
                            <FontAwesome5 name="plus-circle" size={48} color="#9CA3AF" />
                            <Text className="text-xl font-semibold text-gray-900 mt-4 mb-2">No habits yet</Text>
                            <Text className="text-gray-600 text-center mb-6">
                                Create your first habit to start building better routines
                            </Text>
                            <Link href="/AddHabit" asChild>
                                <TouchableOpacity className="bg-orange-500 px-6 py-3 rounded-lg">
                                    <Text className="text-white font-semibold">Create Habit</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    ) : (
                        <View className="gap-3">
                            {habits.map((habit) => {
                                const categoryData = getCategoryData(habit.category);
                                return (
                                    <View key={habit.$id} className="bg-white rounded-2xl p-4">
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row items-center flex-1">
                                                <View 
                                                    className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                                                    style={{ backgroundColor: categoryData.color }}
                                                >
                                                    <FontAwesome5 
                                                        name={categoryData.icon as any} 
                                                        size={20} 
                                                        color="#6B7280" 
                                                    />
                                                </View>
                                                <View className="flex-1">
                                                    <Text className="text-lg font-semibold text-gray-900">
                                                        {habit.title}
                                                    </Text>
                                                    {habit.description && (
                                                        <Text className="text-gray-600 text-sm mt-1">
                                                            {habit.description}
                                                        </Text>
                                                    )}
                                                    <View className="flex-row items-center mt-2">
                                                        <FontAwesome5 name="fire" size={14} color="#F97316" />
                                                        <Text className="text-orange-500 font-semibold ml-1">
                                                            {habit.streak} day streak
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                            
                                            {habit.isCompletedToday ? (
                                                <View className="bg-green-100 p-3 rounded-full">
                                                    <FontAwesome5 name="check" size={20} color="#10B981" />
                                                </View>
                                            ) : (
                                                <TouchableOpacity 
                                                    className="bg-orange-500 p-3 rounded-full"
                                                    onPress={() => markHabitComplete(habit.$id)}
                                                >
                                                    <FontAwesome5 name="plus" size={20} color="white" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>
        </View>
    );
}
