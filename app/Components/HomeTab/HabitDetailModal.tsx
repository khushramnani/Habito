import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Animated, Dimensions, Modal, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SwipeButton from 'rn-swipe-button';
import { Habit, useHabits } from '../../../contexts/habitContext';
import categoryData from '../../../data/category.json';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface HabitDetailModalProps {
    visible: boolean;
    habit: Habit | null;
    onClose: () => void;
    onComplete: (habitId: string) => void;
}

export default function HabitDetailModal({ visible, habit, onClose, onComplete }: HabitDetailModalProps) {
    const insets = useSafeAreaInsets();
    const scaleValue = React.useRef(new Animated.Value(0)).current;
    const opacityValue = React.useRef(new Animated.Value(0)).current;
    const { markHabitComplete } = useHabits();
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    React.useEffect(() => {
        if (visible) {
            // Reset states when modal opens
            setIsCompleted(false);
            setIsProcessing(false);
        }
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 150,
                    friction: 8,
                }),
                Animated.timing(opacityValue, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(scaleValue, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 150,
                    friction: 8,
                }),
                Animated.timing(opacityValue, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const getCategoryData = (categoryId: string) => {
        const category = categoryData.find(cat => cat.id === categoryId.toLowerCase());
        return category || categoryData.find(cat => cat.id === 'other');
    };

    const convertToGrayscale = (color: string) => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        const gray = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 0.6);
        const grayHex = Math.max(gray, 60).toString(16).padStart(2, '0');
        return `#${grayHex}${grayHex}${grayHex}`;
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    const handleComplete = () => {
        // Prevent multiple completions
        if (habit && !habit.isCompletedToday && !isCompleted && !isProcessing) {
            setIsProcessing(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            markHabitComplete(habit.$id);
            setIsCompleted(true);
            onComplete(habit.$id);

            
            // Alert.alert(
            //     'Success! 🎉',
            //     'Habit marked as completed!',
            //     [{ text: 'OK', style: 'default' }]
            // );

            
            setTimeout(() => {
                setIsProcessing(false);
            }, 1000);

        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    if (!habit) return null;

    const categoryData_item = getCategoryData(habit.category);
    const cardColor = habit.isCompletedToday
        ? convertToGrayscale(categoryData_item?.color || '#F59E0B')
        : categoryData_item?.color || '#F59E0B';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />

            {/* Backdrop */}
            <Animated.View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    opacity: opacityValue,
                }}
            >
                <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
                    onPress={handleClose}
                >
                    {/* Modal Content */}
                    <Animated.View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingTop: insets.top + 20,
                            paddingBottom: insets.bottom + 20,
                            transform: [{ scale: scaleValue }],
                        }}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            style={{
                                width: screenWidth * 0.9,
                                minHeight: screenHeight * 0.8,
                                backgroundColor: cardColor,
                                borderRadius: 24,
                                overflow: 'hidden',
                                elevation: 20,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: 0.3,
                                shadowRadius: 20,
                            }}
                            onPress={() => { }} // Prevent closing when tapping on modal content
                        >
                            {/* Close Button */}
                            <TouchableOpacity
                                onPress={handleClose}
                                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/20 items-center justify-center"
                                style={{
                                    backgroundColor: 'rgba(0,0,0,0.2)',
                                }}
                            >
                                <FontAwesome5
                                    name="times"
                                    size={18}
                                    color="white"
                                />
                            </TouchableOpacity>

                            {/* Header Section */}
                            <View className="p-8 pb-6 mt-6">
                                <View className="flex-row items-center justify-between mb-4">
                                    <View className="flex-1 pr-12">
                                        <Text className={`text-3xl font-bold ${habit.isCompletedToday ? 'text-white/90' : 'text-gray-800'
                                            }`}>
                                            {habit.title}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <FontAwesome5
                                            name="fire"
                                            size={20}
                                            color={habit.isCompletedToday ? "rgba(255,255,255,0.8)" : "#374151"}
                                        />
                                        <Text className={`text-lg ml-2 font-bold ${habit.isCompletedToday ? 'text-white/80' : 'text-gray-800'
                                            }`}>
                                            {habit.streak}
                                        </Text>
                                    </View>
                                </View>

                                {habit.description && (
                                    <Text className={`text-base leading-6 ${habit.isCompletedToday ? 'text-white/70' : 'text-gray-700'
                                        }`}>
                                        {habit.description}
                                    </Text>
                                )}
                            </View>

                            {/* Icon Section */}
                            <View className="flex-1 items-center justify-center py-12">
                                <View className={`rounded-full p-12 mb-6 ${habit.isCompletedToday ? 'bg-white/20' : 'bg-black/10'
                                    }`}>
                                    <FontAwesome5
                                        name={categoryData_item?.icon || 'circle'}
                                        size={80}
                                        color={habit.isCompletedToday
                                            ? "rgba(255,255,255,0.8)"
                                            : "#374151"
                                        }
                                    />
                                </View>

                                <Text className={`text-xl capitalize font-semibold mb-2 ${habit.isCompletedToday ? 'text-white/80' : 'text-gray-800'
                                    }`}>
                                    {categoryData_item?.name || habit.category}
                                </Text>

                                <Text className={`text-lg font-medium ${habit.isCompletedToday ? 'text-white/70' : 'text-gray-700'
                                    }`}>
                                    {habit.frequency === 'daily' && 'Daily Habit'}
                                    {habit.frequency === 'weekly' && `${habit.daysOfWeek?.join(', ')}`}
                                    {habit.frequency === 'monthly' && `${habit.daysOfMonth?.join(', ')}th of Month`}
                                </Text>
                            </View>

                            {/* Status and Action Section */}
                            <View className={`${habit.isCompletedToday ? 'bg-white/10' : 'bg-black/5'
                                }`}>
                                {/* Status Display */}
                                <View className="px-8 py-4">
                                    <View className="flex-row items-center justify-center mb-4">
                                        <Text className={`text-lg font-semibold mr-3 ${habit.isCompletedToday ? 'text-white/80' : 'text-gray-800'
                                            }`}>
                                            Status:
                                        </Text>
                                        <View className="flex-row items-center">
                                            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-2 ${habit.isCompletedToday
                                                    ? 'bg-white/90 border-white/70'
                                                    : 'border-gray-800 bg-orange-400'
                                                }`}>
                                                {habit.isCompletedToday && (
                                                    <FontAwesome5
                                                        name="check"
                                                        size={12}
                                                        color={cardColor}
                                                    />
                                                )}
                                            </View>
                                            <Text className={`text-lg font-bold ${habit.isCompletedToday ? 'text-white/90' : 'text-gray-900'
                                                }`}>
                                                {habit.isCompletedToday ? 'Completed' : 'Pending'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Complete Button */}
                                {!habit.isCompletedToday && !isCompleted && (
                                    <View className="px-8 pb-8">
                                        <SwipeButton
                                            thumbIconComponent={() => (
                                                <FontAwesome5 name="check-circle" size={20} color="#fff" />
                                            )}
                                            thumbIconBackgroundColor="#10B981"
                                            thumbIconBorderColor="#10B981"
                                            //   thumbIconBorderWidth={2}
                                            railBackgroundColor={isCompleted ? "#10B981" : "#E5E7EB"}
                                            railBorderColor="#D1D5DB"
                                            railFillBackgroundColor={isCompleted ? "#10B981" : "#E5E7EB"}
                                            disabled={isProcessing || isCompleted}
                                            onSwipeFail={() => {
                                                if (!isProcessing && !isCompleted) {
                                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                                                }
                                            }}
                                            onSwipeSuccess={() => {
                                                if (!isProcessing && !isCompleted) {
                                                    handleComplete();
                                                }
                                            }}
                                            title={isCompleted ? "Completed!" : isProcessing ? "Processing..." : "Swipe to Complete"}
                                            titleStyles={{
                                                color: isCompleted || isProcessing ? "#10B981" : "#374151"
                                            }}
                                        />
                                    </View>
                                )}

                                {/* Show completion animation/message when just completed */}
                                {!habit.isCompletedToday && isCompleted && (
                                    <View className="px-8 pb-8">
                                        <View className="bg-green-100 border-2 border-green-300 rounded-2xl py-4 items-center justify-center">
                                            <View className="flex-row items-center">
                                                <FontAwesome5
                                                    name="check-circle"
                                                    size={24}
                                                    color="#10B981"
                                                />
                                                <Text className="text-xl font-bold ml-3 text-green-600">
                                                    Just Completed! 🎉
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {habit.isCompletedToday && (
                                    <View className="px-8 pb-8">
                                        <View className="bg-white/90 rounded-2xl py-4 items-center justify-center">
                                            <View className="flex-row items-center">
                                                <FontAwesome5
                                                    name="check-double"
                                                    size={24}
                                                    color="#10B981"
                                                />
                                                <Text className="text-xl font-bold ml-3 text-green-600">
                                                    Completed Today!
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
}
