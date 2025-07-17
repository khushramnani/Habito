import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Query } from 'react-native-appwrite';
import { useAuth } from '../app/context/authContext';
import { database } from '../lib/appwrite';

interface UserProfile {
    $id?: string;
    userId: string;
    name: string;
    avatar: string;
    email: string;
    notificationsEnabled: boolean;
    darkModeEnabled: boolean;
    themeMode?: 'system' | 'light' | 'dark';
}

interface UserProfileContextType {
    userProfile: UserProfile | null;
    loading: boolean;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    createProfile: (profileData: Omit<UserProfile, '$id' | 'userId'>) => Promise<void>;
    fetchProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

interface UserProfileProviderProps {
    children: ReactNode;
}

export function UserProfileProvider({ children }: UserProfileProviderProps) {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const DB_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID;
    const USER_PROFILE_COLLECTION_ID = process.env.EXPO_PUBLIC_USER_PROFILE_COLLECTION_ID;

    const fetchProfile = async () => {
        // console.log('fetchProfile called, user:', user);
        if (!user) {
            setUserProfile(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // console.log('Fetching profile for userId:', user.$id);
            const response = await database.listDocuments(
                DB_ID!,
                USER_PROFILE_COLLECTION_ID!,
                [Query.equal("userId", user.$id)]
            );

            // console.log('Fetch response:', response);
            if (response.documents.length > 0) {
                const profile = response.documents[0] as unknown as UserProfile;
                setUserProfile(profile);
                // console.log('Profile found:', profile);
            } else {
                // console.log('No profile found, creating default profile');
                // Create default profile if none exists
                await createDefaultProfile();
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // Create default profile on error
            await createDefaultProfile();
        } finally {
            setLoading(false);
        }
    };

    const createDefaultProfile = async () => {
        if (!user) return;

        try {
            const defaultProfile = {
                name: user.name || user.email?.split('@')[0] || 'User',
                avatar: 'bear',
                email: user.email || '',
                notificationsEnabled: true,
                darkModeEnabled: false,
                themeMode: 'system' as const,
            };

            await createProfile(defaultProfile);
        } catch (error) {
            console.error('Error creating default profile:', error);
        }
    };

    const createProfile = async (profileData: Omit<UserProfile, '$id' | 'userId'>) => {
        // console.log('createProfile called with:', profileData);
        if (!user) throw new Error('User not authenticated');

        try {
            const newProfile = {
                ...profileData,
                userId: user.$id,
            };

            // console.log('Creating profile with data:', newProfile);
            const response = await database.createDocument(
                DB_ID!,
                USER_PROFILE_COLLECTION_ID!,
                'unique()',
                newProfile
            );

            // console.log('Create response:', response);
            const createdProfile = response as unknown as UserProfile;
            setUserProfile(createdProfile);
            // console.log('Profile created and set in state:', createdProfile);
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        // console.log('updateProfile called with updates:', updates);
        // console.log('Current userProfile:', userProfile);
        // console.log('Current user:', user);
        
        if (!userProfile || !user) throw new Error('No profile to update');

        try {
            // console.log('Updating document with ID:', userProfile.$id);
            const response = await database.updateDocument(
                DB_ID!,
                USER_PROFILE_COLLECTION_ID!,
                userProfile.$id!,
                updates
            );

            // console.log('Update response:', response);
            const updatedProfile = response as unknown as UserProfile;
            setUserProfile(updatedProfile);
            // console.log('Profile updated in state:', updatedProfile);
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const value: UserProfileContextType = {
        userProfile,
        loading,
        updateProfile,
        createProfile,
        fetchProfile,
    };

    return (
        <UserProfileContext.Provider value={value}>
            {children}
        </UserProfileContext.Provider>
    );
}

export function useUserProfile() {
    const context = useContext(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
}
