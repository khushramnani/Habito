import { createContext, useContext, useEffect, useState } from 'react';
import { ID, Models } from 'react-native-appwrite';
import { account } from '../../lib/appwrite';


type AuthContextType = {
    user: Models.User<Models.Preferences> | null;
    signIn: (email: string, password: string) => Promise<string | null>;
    signUp: (email: string, password: string, confirmPassword: string) => Promise<string | null>;
    signOut: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        getUser();
    }, [])

    const getUser = async () => {
        try {
            const session = await account.get()
            setUser(session)
            setIsAuthenticated(true);
        } catch (error) {
            console.log(error);
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
            return null; // Return null on success
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
            await account.create(ID.unique(), email, password, confirmPassword);
            // After account creation, create a session
            await account.createEmailPasswordSession(email, password);
            const userData = await account.get();
            setUser(userData);
            setIsAuthenticated(true);
            return null; // Return null on success
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error signing up:', error);
                return error.message;
            }
            return 'Error signing up';
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
        <AuthContext.Provider value={{ user, signIn, signUp, signOut, isAuthenticated }}>
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
