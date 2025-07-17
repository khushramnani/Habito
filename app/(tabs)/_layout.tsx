import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import { Tabs } from "expo-router";
import { useMemo } from 'react';
import { Platform, View } from 'react-native';

interface TabIconProps {
    name: string;
    color: string;
    focused: boolean;
    size?: number;
}

const TabIcon = ({ name, color, focused, size = 24 }: TabIconProps) => {
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: 24,
                // backgroundColor: focused ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
                borderWidth: focused ? 1 : 0,
                // borderColor: 'rgba(255, 255, 255, 0.4)',
                borderColor: 'black',
                ...Platform.select({
                    ios: {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: focused ? 0.25 : 0,
                        shadowRadius: 8,
                    },
                    android: {
                        elevation: 0,
                    },
                }),
            }}>
                <FontAwesome5 
                    name={name} 
                    size={size} 
                    color={focused ? 'black' : color} 
                    style={{
                        textShadowColor: focused ? 'rgba(0,0,0,0.4)' : 'transparent',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                    }}
                />
            </View>
        </View>
    );
};

export default function TabsLayout() {
    // Memoize the BlurView to prevent re-renders that cause Reanimated warnings
    const TabBarBackground = useMemo(() => {
        return () => (
            <BlurView 
                intensity={90}
                tint="light"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    // backgroundColor: 'rgba(245, 85, 7, 0.52)',
                    // backgroundColor: '#454545',
                    backgroundColor: '#E9950E',
                    backdropFilter: 'blur(39px)',
                    borderWidth: 1,
                    borderColor: 'black',
                    borderRadius: 32,
                    overflow: 'hidden',
                }}
            />
        );
    }, []);

    return (
        <>
            <Tabs 
                screenOptions={{
                    tabBarActiveTintColor: "black", 
                    tabBarInactiveTintColor: "black", 
                    headerShown: false,
                    tabBarBackground: TabBarBackground,
                    tabBarStyle: {
                        backgroundColor: 'transparent',
                        borderTopWidth: 0,
                        borderWidth: 0,
                        elevation: 0,
                        height: Platform.OS === 'ios' ? 100 : 80,
                        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
                        paddingTop: 20,
                        paddingHorizontal: 20,
                        marginBottom: Platform.OS === 'ios' ? 0 : 30,
                        marginHorizontal: 12,
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: Platform.OS === 'ios' ? 8 : 25,
                        ...Platform.select({
                            ios: {
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0,
                                shadowRadius: 0,
                            },
                            android: {
                                elevation: 0,
                            },
                        }),
                    },
                    tabBarLabelStyle: { 
                        opacity: 0,
                    },
                    tabBarItemStyle: {
                        paddingVertical: 0,
                        marginHorizontal: 0,
                        backgroundColor: 'transparent',
                    },
                    headerStyle: {
                        backgroundColor: '#EEDEDE',
                        
                        elevation: 0,
                        height: Platform.OS === 'ios' ? 90 : 50,
                        shadowColor: 'transparent',
                        shadowOpacity: 0,
                        borderBottomWidth: 0,
                    },
                    // headerBackground: () => (
                    //     <BlurView 
                    //         intensity={80}
                    //         tint="light"
                    //         style={{
                    //             flex: 1,
                    //             backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    //             borderBottomWidth: 1,
                    //             borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                    //         }}
                    //     />
                    // ),
                    headerTitleStyle: {
                        opacity: 0,
                    },
                    headerTitle: ' ',
                    headerTintColor: 'transparent',
                }}
            >
                <Tabs.Screen 
                    name="index" 
                    options={{ 
                        headerTitle: ' ', // Single space instead of empty
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon 
                                name="home" 
                                color={color} 
                                focused={focused} 
                                size={20}
                            />
                        ),
                    }} 
                />
                

                <Tabs.Screen 
                    name="Analytics" 
                    options={{ 
                        // Single space instead of empty
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon 
                                name="trophy" 
                                color={color} 
                                focused={focused} 
                                size={20}
                            />
                        ),
                    }} 
                />
                        <Tabs.Screen 
                            name="AddHabit" 
                            options={{ 
                                headerTitle: ' ',
                                tabBarIcon: ({ color, focused }) => (
                                    <View style={{ 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        top: -25 
                                    }}>
                                        <View 
                                            style={{
                                                width: 70,
                                                height: 70,
                                                borderRadius: 35,
                                                // backgroundColor: focused ? '#FF6B35' : '#F5550A',
                                                backgroundColor: focused ? '#E9950E' : '#E9950E',
                                                borderWidth: 3,
                                                borderColor: focused ? 'black' : 'rgba(255, 255, 255, 0.4)',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                ...Platform.select({
                                                    ios: {
                                                        shadowColor: '#000',
                                                        shadowOffset: { width: 0, height: 12 },
                                                        shadowOpacity: 0.25,
                                                        shadowRadius: 20,
                                                    },
                                                    android: {
                                                        elevation: 16,
                                                    },
                                                }),
                                            }}
                                        >
                                            <FontAwesome5 
                                                name="plus" 
                                                size={26} 
                                                color= {focused ? "black" : "#ffffff"}
                                                style={{
                                                    textShadowColor: 'rgba(0,0,0,0.4)',
                                                    textShadowOffset: { width: 0, height: 2 },
                                                    textShadowRadius: 4,
                                                }}
                                            />
                                        </View>
                                    </View>
                                ),
                            }} 
                        />
                        <Tabs.Screen 
                            name="AllHabits" 
                            options={{ 
                                headerTitle: ' ', // Single space instead of empty
                        tabBarIcon: ({ color, focused }) => (
                            
                            <TabIcon 
                                name="list" 
                                color={color} 
                                focused={focused} 
                                size={20}
                            />
                        ),
                    }} />

                                    <Tabs.Screen 
                    name="UserScreen" 
                    options={{ 
                        headerTitle: ' ', // Single space instead of empty
                        tabBarIcon: ({ color, focused }) => (
                            <TabIcon 
                                name="user" 
                                color={color} 
                                focused={focused} 
                                size={20}
                            />
                        ),
                    }} 
                />

            </Tabs>

            
            
            
        </>
    );
}
