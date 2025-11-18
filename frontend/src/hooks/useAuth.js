import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000";

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [currentUsername, setCurrentUsername] = useState("");

  // Auth form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (response.ok) {
        const user = await response.json();
        setCurrentUserId(user.id);
        setCurrentUsername(user.username);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      localStorage.removeItem("token");
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setAuthError("");

    try {

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        await fetchCurrentUser(data.access_token);
        setShowAuthModal(false);
        setEmail("");
        setPassword("");
        fetchPosts();
      } else {
        const errorData = await response.json();
        if (typeof errorData.detail === "string") {
          setAuthError(errorData.detail);
        } else {
          setAuthError("Login failed");
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
      setAuthError("Network error. Please try again.");
    }
  };

  const register = async (e) => {
    e.preventDefault();
    setAuthError("");

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        const formData = new URLSearchParams();
        formData.append("email", email);
        formData.append("password", password);

        const loginResponse = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (loginResponse.ok) {
          const data = await loginResponse.json();
          localStorage.setItem("token", data.access_token);
          await fetchCurrentUser(data.access_token);
          setShowAuthModal(false);
          setUsername("");
          setEmail("");
          setPassword("");
          fetchPosts();
        } else {
          const error = await loginResponse.json();
          if (typeof error.detail === "string") {
            setAuthError(error.detail);
          } else {
            setAuthError("Login after registration failed");
          }
        }
      } else {
        const error = await response.json();
        if (typeof error.detail === "string") {
          setAuthError(error.detail);
        } else {
          setAuthError("Registration failed");
        }
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setAuthError("Network error. Please try again.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setCurrentUsername("");
    setCurrentUserId(null);
    fetchPosts();
  };

  return {
    isAuthenticated,
    currentUserId,
    currentUsername,
    login,
    register,
    logout
  };
}