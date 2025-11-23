import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

const API_URL = "http://localhost:8000";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(1);
  const [currentUsername, setCurrentUsername] = useState("");

  const {data:currentUser, isLoading} = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!response.ok) {
        localStorage.removeItem("token");
        throw new Error("Not authenticated");
      };
      return await response.json();
    },
    enabled: !!localStorage.getItem("token"),
    retry: false,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (currentUser) {
      setCurrentUserId(currentUser.id);
      setCurrentUsername(currentUser.username);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      localStorage.removeItem("token");
    }
  }, [currentUser]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        
        window.location.reload();

        return { success: true };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: typeof errorData.detail === "string" ? errorData.detail : "Login failed"
        };
      }
    } catch (error) {
      console.error("Error during login:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        // Auto-login after registration
        return await login(email, password);
      } else {
        const error = await response.json();
        return {
          success: false,
          error: typeof error.detail === "string" ? error.detail : "Registration failed"
        };
      }
    } catch (error) {
      console.error("Error during registration:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return {
    isAuthenticated,
    currentUserId,
    currentUsername,
    login,
    register,
    logout
  };
};