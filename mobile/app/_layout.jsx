import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useAuthStore } from "../store/authStore";
import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import apiService from "../services/api";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { checkAuth, user, token, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    apiService.setOnUnauthorized(() => {
      useAuthStore.getState().clearAuthOnly();
    });
  }, [checkAuth]);

  const [fontsLoaded, fontError] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  useEffect(() => {
    const initApp = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.log("Error checking auth:", error);
      }
    };
    initApp();
  }, [checkAuth]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!fontsLoaded) return;
    if (isCheckingAuth) return;

    const inAuthScreen = segments[0] === "(auth)";
    const isSignedIn = user && token;

    if (!isSignedIn && !inAuthScreen) {
      router.replace("/(auth)");
    } else if (isSignedIn && inAuthScreen) {
      router.replace("/(tabs)");
    }
  }, [user, token, segments, isCheckingAuth, fontsLoaded, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeScreen>
          {(!fontsLoaded && !fontError) || isCheckingAuth ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              {isCheckingAuth ? (
                <ActivityIndicator size="large" color="#4CAF50" />
              ) : (
                <Text>Loading...</Text>
              )}
            </View>
          ) : (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
            </Stack>
          )}
        </SafeScreen>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
