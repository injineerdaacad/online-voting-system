import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import api from "../utils/axios";
import { AxiosError } from "axios";
import notificationService from "../services/notificationService";
import { USER_ROLES } from "../utils/constants";

interface User {
  _id?: string;
  id?: string;
  username?: string;
  full_name?: string;
  email: string;
  phone?: string;
  role: string;
  faculty?: string;
  is_login?: boolean;
  createdAt?: string;
  last_login?: string;
  last_logout?: string;
  attempt_login_time?: string;
  faculty_id?: {
    _id: string;
    name: string;
    code: string;
  } | null;
  department?: {
    _id: string;
    name: string;
    code: string;
  } | null;
  created_by?: {
    username?: string;
    email?: string;
  };
  photo_url?: string;
  photo_id?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (loginKey: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  updateUser: (userData: User) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
          setUser(null);
          localStorage.removeItem("token");
          setLoading(false);
          return;
        }
        
        if (payload.role === USER_ROLES.STUDENT || payload.role === 'Student') {
          setUser(null);
          localStorage.removeItem("token");
          setLoading(false);
          return;
        }
        
        try {
          const response = await api.get("/api/users/profile");
          if (response.data && response.data.user) {
            const userData = response.data.user;
            
            if (userData.role === USER_ROLES.STUDENT || userData.role === 'Student') {
              setUser(null);
              localStorage.removeItem("token");
              setLoading(false);
              return;
            }
            
            setUser(userData);
          } else {
            setUser(payload);
          }
        } catch (profileError) {
          setUser(payload);
        }
      } catch (jwtError) {
        setUser(null);
        localStorage.removeItem("token");
      }
    } catch (error) {
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (loginKey: string, password: string) => {
    try {
      const isEmail = loginKey.includes('@');
      
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error("API URL is not configured. Please check your environment variables.");
      }
      
      const response = await api.post("/api/auth/admin/login", {
        [isEmail ? 'email' : 'username']: loginKey,
        password,
      });
      
      if (!response.data.user && !response.data.token) {
        throw new Error("Invalid response format from server");
      }
      
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      
      const userData = response.data.user;
      
      if (userData.role === USER_ROLES.STUDENT || userData.role === 'Student') {
        setUser(null);
        localStorage.removeItem("token");
        throw new Error("Students can only login via mobile application. Web access is restricted to administrators.");
      }
      
      if (userData.id && !userData._id) {
        userData._id = userData.id;
      }
      
      setUser(userData);
      
      return response.data;
    } catch (error) {
      setUser(null);
      localStorage.removeItem("token");
      
      if (error instanceof AxiosError) {
        if (error.response) {
          const errorMessage = error.response.data?.error || error.response.data?.message || "An error occurred";
          const status = error.response.status;
          
          if (status === 403 && errorMessage.includes('CORS')) {
            throw new Error("CORS error: Frontend origin not allowed. Please check backend CORS configuration.");
          }
          
          throw new Error(errorMessage);
        } else if (error.request) {
          const apiUrl = import.meta.env.VITE_API_URL || 'not configured';
          console.error('❌ AUTH CONTEXT - Network error:', {
            apiUrl,
            message: error.message,
            code: error.code,
          });
          
          if (error.code === 'ERR_NETWORK') {
            throw new Error(`Cannot connect to server. Please check if the backend is running at ${apiUrl}`);
          } else if (error.code === 'ECONNREFUSED') {
            throw new Error(`Connection refused. The backend server may be down or unreachable at ${apiUrl}`);
          } else if (error.code === 'ETIMEDOUT') {
            throw new Error(`Request timed out. The server at ${apiUrl} is not responding.`);
          } else {
            throw new Error(`Network error: Unable to reach server at ${apiUrl}. ${error.message || 'Please check your connection and server status.'}`);
          }
        } else {
          throw new Error(`Request setup error: ${error.message || 'Please check your configuration.'}`);
        }
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error("Login failed. Please try again.");
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/admin/logout");
    } catch (error) {
    } finally {
      notificationService.disconnect();
      setUser(null);
      localStorage.removeItem("token");
      window.location.replace("/signin");
    }
  };

  const updateUser = useCallback(
    (userData: User) => {
      setUser(userData);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
        updateUser,
        checkAuth,
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-screen text-lg">
          <div className="flex flex-col items-center justify-center min-h-[180px] w-full">
            <svg
              className="animate-spin mb-3 text-brand-500"
              width="40"
              height="40"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="10"
                cy="10"
                r="8"
                stroke="#465FFF"
                strokeWidth="3"
                strokeDasharray="32"
                strokeDashoffset="24"
                fill="none"
              />
            </svg>
            <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              Loading...
            </span>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}