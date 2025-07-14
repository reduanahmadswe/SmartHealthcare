import React, { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";

// Create context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Attach token to every request
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Check token validity on mount/refresh
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.data.user);
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };
    checkToken();
    // eslint-disable-next-line
  }, []);

  // Login
  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", credentials);
      const { user, token: jwt } = res.data.data;
      setUser(user);
      setToken(jwt);
      localStorage.setItem("token", jwt);
      api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
      toast.success(`Welcome, ${user.firstName}!`);
      // Redirect based on role or previous location
      const from =
        location.state?.from?.pathname || getDashboardPath(user.role);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    navigate("/login", { replace: true });
  };

  // Register
  const registerUser = async (data) => {
    setLoading(true);
    try {
      await api.post("/auth/register", data);
      toast.success(
        "Registration successful! Please check your email to verify your account."
      );
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper: get dashboard path by role
  const getDashboardPath = (role) => {
    if (role === "admin") return "/dashboard/admin";
    if (role === "doctor") return "/dashboard/doctor";
    return "/dashboard/patient";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        getDashboardPath,
        register: registerUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
