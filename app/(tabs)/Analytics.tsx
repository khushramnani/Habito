import { FontAwesome5 } from '@expo/vector-icons';
import { Text, View } from "react-native";
import { useHabits } from '../../contexts/habitContext';
import { useAuth } from "../context/authContext";
export default function AnalyticsScreen() {
    const { getTodayStats } = useHabits();
    const { user } = useAuth();
    return (
        <View className="flex-1 items-center justify-center">
            <Text className="text-2xl font-bold">Analytics Screen</Text>
                                {/* Today's Progress */}
                                <View className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl p-4">
                                    <Text className="text-white text-lg font-semibold mb-2">Today's Progress</Text>
                                    <View className="flex-row items-center">
                                        <View className="flex-1">
                                            <Text className="text-white text-3xl font-bold">
                                                {getTodayStats().completed}/{getTodayStats().total}
                                            </Text>
                                            <Text className="text-orange-100">habits completed</Text>
                                        </View>
                                        <View className="bg-white/20 rounded-full p-3">
                                            <FontAwesome5 name="chart-line" size={24} color="white" />
                                        </View>
                                    </View>
                                </View>
        </View>
    );
}
