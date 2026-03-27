import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiService from "../services/api";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isCheckingAuth: true,

  login: async (studentId, password) => {
    set({ isLoading: true });
    try {
      const data = await apiService.loginStudent(studentId, password);

      await AsyncStorage.setItem("user", JSON.stringify(data.student));
      await AsyncStorage.setItem("token", data.token);

      set({
        token: data.token,
        user: data.student,
        isLoading: false,
        isCheckingAuth: false,
      });

      return {
        success: true,
        message: "Login successful!",
      };
    } catch (error) {
      if (__DEV__) {
        console.log('AUTH STORE - Login error:', error.message);
      }
      set({ isLoading: false, isCheckingAuth: false });
      return {
        success: false,
        error: error.message || "Something went wrong!",
      };
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const token = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      if (!token || !storedUser) {
        set({
          token: null,
          user: null,
          isCheckingAuth: false,
        });
        return;
      }

      let user = null;

      try {
        user = JSON.parse(storedUser);
      } catch {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        set({
          token: null,
          user: null,
          isCheckingAuth: false,
        });
        return;
      }

      const isStudent = user?.role === "Student";
      const needsRefresh = !isStudent || !user?.student_id;
      
      if (needsRefresh) {
        try {
          const userData = await apiService.getProfile(token);
          const normalizedUser = userData.student || userData.user || userData;
          user = normalizedUser;
          await AsyncStorage.setItem("user", JSON.stringify(user));
        } catch (profileError) {
          if (!user?.student_id && isStudent) {
            console.log("Profile refresh failed and student_id missing, clearing auth:", profileError);
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("user");
            set({
              token: null,
              user: null,
              isCheckingAuth: false,
            });
            return;
          }
          console.log("Profile refresh failed, using cached data:", profileError);
        }
      }

      set({
        token,
        user,
        isCheckingAuth: false,
      });
    } catch (err) {
      console.log("Auth Check Failed", err);
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      set({
        token: null,
        user: null,
        isCheckingAuth: false,
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        try {
          await apiService.logoutStudent(token);
        } catch (apiError) {
          console.log("Error calling logout API:", apiError);
        }
      }

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      set({
        token: null,
        user: null,
        isLoading: false,
        isCheckingAuth: false,
      });

      return {
        success: true,
        message: "Logout successful!",
      };
    } catch (error) {
      console.log("Logout Failed", error);
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      set({ isLoading: false, isCheckingAuth: false });
      return {
        success: false,
        error: error.message || "Logout failed!",
      };
    }
  },

  /** Clear token and user only (no API call). Use when backend returns 401/403 Invalid token. */
  clearAuthOnly: async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    set({
      token: null,
      user: null,
      isCheckingAuth: false,
    });
  },
}));
