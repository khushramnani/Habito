import { useEffect, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface CalendarDate {
    date: number;
    dayName: string;
    isToday: boolean;
    isSelected: boolean;
}

export default function CalendarRow() {
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [calendarDates, setCalendarDates] = useState<CalendarDate[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        generateCalendarDates();
    }, []);

    useEffect(() => {
        // Scroll to center today's date when component mounts
        if (calendarDates.length > 0) {
            const todayIndex = calendarDates.findIndex(date => date.isToday);
            if (todayIndex !== -1 && scrollViewRef.current) {
                const itemWidth = 76; // approximate width of each date item (60px + margins)
                const screenWidth = 300; // approximate screen width for calculation
                const scrollToX = Math.max(0, (todayIndex * itemWidth) - (screenWidth / 2) + (itemWidth / 2));
                
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ x: scrollToX, animated: true });
                }, 100);
            }
        }
    }, [calendarDates]);

    const generateCalendarDates = () => {
        const today = new Date();
        const currentDate = today.getDate();
        const dates: CalendarDate[] = [];
        
        // Generate 6 days starting from 2 days before today (for 2.5 dates on each side when centered)
        for (let i = -3; i <= 3; i++) {
            const date = new Date(today);
            date.setDate(currentDate + i);
            
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            dates.push({
                date: date.getDate(),
                dayName: dayNames[date.getDay()],
                isToday: i === 0, // Only today (i === 0) is marked as isToday
                isSelected: false // No date is selected, only today is highlighted
            });
        }
        
        setCalendarDates(dates);
    };

    const handleDatePress = (date: number) => {
        // You can add logic here for when dates are pressed
        // For now, we don't change the selection since only today should be highlighted
        // console.log('Date pressed:', date);
    };

    return (
        <View className=" rounded-lg">
            
            
            {/* Calendar Dates Row */}
            <ScrollView 
                ref={scrollViewRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-2"
                // contentContainerStyle={{ paddingHorizontal: 4 }}
            >
                {calendarDates.map((dateItem, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handleDatePress(dateItem.date)}
                        className={`mx-1 px-4 py-3 rounded-xl items-center min-w-[60px] ${
                            dateItem.isToday 
                                ? 'bg-orange-500' 
                                : 'bg-[#E5DDD0] dark:bg-neutral-700 border border-gray-800 dark:border-neutral-600'
                        }`}
                    >
                        <Text className={`text-xs font-medium mb-1 ${
                            dateItem.isToday 
                                ? 'text-white' 
                                : 'text-gray-600 dark:text-gray-300'
                        }`}>
                            {dateItem.dayName}
                        </Text>
                        <Text className={`text-lg font-bold ${
                            dateItem.isToday 
                                ? 'text-white' 
                                : 'text-gray-800 dark:text-gray-200'
                        }`}>
                            {dateItem.date}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}