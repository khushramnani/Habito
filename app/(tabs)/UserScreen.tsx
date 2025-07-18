import { FontAwesome5 } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/themeContext';
import { useUserProfile } from '../../contexts/userProfileContext';
import { useAuth } from '../context/authContext';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    user: any;
    onSave: (name: string, avatar: string) => void;
}

const defaultAvatars = [
    { id: 'bear', icon: 'user-circle', color: '#FF6B6B' },
    { id: 'cat', icon: 'cat', color: '#4ECDC4' },
    { id: 'dog', icon: 'dog', color: '#45B7D1' },
    { id: 'dragon', icon: 'dragon', color: '#96CEB4' },
    { id: 'frog', icon: 'frog', color: '#FFEAA7' },
    { id: 'hippo', icon: 'hippo', color: '#DDA0DD' },
    { id: 'horse', icon: 'horse', color: '#98D8C8' },
    { id: 'kiwi', icon: 'kiwi-bird', color: '#F7DC6F' },
    { id: 'otter', icon: 'otter', color: '#BB8FCE' },
    { id: 'spider', icon: 'spider', color: '#85C1E9' },
    { id: 'user', icon: 'user', color: '#F8C471' },
    { id: 'robot', icon: 'robot', color: '#82E0AA' }
];

const EditProfileModal = ({ visible, onClose, user, onSave }: EditProfileModalProps) => {
    const [name, setName] = useState(user?.name || '');
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'bear');
    const [saving, setSaving] = useState(false);
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    // Sync state when user prop changes
    React.useEffect(() => {
        // console.log('EditProfileModal - user prop changed:', user);
        setName(user?.name || '');
        setSelectedAvatar(user?.avatar || 'bear');
    }, [user]);

    const handleSave = async () => {
        // console.log('handleSave called with:', { name: name.trim(), selectedAvatar });
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }
        
        setSaving(true);
        try {
            // console.log('Calling onSave...');
            await onSave(name.trim(), selectedAvatar);
            // console.log('onSave completed successfully');
            onClose();
        } catch (error) {
            // console.error('Error in handleSave:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const selectedAvatarData = defaultAvatars.find(avatar => avatar.id === selectedAvatar) || defaultAvatars[0];

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >

            <View style={{ paddingBottom: insets.bottom , paddingTop: insets.top + 15 }} className={`flex-1  ${isDark ? 'bg-gray-900' : 'bg-[#EEDEDE]'}`}>
                {/* Header */}
                <View className={`${isDark ? 'bg-gray-800/95' : 'bg-orange-300/80'} px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-800/50'}`}>
                    <View className="flex-row items-center justify-between">
                        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Edit Profile
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

                <ScrollView className="flex-1 px-6 py-6">
                    {/* Current Avatar Preview */}
                    <View className="items-center mb-8">
                        <View 
                            className="w-32 h-32 rounded-full items-center justify-center mb-4"
                            style={{ backgroundColor: selectedAvatarData.color }}
                        >
                            <FontAwesome5 name={selectedAvatarData.icon as any} size={64} color="white" />
                        </View>
                        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Choose Your Avatar
                        </Text>
                        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Select a cute avatar that represents you
                        </Text>
                    </View>

                    {/* Avatar Selection Grid */}
                    <View className="mb-8">
                        <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Available Avatars
                        </Text>
                        <View className="flex-row flex-wrap gap-3 justify-center">
                            {defaultAvatars.map((avatar) => (
                                <TouchableOpacity
                                    key={avatar.id}
                                    onPress={() => {
                                        // console.log('Avatar selected:', avatar.id);
                                        setSelectedAvatar(avatar.id);
                                    }}
                                    className="w-20 h-20 rounded-full items-center justify-center"
                                    style={{ 
                                        backgroundColor: avatar.color,
                                        borderWidth: selectedAvatar === avatar.id ? 3 : 0,
                                        borderColor: selectedAvatar === avatar.id ? '#3B82F6' : 'transparent'
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <FontAwesome5 name={avatar.icon as any} size={32} color="white" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Name Input */}
                    <View className="mb-6">
                        <Text className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Full Name
                        </Text>
                        <TextInput
                            className={`${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-orange-300/80 border-gray-800/50 text-gray-900'} border rounded-lg px-4 py-3 text-base`}
                            placeholder="Enter your name"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleSave}
                        className={`${saving ? 'bg-gray-400' : 'bg-blue-500'} rounded-lg py-4 mb-6`}
                        activeOpacity={0.8}
                        disabled={saving}
                    >
                        <Text className="text-white text-lg font-semibold text-center">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </Modal>
    );
};

const UserScreen = () => {
    const { user, signOut } = useAuth();
    const { userProfile, loading, updateProfile } = useUserProfile();
    const { isDark, themeMode, setThemeMode } = useTheme();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [themeChanging, setThemeChanging] = useState(false);
    const insets = useSafeAreaInsets();

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Sign Out", 
                    style: "destructive", 
                    onPress: signOut
                }
            ]
        );
    };

    const handleEditProfile = async (name: string, avatar: string) => {
        // console.log('handleEditProfile called with:', { name, avatar });
        // console.log('Current userProfile:', userProfile);
        try {
            // console.log('Calling updateProfile...');
            await updateProfile({ name, avatar });
            // console.log('updateProfile completed successfully');
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error) {
            // console.error('Error in handleEditProfile:', error);
            throw error; // Let the modal handle the error
        }
    };

    const handleNotificationToggle = async (value: boolean) => {
        try {
            await updateProfile({ notificationsEnabled: value });
        } catch (error) {
            Alert.alert('Error', 'Failed to update notification settings');
        }
    };

    const handleThemeChange = async (mode: 'system' | 'light' | 'dark') => {
        // console.log('handleThemeChange called with:', mode);
        // console.log('Current userProfile.themeMode:', userProfile?.themeMode);
        
        // Show loading state briefly for visual feedback
        setThemeChanging(true);
        
        try {
            // console.log('Updating profile with themeMode...');
            await updateProfile({ 
                themeMode: mode,
                // Keep darkModeEnabled for backward compatibility
                darkModeEnabled: mode === 'dark' || (mode === 'system' && undefined)
            });
            // console.log('Profile updated, now calling setThemeMode...');
            setThemeMode(mode);
            // console.log('setThemeMode called');
            
            // Brief delay for smooth transition
            setTimeout(() => {
                setThemeChanging(false);
            }, 300);
        } catch (error) {
            // console.error('Error in handleThemeChange:', error);
            setThemeChanging(false);
            Alert.alert('Error', 'Failed to update theme setting');
        }
    };

    const ThemeSelector = () => {
        const themeOptions = [
            { id: 'system', label: 'System Default', icon: 'mobile-alt' },
            { id: 'light', label: 'Light', icon: 'sun' },
            { id: 'dark', label: 'Dark', icon: 'moon' }
        ];

        return (
            <View className="mb-6">
                <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Theme Preference
                </Text>
                <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#E5DDD0] border-gray-800/50'} rounded-3xl border overflow-hidden`}>
                    {themeOptions.map((option, index) => (
                        <TouchableOpacity
                            key={option.id}
                            onPress={() => handleThemeChange(option.id as 'system' | 'light' | 'dark')}
                            className={`flex-row items-center p-4 ${index !== themeOptions.length - 1 ? 'border-b border-gray-700/20 dark:border-gray-200/20' : ''}`}
                            activeOpacity={0.7}
                        >
                            <View 
                                className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                                style={{ backgroundColor: themeMode === option.id ? '#8B5CF620' : 'transparent' }}
                            >
                                <FontAwesome5 
                                    name={option.icon as any} 
                                    size={16} 
                                    color={themeMode === option.id ? '#8B5CF6' : (isDark ? '#9CA3AF' : '#6B7280')} 
                                />
                            </View>
                            <View className="flex-1">
                                <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {option.label}
                                </Text>
                                {option.id === 'system' && (
                                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Follow your device's theme
                                    </Text>
                                )}
                            </View>
                            {themeMode === option.id && (
                                <FontAwesome5 name="check-circle" size={20} color="#8B5CF6" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
                {/* <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Current: {themeMode === 'system' ? 'System Default' : themeMode === 'light' ? 'Light' : 'Dark'} 
                    {themeMode === 'system' && ` (${isDark ? 'Dark' : 'Light'})`}
                </Text> */}
            </View>
        );
    };

    // Get user's current avatar or default to first one
    const userAvatar = userProfile?.avatar || 'bear';
    const currentAvatarData = defaultAvatars.find(avatar => avatar.id === userAvatar) || defaultAvatars[0];

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action cannot be undone. All your data will be permanently deleted.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: () => {
                        // Handle account deletion
                        // console.log('Delete account');
                    }
                }
            ]
        );
    };

    const menuItems = [
        {
            icon: 'edit',
            title: 'Edit Profile',
            subtitle: 'Update your name and avatar',
            onPress: () => setEditModalVisible(true),
            color: '#3B82F6'
        },
        {
            icon: 'bell',
            title: 'Notifications',
            subtitle: 'Manage your notification preferences',
            isSwitch: true,
            value: userProfile?.notificationsEnabled ?? true,
            onToggle: handleNotificationToggle,
            color: '#F59E0B'
        },
        {
            icon: 'chart-line',
            title: 'Export Data',
            subtitle: 'Download your habit data',
            onPress: () => Alert.alert('Export Data', 'This feature is coming soon!'),
            color: '#10B981'
        },
        {
            icon: 'life-ring',
            title: 'Help & Support',
            subtitle: 'Get help and contact support',
            onPress: () => Alert.alert('Help & Support', 'Contact us at support@habito.com'),
            color: '#06B6D4'
        },
        {
            icon: 'shield-alt',
            title: 'Privacy Policy',
            subtitle: 'View our privacy policy',
            onPress: () => Alert.alert('Privacy Policy', 'Privacy policy details here'),
            color: '#84CC16'
        }
    ];

    const dangerItems = [
        {
            icon: 'sign-out-alt',
            title: 'Sign Out',
            subtitle: 'Sign out of your account',
            onPress: handleSignOut,
            color: '#EF4444'
        },
        {
            icon: 'trash',
            title: 'Delete Account',
            subtitle: 'Permanently delete your account',
            onPress: handleDeleteAccount,
            color: '#DC2626'
        }
    ];

    if (loading) {
        return (
            <View style={{ paddingTop: insets.top + 15 }} className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-[#EEDEDE]'}`}>
                <View className="items-center">
                    <View className={`w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4`} />
                    <Text className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Loading profile...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={{ paddingTop: insets.top + 15, paddingBottom: insets.bottom + 80 }} className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-[#EEDEDE]'}`}>
            {/* Theme changing overlay */}
            {themeChanging && (
                <View className="absolute inset-0 z-50 bg-black/20 flex items-center justify-center">
                    <View className={`${isDark ? 'bg-gray-800' : 'bg-white'} px-6 py-4 rounded-2xl shadow-lg flex-row items-center`}>
                        <View className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
                        <Text className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>
                            Applying theme...
                        </Text>
                    </View>
                </View>
            )}
            
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View className="px-6 py-6">
                    <Text className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                        Profile
                    </Text>
                    <Text className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Manage your account settings
                    </Text>
                </View>

                {/* Profile Card */}
                <View className="px-6 mb-6">
                    <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-orange-300 border-gray-800/50'} rounded-3xl p-6 border shadow-sm`}>
                        <View className="flex-row items-center">
                            <View 
                                className="w-20 h-20 rounded-full items-center border border-gray-800/30 dark:border-gray-300 shadow-md justify-center mr-4"
                                style={{ backgroundColor: currentAvatarData.color }}
                            >
                                <FontAwesome5 name={currentAvatarData.icon as any} size={32} color="white" />
                            </View>
                            <View className="flex-1">
                                <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>
                                    {userProfile?.name || user?.name || 'User'}
                                </Text>
                                <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                                    {userProfile?.email || user?.email}
                                </Text>
                                <View className="flex-row items-center">
                                    <View className="bg-green-500 px-3 py-1 rounded-full">
                                        <Text className="text-white text-sm font-medium">Active</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Settings */}
                <View className="px-6 mb-6">
                    <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Settings
                    </Text>
                    <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#E5DDD0] border-gray-800/50'} rounded-3xl border overflow-hidden`}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={item.onPress}
                                className={`flex-row items-center p-4 ${index !== menuItems.length - 1 ? 'border-b border-gray-700/20 dark:border-gray-200/20' : ''}`}
                                activeOpacity={0.7}
                                disabled={item.isSwitch}
                            >
                                <View 
                                    className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                                    style={{ backgroundColor: `${item.color}20` }}
                                >
                                    <FontAwesome5 name={item.icon as any} size={16} color={item.color} />
                                </View>
                                <View className="flex-1">
                                    <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {item.title}
                                    </Text>
                                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {item.subtitle}
                                    </Text>
                                </View>
                                {item.isSwitch ? (
                                    <Switch
                                        value={item.value}
                                        onValueChange={item.onToggle}
                                        trackColor={{ false: '#767577', true: item.color }}
                                        thumbColor={item.value ? '#fff' : '#f4f3f4'}
                                    />
                                ) : (
                                    <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Theme Selector */}
                <View className="px-6 mb-6">
                    <ThemeSelector />
                </View>

                {/* Danger Zone */}
                <View className="px-6 mb-6">
                    <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Account Actions
                    </Text>
                    <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-red-200/80 border-red-800/50'} rounded-3xl border overflow-hidden`}>
                        {dangerItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={item.onPress}
                                className={`flex-row items-center p-4 ${index !== dangerItems.length - 1 ? 'border-b border-gray-200/20' : ''}`}
                                activeOpacity={0.7}
                            >
                                <View 
                                    className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                                    style={{ backgroundColor: `${item.color}20` }}
                                >
                                    <FontAwesome5 name={item.icon as any} size={16} color={item.color} />
                                </View>
                                <View className="flex-1">
                                    <Text className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {item.title}
                                    </Text>
                                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {item.subtitle}
                                    </Text>
                                </View>
                                <FontAwesome5 name="chevron-right" size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* App Version */}
                <View className="px-6 mb-6">
                    <Text className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Habito v1.0.0
                    </Text>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <EditProfileModal
                visible={editModalVisible}
                onClose={() => setEditModalVisible(false)}
                user={userProfile || user}
                onSave={handleEditProfile}
            />
        </View>
    );
};

export default UserScreen;
