import { Tabs } from "expo-router";
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TabsLayout() {
    return (
        <>
            <Tabs screenOptions={{  tabBarActiveTintColor: "orange", tabBarInactiveTintColor: "#888", tabBarLabelStyle: { fontSize: 14 }}}>
                <Tabs.Screen name="index" options={{ title: "Home" , tabBarIcon: () => <FontAwesome name="home" size={24} color="black" /> }} />
                <Tabs.Screen name="Login" options={{ title: "Login" , tabBarIcon: () => <FontAwesome name="user" size={24} color="black" /> }} />
            </Tabs>
        </>
    );
}
