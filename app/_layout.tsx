import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { HabitProvider } from "../contexts/habitContext";
import { ThemeProvider } from "../contexts/themeContext";
import { UserProfileProvider } from "../contexts/userProfileContext";
import "../global.css";
import AuthProvider, { useAuth } from "./context/authContext";

function RouteGuard({children}: {children: React.ReactNode}) {
  const { user, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  const isAuthGroup = segments[0] === "auth";

  
  
  useEffect(() => {
    
    const timer = setTimeout(() => {
      // Only redirect if we have determined the auth state
      if (!isAuthenticated && !isAuthGroup && user === null) {
        // User is not authenticated and not on auth page, redirect to auth
        router.replace("/auth");
      } else if (isAuthenticated && isAuthGroup && user) {
        // User is authenticated but on auth page, redirect to main app
        router.replace("/");
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [user, isAuthenticated, isAuthGroup]);

  return <>{children}</>;
}


export default function RootLayout() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <ThemeProvider>
          <HabitProvider>
            <RouteGuard>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
              </Stack>
            </RouteGuard>
          </HabitProvider>
        </ThemeProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}
