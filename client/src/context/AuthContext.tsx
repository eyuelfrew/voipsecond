import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import baseUrl from "../util/baseUrl";
import { setupAxiosInterceptors } from "../util/axiosInterceptor";

type User = {
  _id: string;
  email: string;
  name: string;
} | null;

type AuthContextType = {
  user: User;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const base_url = baseUrl;
  const [user, setUser] = useState<User>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Setup axios interceptors on mount
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      sessionStorage.clear();
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true, state: { from: location } });
      }
    };
    
    setupAxiosInterceptors(handleUnauthorized);
  }, [navigate, location]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(
          `${base_url}/api/supervisors/check-auth`,
          { 
            withCredentials: true,
            timeout: 5000 // 5 second timeout
          }
        );
        
        // Validate response structure
        if (response.data?.data?.user) {
          setUser(response.data.data.user);
          setIsAuthenticated(true);
        } else {
          throw new Error("Invalid authentication response");
        }
      } catch (error) {
        // Clear authentication state on any error
        setUser(null);
        setIsAuthenticated(false);
        
        // Only redirect if not already on login page
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true, state: { from: location } });
        }
        
        if (error instanceof Error) {
          console.error("Authentication check failed:", error.message);
        } else {
          console.error("Authentication check failed:", String(error));
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Re-check authentication periodically (every 5 minutes)
    const authCheckInterval = setInterval(checkAuth, 5 * 60 * 1000);
    
    return () => clearInterval(authCheckInterval);
  }, [navigate, location.pathname, base_url]);

  const login = async (email: string, password: string) => {
    try {
      // Validate input
      if (!email || !password) {
        throw new Error("Email and password are required");
      }
      
      const response = await axios.post(
        `${base_url}/api/supervisors/login`,
        { email, password },
        { 
          withCredentials: true,
          timeout: 10000, // 10 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Validate response
      if (response.data.status !== "success") {
        throw new Error(response.data.message || "Login failed");
      }
      
      if (!response.data.data?.user) {
        throw new Error("Invalid login response");
      }
      
      setUser(response.data.data.user);
      setIsAuthenticated(true);
      
      // Redirect to the page they were trying to access, or dashboard
      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      // Clear any partial authentication state
      setUser(null);
      setIsAuthenticated(false);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Invalid email or password");
        } else if (error.response?.status === 429) {
          throw new Error("Too many login attempts. Please try again later.");
        } else if (error.code === 'ECONNABORTED') {
          throw new Error("Login request timed out. Please try again.");
        } else {
          throw new Error(error.response?.data?.message || "Login failed. Please try again.");
        }
      } else if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("An unexpected error occurred");
      }
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear server-side session
      await axios.post(
        `${base_url}/api/supervisors/logout`,
        {},
        { 
          withCredentials: true,
          timeout: 5000
        }
      );
    } catch (error) {
      // Log error but continue with client-side logout
      console.error("Logout request failed:", error instanceof Error ? error.message : String(error));
    } finally {
      // Always clear client-side state regardless of server response
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear any cached data
      sessionStorage.clear();
      
      // Redirect to login
      navigate("/login", { replace: true });
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};