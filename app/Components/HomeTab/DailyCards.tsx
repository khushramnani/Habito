import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Habit, useHabits } from '../../../contexts/habitContext';
import categoryData from '../../../data/category.json';
import HabitDetailModal from './HabitDetailModal';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.85;
const CARD_SPACING = (screenWidth - (screenWidth * 0.85)) / 2;

export default function DailyCards() {
    const { habits, markHabitComplete } = useHabits();
    const [todaysHabits, setTodaysHabits] = useState<Habit[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const animatedValues = useRef<{ [key: string]: Animated.Value }>({});
    const cardAnimations = useRef<{ [key: number]: Animated.Value }>({});

    // Filter habits that are due today
    const filterTodaysHabits = () => {
        const now = new Date();
        const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(now);
        const currentDate = now.getDate();

        const filtered = habits.filter(habit => {
            if (habit.frequency === 'daily') {
                return true;
            }
            if (habit.frequency === 'weekly') {
                return habit.daysOfWeek?.includes(today);
            }
            if (habit.frequency === 'monthly') {
                return habit.daysOfMonth?.includes(currentDate);
            }
            return false;
        });

        // Sort habits to show pending first, then completed
        const sorted = filtered.sort((a, b) => {
            if (a.isCompletedToday === b.isCompletedToday) return 0;
            return a.isCompletedToday ? 1 : -1;
        });

        setTodaysHabits(sorted);
    };

    useEffect(() => {
        filterTodaysHabits();
    }, [habits]);

    // Initialize animated values for each habit
    useEffect(() => {
        todaysHabits.forEach((habit, index) => {
            if (!animatedValues.current[habit.$id]) {
                animatedValues.current[habit.$id] = new Animated.Value(0);
            }
            if (!cardAnimations.current[index]) {
                cardAnimations.current[index] = new Animated.Value(index === currentIndex ? 1 : 0.9);
            }
        });
    }, [todaysHabits, currentIndex]);

    // Animate card transitions when currentIndex changes
    useEffect(() => {
        todaysHabits.forEach((_, index) => {
            if (cardAnimations.current[index]) {
                Animated.spring(cardAnimations.current[index], {
                    toValue: index === currentIndex ? 1 : 0.9,
                    useNativeDriver: true,
                    tension: 150,
                    friction: 10,
                }).start();
            }
        });
    }, [currentIndex, todaysHabits]);

    const handleHabitComplete = async (habitId: string) => {
        // Add haptic feedback for habit completion
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Animate the card completion
        if (animatedValues.current[habitId]) {
            Animated.spring(animatedValues.current[habitId], {
                toValue: 1,
                useNativeDriver: false,
            }).start();
        }

        await markHabitComplete(habitId);
        
        // Close modal after completion
        if (modalVisible) {
            setModalVisible(false);
            setSelectedHabit(null);
        }
    };

    const handleCardPress = (habit: Habit) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedHabit(habit);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setSelectedHabit(null);
    };

    const scrollToIndex = (index: number) => {
        if (scrollViewRef.current && index >= 0 && index < todaysHabits.length) {
            // Add haptic feedback when manually navigating
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            const offsetX = index * screenWidth;
            
            // Smooth scroll animation with easing
            scrollViewRef.current.scrollTo({ 
                x: offsetX, 
                animated: true 
            });
            
            // Update current index with slight delay to ensure smooth transition
            setTimeout(() => {
                setCurrentIndex(index);
            }, 50);
        }
    };

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / screenWidth);
        const newIndex = Math.max(0, Math.min(index, todaysHabits.length - 1));
        
        // Add haptic feedback when card changes during scroll
        if (newIndex !== currentIndex) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        
        setCurrentIndex(newIndex);
    };

    const getCategoryData = (categoryId: string) => {
        const category = categoryData.find(cat => cat.id === categoryId.toLowerCase());
        return category || categoryData.find(cat => cat.id === 'other');
    };

    const convertToGrayscale = (color: string) => {
        // Convert hex color to RGB
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate grayscale using luminance formula and darken it more
        const gray = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 0.6); // Darken by 40%
        
        // Convert back to hex
        const grayHex = Math.max(gray, 60).toString(16).padStart(2, '0'); // Minimum darkness
        return `#${grayHex}${grayHex}${grayHex}`;
    };

    if (todaysHabits.length === 0) {
        return (
            <View className="px-4 mb-6">
                <Text className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Today's Habits
                </Text>
                <View className="bg-white dark:bg-gray-800 rounded-xl p-6 items-center">
                    <FontAwesome5 name="check-circle" size={48} color="#10B981" />
                    <Text className="text-gray-600 dark:text-gray-300 mt-2 text-center">
                        No habits scheduled for today!
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="mb-6">
            {/* Header */}
            <View className="px-4 ">
                <Text className="text-lg font-semibold text-gray-800 dark:text-white">
                    Today's Habits ({todaysHabits.length})
                </Text>
            </View>

            {/* Cards Container with Navigation */}
            <View className="relative pt-6">
                {/* Left Arrow */}
                <TouchableOpacity
                    onPress={() => scrollToIndex(currentIndex - 1)}
                    disabled={currentIndex === 0}
                    className={`absolute left-2 top-1/2 z-10 p-3 rounded-full shadow-lg ${
                        currentIndex === 0 
                            ? 'bg-gray-200 dark:bg-gray-700' 
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
                    }`}
                    style={{ transform: [{ translateY: -20 }] }}
                >
                    <FontAwesome5 
                        name="chevron-left" 
                        size={18} 
                        color={currentIndex === 0 ? "#9CA3AF" : "#F97316"} 
                    />
                </TouchableOpacity>

                {/* Right Arrow */}
                <TouchableOpacity
                    onPress={() => scrollToIndex(currentIndex + 1)}
                    disabled={currentIndex === todaysHabits.length - 1}
                    className={`absolute right-2 top-1/2 z-10 p-3 rounded-full shadow-lg ${
                        currentIndex === todaysHabits.length - 1 
                            ? 'bg-gray-300 dark:bg-gray-700' 
                            : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600'
                    }`}
                    style={{ transform: [{ translateY: -20 }] }}
                >
                    <FontAwesome5 
                        name="chevron-right" 
                        size={18} 
                        color={currentIndex === todaysHabits.length - 1 ? "#9CA3AF" : "#F97316"} 
                    />
                </TouchableOpacity>

                {/* Horizontal Scrollable Cards */}
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    decelerationRate="fast"
                    bounces={false}
                >
                    {todaysHabits.map((habit, index) => {
                        const animatedValue = animatedValues.current[habit.$id];
                        const cardScale = cardAnimations.current[index] || new Animated.Value(0.9);
                        const isActiveCard = index === currentIndex;
                        
                        return (
                            <View
                                key={habit.$id}
                                style={{
                                    width: screenWidth,
                                    height: 420,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    paddingHorizontal: CARD_SPACING,
                                }}
                            >
                                <Animated.View
                                    style={{
                                        width: CARD_WIDTH,
                                        height: '100%',
                                        transform: [
                                            {
                                                scale: cardScale,
                                            },
                                            {
                                                translateY: cardScale.interpolate({
                                                    inputRange: [0.9, 1],
                                                    outputRange: [20, 0],
                                                }),
                                            },
                                            {
                                                scale: animatedValue?.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [1, 0.98],
                                                }) || 1,
                                            },
                                        ],
                                        opacity: cardScale.interpolate({
                                            inputRange: [0.9, 1],
                                            outputRange: [0.6, 1],
                                        }),
                                        zIndex: isActiveCard ? 10 : index,
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => handleCardPress(habit)}
                                        activeOpacity={0.9}
                                        style={{ flex: 1 }}
                                    >
                                        <View className={`rounded-3xl  overflow-hidden flex-1`} style={{
                                        backgroundColor: habit.isCompletedToday 
                                            ? convertToGrayscale(getCategoryData(habit.category)?.color || '#F59E0B')
                                            : getCategoryData(habit.category)?.color || '#F59E0B',
                                    }}>
                                        {/* Header */}
                                        <View className="p-6 pb-4">
                                            <View className="flex-row items-center justify-between mb-2">
                                                <Text className={`text-2xl font-bold ${
                                                    habit.isCompletedToday ? 'text-white/90 dark:text-white/70' : 'text-gray-800'
                                                }`}>
                                                    {habit.title}
                                                </Text>
                                                <View className="flex-row items-center">
                                                    <FontAwesome5 
                                                        name="fire" 
                                                        size={16} 
                                                        color={habit.isCompletedToday ? "rgba(255,255,255,0.8)" : "#374151"} 
                                                    />
                                                    <Text className={`text-sm ml-1 font-medium ${
                                                        habit.isCompletedToday ? 'text-white/80 dark:text-white/60' : 'text-gray-800 '
                                                    }`}>
                                                        {habit.streak}
                                                    </Text>
                                                </View>
                                            </View>
                                            {habit.description && (
                                                <Text className={`text-sm ${
                                                    habit.isCompletedToday ? 'text-white/70 dark:text-white/50' : 'text-gray-700 '
                                                }`}>
                                                    {habit.description}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Main Content Area with Icon */}
                                        <View className="flex-1 items-center justify-center py-12 px-6">
                                            <View className={`rounded-full p-8 mb-4 ${
                                                habit.isCompletedToday ? 'bg-white/20 dark:bg-white/10' : 'bg-black/10 '
                                            }`}>
                                                <FontAwesome5 
                                                    name={getCategoryData(habit.category)?.icon || 'circle'} 
                                                    size={48} 
                                                    color={habit.isCompletedToday 
                                                        ? "rgba(255,255,255,0.8)" 
                                                        : "#374151"
                                                    } 
                                                />
                                            </View>
                                            <Text className={`text-sm capitalize font-medium ${
                                                habit.isCompletedToday ? 'text-white/80 dark:text-white/60' : 'text-gray-800 '
                                            }`}>
                                                {getCategoryData(habit.category)?.name || habit.category}
                                            </Text>
                                            {habit.frequency !== 'daily' && (
                                                <Text className={`text-xs mt-1 ${
                                                    habit.isCompletedToday ? 'text-white/60 dark:text-white/40' : 'text-gray-600 '
                                                }`}>
                                                    {habit.frequency === 'weekly' && habit.daysOfWeek && 
                                                        `${habit.daysOfWeek.join(', ')}`
                                                    }
                                                    {habit.frequency === 'monthly' && habit.daysOfMonth && 
                                                        ` ${habit.daysOfMonth.join(', ')}th Day Of Month`
                                                    }
                                                </Text>
                                            )}
                                        </View>

                                        {/* Status Section */}
                                        <View className={`backdrop-blur-sm ${
                                            habit.isCompletedToday ? 'bg-white/10 dark:bg-white/5' : 'bg-black/5 '
                                        }`}>
                                            <View className="flex-row items-center justify-between p-4">
                                                <View className="flex-row items-center">
                                                    <Text className={`font-semibold mr-2 ${
                                                        habit.isCompletedToday ? 'text-white/80 dark:text-white/60' : 'text-gray-800 '
                                                    }`}>
                                                        Status: 
                                                    </Text>
                                                    <Text className={`font-bold ${
                                                        habit.isCompletedToday ? 'text-white/90 dark:text-white/70' : 'text-gray-900 '
                                                    }`}>
                                                        {habit.isCompletedToday ? 'Completed' : 'Pending'}
                                                    </Text>
                                                </View>
                                                <View className={`w-8 h-8 rounded-full border-2 items-center justify-center ${
                                                    habit.isCompletedToday 
                                                        ? 'bg-white/90 border-white/70 dark:bg-white/80 dark:border-white/60' 
                                                        : ' border-gray-800 text-black bg-orange-400 '
                                                }`}>
                                                    {habit.isCompletedToday && (
                                                        <FontAwesome5 
                                                            name="check" 
                                                            size={16} 
                                                            color={convertToGrayscale(getCategoryData(habit.category)?.color || '#F59E0B')} 
                                                        />
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Dots Indicator */}
            {todaysHabits.length > 1 && (
                <View className="flex-row justify-center mt-4 gap-2">
                    {todaysHabits.map((_, index) => (
                        <View
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                                index === currentIndex ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                        />
                    ))}
                </View>
            )}

            {/* Habit Detail Modal */}
            <HabitDetailModal
                visible={modalVisible}
                habit={selectedHabit}
                onClose={handleModalClose}
                onComplete={handleHabitComplete}
            />
        </View>
    );
}