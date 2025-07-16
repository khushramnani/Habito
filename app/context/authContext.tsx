import * as WebBrowser from 'expo-web-browser';
import { createContext, useContext, useEffect, useState } from 'react';
import { ID, Models, OAuthProvider } from 'react-native-appwrite';
import { account, database } from '../../lib/appwrite';

// Complete the auth session for OAuth
WebBrowser.maybeCompleteAuthSession();

type AuthState = 'pending' | 'authenticated' | 'unauthenticated';

type AuthContextType = {
    user: Models.User<Models.Preferences> | null;
    signIn: (email: string, password: string) => Promise<string | null>;
    signUp: (email: string, password: string, confirmPassword: string) => Promise<string | null>;
    signOut: () => Promise<void>;
    signInWithGoogle: () => Promise<string | null>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [authState, setAuthState] = useState<AuthState>('pending');

    useEffect(() => {
        getUser();
    }, [])

    const getUser = async () => {
        try {
            const session = await account.get()
            setUser(session)
            setIsAuthenticated(true);
        } catch (error) {
            console.log('[getUser error]', error);
            setUser(null)
            setIsAuthenticated(false);
        }
    }

    const signIn = async (email: string, password: string) => {
        try {
            await account.createEmailPasswordSession(email, password);
            const userData = await account.get();
            setUser(userData);
            setIsAuthenticated(true);
            return null;
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error signing in:', error);
                return error.message;
            }
            setIsAuthenticated(false)
            return 'Error signing in';
        }
    };

    const signUp = async (email: string, password: string, confirmPassword: string) => {
        try {
            if (password !== confirmPassword) {
                return "Passwords do not match";
            }

            await account.create(ID.unique(), email, password);
            await account.createEmailPasswordSession(email, password);
            const userData = await account.get();
            setUser(userData);
            setIsAuthenticated(true);
            
            await database.createDocument(
                process.env.EXPO_PUBLIC_APPWRITE_DB_ID!,
                process.env.EXPO_PUBLIC_USER_STREAK_COLLECTION_ID!,
                ID.unique(),
                {
                    userId: userData.$id,
                    currentStreak: 0,
                    longestStreak: 0,
                    lastStreakDate: '',
                    totalHabitsCompleted: 0,
                    streakFrozenDays: [],
                }
            );
            return null;
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error signing up:', error);
                return error.message;
            }
            return 'Error signing up';
        }
    };

    const signInWithGoogle = async (): Promise<string | null> => {
        try {
            // Use your existing Appwrite scheme
            const redirectScheme = 'appwrite-callback-686d371300181ce0c5d2://';
            
            console.log('Redirect URI:', redirectScheme);

            // Create OAuth2 URL
            const url = account.createOAuth2Token(OAuthProvider.Google, redirectScheme);
            
            if (!url) {
                return 'Failed to create OAuth URL';
            }

            // Open auth session
            const result = await WebBrowser.openAuthSessionAsync(url.href, redirectScheme);
            
            if (result.type === 'success' && result.url) {
                const resultUrl = new URL(result.url);
                const secret = resultUrl.searchParams.get('secret');
                const userId = resultUrl.searchParams.get('userId');
                
                if (!secret || !userId) {
                    return 'Failed to get authentication tokens';
                }

                // Create session with the tokens
                await account.createSession(userId, secret);
                
                // Get user data
                const userData = await account.get();
                setUser(userData);
                setIsAuthenticated(true);

                // Check if user document exists, if not create it
                try {
                    await database.createDocument(
                        process.env.EXPO_PUBLIC_APPWRITE_DB_ID!,
                        process.env.EXPO_PUBLIC_USER_STREAK_COLLECTION_ID!,
                        ID.unique(),
                        {
                            userId: userData.$id,
                            currentStreak: 0,
                            longestStreak: 0,
                            lastStreakDate: '',
                            totalHabitsCompleted: 0,
                            streakFrozenDays: [],
                        }
                    );
                } catch (docError) {
                    // Document might already exist, that's okay
                    console.log('User document might already exist:', docError);
                }

                return null; // Success
            } else if (result.type === 'cancel') {
                return 'Authentication cancelled';
            } else {
                return 'Authentication failed';
            }
        } catch (error) {
            console.error('Google sign in error:', error);
            if (error instanceof Error) {
                return error.message;
            }
            return 'Google sign in failed';
        }
    };

    const signOut = async () => {
        try {
            await account.deleteSession('current');
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, signIn, signUp, signOut, signInWithGoogle, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}