import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import "../global.css";
import AuthProvider, { useAuth } from "./context/authContext";

function RouteGuard({children}: {children: React.ReactNode}) {
  const { user , isAuthenticated } = useAuth();
  const Segments = useSegments();
  const isAuthGroup = Segments[0] === "auth";
  const router = useRouter();
  
  useEffect(() => {
    setTimeout(() => {
      if (!user && !isAuthGroup && !isAuthenticated) {
        router.replace("/auth");
    } else if (user && isAuthGroup && isAuthenticated) {
        router.replace("/");
      }
    }, 0);

  }, [user]);

  return <>{children}</>;

}


export default function RootLayout() {
  return (
    <>
    <AuthProvider>
    <RouteGuard>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
</Stack>
</RouteGuard>
</AuthProvider>
    </>
  );
}
