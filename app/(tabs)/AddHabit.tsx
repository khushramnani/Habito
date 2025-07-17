import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHabits } from '../../contexts/habitContext';
import { useTheme } from '../../contexts/themeContext';
import categoriesData from '../../data/category.json';
import { useAuth } from '../context/authContext';
interface HabitFormData {
    title: string;
    description: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    category: string;
    daysOfWeek?: string[];     
    daysOfMonth?: number[];    
    // reminderTime: string;
    
}

export default function AddHabitScreen() {
    const { user } = useAuth();
    const { addHabit } = useHabits();
    const { isDark } = useTheme();
    const router = useRouter();
    const [formData, setFormData] = useState<HabitFormData>({
        title: '',
        description: '',
        frequency: 'daily',
        category: '',
        daysOfWeek: [],
        daysOfMonth: [],
    });

    const insets = useSafeAreaInsets();

   

    // Reset form data to empty when component mounts
    // useEffect(() => {
    //     setFormData({
    //         title: '',
    //         description: '',
    //         frequency: '' as any,
    //         category: '',
    //         daysOfWeek: [],
    //         daysOfMonth: [],
    //     });
    // }, []);

    const categories = categoriesData.map(category => ({
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color
    }));
    

    const frequencies = [
        { id: 'daily', name: 'Daily', icon: 'calendar-day' },
        { id: 'weekly', name: 'Weekly', icon: 'calendar-week' },
        { id: 'monthly', name: 'Monthly', icon: 'calendar-alt' },
    ];

    const daysOfWeek = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];

    // Generate array of dates 1-31 for monthly selection
    const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1);

    const toggleDayOfWeek = (day: string) => {
        const currentDays = formData.daysOfWeek || [];
        const updatedDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];
        setFormData({ ...formData, daysOfWeek: updatedDays });
    };

    const toggleDayOfMonth = (day: number) => {
        const currentDays = formData.daysOfMonth || [];
        const updatedDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];
        setFormData({ ...formData, daysOfMonth: updatedDays });
    };

    const handleSubmit = async () => {
        // Basic validation for user experience
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a habit title');
            return;
        }
        
        if (!formData.category || !formData.frequency) {
            Alert.alert('Oops', 'You are missing something like category or frequency');
            return;
        }

        // Quick validation for better UX before hitting the context
        if (formData.frequency === 'weekly' && (!formData.daysOfWeek || formData.daysOfWeek.length === 0)) {
            Alert.alert('Error', 'Please select at least one day of the week');
            return;
        }

        if (formData.frequency === 'monthly' && (!formData.daysOfMonth || formData.daysOfMonth.length === 0)) {
            Alert.alert('Error', 'Please select at least one day of the month');
            return;
        }

        try {
            await addHabit({
                title: formData.title,
                description: formData.description,
                frequency: formData.frequency,
                category: formData.category,
                daysOfWeek: formData.daysOfWeek,
                daysOfMonth: formData.daysOfMonth,
            });

            // Reset form and navigate back on success
            setFormData({
                title: '',
                description: '',
                frequency: 'daily',
                category: '',
                daysOfWeek: [],
                daysOfMonth: [],
            });
            
            Alert.alert('Success', 'Habit created successfully!', [
                { 
                    text: 'OK', 
                    onPress: () => router.back()
                }
            ]);
            
        } catch (error) {
            console.error('Error saving habit:', error);
            const errorMessage = error instanceof Error ? error.message : 'There was an issue creating your habit. Please try again.';
            Alert.alert('Error', errorMessage);
        }

      

    }

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ paddingTop: insets.top + 15, paddingBottom: insets.bottom + 20 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            className={`flex-1 ${isDark ? 'bg-gray-800' : 'bg-[#EEDEDE]'}`}
        >
            <ScrollView 
                className="flex-1 px-6 py-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Header */}
                <View className="mb-8">
                    <Text className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                        Create New Habit
                    </Text>
                    <Text className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Build better habits, one step at a time
                    </Text>
                </View>

                {/* Habit Title */}
                <View className="mb-6">
                    <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                        Habit Title
                    </Text>
                    <TextInput
                        className={`border-2 rounded-2xl px-4 py-4 text-base ${
                            isDark 
                                ? 'bg-gray-800 border-gray-700 text-white' 
                                : 'bg-white border-gray-200 text-gray-900'
                        }`}
                        placeholder="e.g., Drink 8 glasses of water"
                        value={formData.title}
                        onChangeText={(text) => setFormData({ ...formData, title: text })}
                        placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                </View>

                {/* Description */}
                <View className="mb-6">
                    <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                        Description (Optional)
                    </Text>
                    <TextInput
                        className={`border-2 rounded-2xl px-4 py-4 text-base ${
                            isDark 
                                ? 'bg-gray-800 border-gray-700 text-white' 
                                : 'bg-white border-gray-200 text-gray-900'
                        }`}
                        placeholder="Add more details about your habit..."
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                    />
                </View>

                {/* Category Selection */}
                <View className="mb-6">
                    <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                        Category
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                className={`flex-row items-center px-4 py-3 rounded-2xl border-2 ${
                                    formData.category === category.id
                                        ? 'bg-orange-500 border-orange-600'
                                        : isDark 
                                            ? 'bg-gray-800 border-gray-700' 
                                            : 'bg-white border-gray-200'
                                }`}
                                onPress={() => setFormData({ ...formData, category: category.id })}
                            >
                                <FontAwesome5
                                    name={category.icon as any}
                                    size={16}
                                    color={
                                        formData.category === category.id 
                                            ? 'white' 
                                            : isDark 
                                                ? '#9CA3AF' 
                                                : '#6B7280'
                                    }
                                    style={{ marginRight: 8 }}
                                />
                                <Text className={`text-sm font-medium ${
                                    formData.category === category.id 
                                        ? 'text-white' 
                                        : isDark 
                                            ? 'text-gray-300' 
                                            : 'text-gray-700'
                                }`}>
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Frequency Selection */}
                <View className="mb-6">
                    <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                        Frequency
                    </Text>
                    <View className="flex-row gap-2">
                        {frequencies.map((freq) => (
                            <TouchableOpacity
                                key={freq.id}
                                className={`flex-1 flex-row items-center justify-center px-4 py-4 rounded-2xl border-2 ${
                                    formData.frequency === freq.id
                                        ? 'bg-orange-500 border-orange-600'
                                        : isDark 
                                            ? 'bg-gray-800 border-gray-700' 
                                            : 'bg-white border-gray-200'
                                }`}
                                onPress={() => setFormData({ 
                                    ...formData, 
                                    frequency: freq.id as any,
                                    daysOfWeek: freq.id === 'weekly' ? formData.daysOfWeek : [],
                                    daysOfMonth: freq.id === 'monthly' ? formData.daysOfMonth : []
                                })}
                            >
                                <FontAwesome5
                                    name={freq.icon as any}
                                    size={16}
                                    color={
                                        formData.frequency === freq.id 
                                            ? 'white' 
                                            : isDark 
                                                ? '#9CA3AF' 
                                                : '#6B7280'
                                    }
                                    style={{ marginRight: 8 }}
                                />
                                <Text className={`text-sm font-medium ${
                                    formData.frequency === freq.id 
                                        ? 'text-white' 
                                        : isDark 
                                            ? 'text-gray-300' 
                                            : 'text-gray-700'
                                }`}>
                                    {freq.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Days of Week Selection for Weekly Habits */}
                {formData.frequency === 'weekly' && (
                    <View className="mb-6">
                        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                            Select Days of the Week
                        </Text>
                        <View className="flex-row gap-1.5 w-full">
                            {daysOfWeek.map((day) => (
                                <TouchableOpacity
                                    key={day}
                                    className={`px-3 py-3 rounded-2xl border-2 ${
                                        formData.daysOfWeek?.includes(day)
                                            ? 'bg-orange-500 border-orange-600'
                                            : isDark 
                                                ? 'bg-gray-800 border-gray-700' 
                                                : 'bg-white border-gray-200'
                                    }`}
                                    onPress={() => toggleDayOfWeek(day)}
                                >
                                    <Text className={`text-sm font-medium ${
                                        formData.daysOfWeek?.includes(day) 
                                            ? 'text-white' 
                                            : isDark 
                                                ? 'text-gray-300' 
                                                : 'text-gray-700'
                                    }`}>
                                        {day.substring(0, 3)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                            Selected: {formData.daysOfWeek?.length || 0} day(s) {formData.daysOfWeek?.length === 7 && 'Please select Daily Instead of Weekly'}
                        </Text>
                    </View>
                )}

                {/* Days of Month Selection for Monthly Habits */}
                {formData.frequency === 'monthly' && (
                    <View className="mb-6 flex w-full">
                        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>
                            Select Days of the Month
                        </Text>
                        <View className="flex-row flex-wrap gap-1.5 items-center justify-center">
                            {daysOfMonth.map((day) => (
                                <TouchableOpacity
                                    key={day}
                                    className={`w-10 h-10 rounded-2xl border-2 items-center justify-center ${
                                        formData.daysOfMonth?.includes(day)
                                            ? 'bg-orange-500 border-orange-600'
                                            : isDark 
                                                ? 'bg-gray-800 border-gray-700' 
                                                : 'bg-white border-gray-200'
                                    }`}
                                    onPress={() => toggleDayOfMonth(day)}
                                >
                                    <Text className={`text-sm font-medium ${
                                        formData.daysOfMonth?.includes(day) 
                                            ? 'text-white' 
                                            : isDark 
                                                ? 'text-gray-300' 
                                                : 'text-gray-700'
                                    }`}>
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                            Selected: {formData.daysOfMonth?.length || 0} day(s)
                        </Text>
                    </View>
                )}


                {/* Reminder Time
                <View className="mb-8">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">Reminder Time (Optional)</Text>
                    <TextInput
                        className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-base"
                        placeholder="e.g., 9:00 AM"
                        value={formData.reminderTime}
                        onChangeText={(text) => setFormData({ ...formData, reminderTime: text })}
                        placeholderTextColor="#9CA3AF"
                    />
                    <Text className="text-sm text-gray-600 mt-1">
                        When would you like to be reminded?
                    </Text>
                </View> */}

                {/* Submit Button */}
                <TouchableOpacity
                    className="bg-orange-500 rounded-2xl py-4 px-6 mb-6 shadow-lg"
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                    style={{ 
                        shadowColor: '#F97316',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6
                    }}
                >
                    <Text className="text-white text-lg font-bold text-center">Create Habit</Text>
                </TouchableOpacity>

                
                
            </ScrollView>
        </KeyboardAvoidingView>
    );
}