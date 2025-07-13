import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useHabits } from '../../contexts/habitContext';
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
    const router = useRouter();
    const [formData, setFormData] = useState<HabitFormData>({
        title: '',
        description: '',
        frequency: 'daily',
        category: '',
        daysOfWeek: [],
        daysOfMonth: [],
        // reminderTime: '',
        
    });

   

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
            className="flex-1 bg-[#EEDEDE] "
        >
            <ScrollView 
                className="flex-1 px-4 py-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View className="mb-6">
                    <Text className="text-3xl font-bold text-gray-900 mb-2">Create New Habit</Text>
                    <Text className="text-gray-600">Build better habits, one step at a time</Text>
                </View>

                {/* Habit Title */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">Habit Title</Text>
                    <TextInput
                        className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-base"
                        placeholder="e.g., Drink 8 glasses of water"
                        value={formData.title}
                        onChangeText={(text) => setFormData({ ...formData, title: text })}
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Description */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-2">Description (Optional)</Text>
                    <TextInput
                        className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 text-base"
                        placeholder="Add more details about your habit..."
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {/* Category Selection */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-3">Category</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                className={`flex-row items-center px-4 py-2 rounded-lg border ${
                                    formData.category === category.id
                                        ? 'bg-orange-600 border-2 border-dotted border-white'
                                        : 'bg-white border-gray-200'
                                }`}
                                style={
                                    formData.category === category.id
                                        ? undefined
                                        : {
                                            backgroundColor: category.color,
                                            borderColor: category.color,
                                          }
                                }
                                onPress={() => setFormData({ ...formData, category: category.id })}
                            >
                                <FontAwesome5
                                    name={category.icon as any}
                                    size={16}
                                    color={formData.category === category.id ? 'white' : '#6B7280'}
                                    style={{ marginRight: 8 }}
                                />
                                <Text className={`text-sm font-medium ${
                                    formData.category === category.id ? 'text-white' : 'text-gray-700'
                                }`}>
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Frequency Selection */}
                <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-3">Frequency</Text>
                    <View className="flex-row gap-2">
                        {frequencies.map((freq) => (
                            <TouchableOpacity
                                key={freq.id}
                                className={`flex-1 flex-row items-center justify-center px-4 py-3 rounded-lg border ${
                                    formData.frequency === freq.id
                                        ? 'bg-orange-500 border-orange-500'
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
                                    color={formData.frequency === freq.id ? 'white' : '#6B7280'}
                                    style={{ marginRight: 8 }}
                                />
                                <Text className={`text-sm font-medium ${
                                    formData.frequency === freq.id ? 'text-white' : 'text-gray-700'
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
                        <Text className="text-lg font-semibold text-gray-900 mb-3">Select Days of the Week</Text>
                        <View className="flex-row  gap-1.5 w-full">
                            {daysOfWeek.map((day) => (
                                <TouchableOpacity
                                    key={day}
                                    className={`px-3 py-3 rounded-lg border ${
                                        formData.daysOfWeek?.includes(day)
                                            ? 'bg-orange-500 border-orange-500'
                                            : 'bg-white border-gray-200'
                                    }`}
                                    onPress={() => toggleDayOfWeek(day)}
                                >
                                    <Text className={`text-sm font-medium ${
                                        formData.daysOfWeek?.includes(day) ? 'text-white' : 'text-gray-700'
                                    }`}>
                                        {day.substring(0, 3)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text className="text-xs text-gray-600 mt-2">
                            Selected: {formData.daysOfWeek?.length || 0} day(s) {formData.daysOfWeek?.length === 7 && 'Please select Daily Instead of Weekly'}
                        </Text>
                    </View>
                )}

                {/* Days of Month Selection for Monthly Habits */}
                {formData.frequency === 'monthly' && (
                    <View className="mb-6 flex  w-full">
                        <Text className="text-lg font-semibold text-gray-900 mb-3">Select Days of the Month</Text>
                        <View className="flex-row flex-wrap gap-1.5 items-center justify-center ">
                            {daysOfMonth.map((day) => (
                                <TouchableOpacity
                                    key={day}
                                    className={`w-10 h-10 rounded-lg border items-center justify-center ${
                                        formData.daysOfMonth?.includes(day)
                                            ? 'bg-orange-500 border-orange-500'
                                            : 'bg-white border-gray-200'
                                    }`}
                                    onPress={() => toggleDayOfMonth(day)}
                                >
                                    <Text className={`text-sm font-medium ${
                                        formData.daysOfMonth?.includes(day) ? 'text-white' : 'text-gray-700'
                                    }`}>
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text className="text-xs text-gray-600 mt-2">
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
                    className="bg-orange-500 rounded-lg py-4 px-6 mb-6"
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                >
                    <Text className="text-white text-lg font-semibold text-center">Create Habit</Text>
                </TouchableOpacity>

                {/* Additional spacing for bottom to account for tab bar */}
                <View className="h-24" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}