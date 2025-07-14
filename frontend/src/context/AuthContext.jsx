import React, { createContext, useContext, useEffect, useReducer } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Set up axios interceptor for authentication
  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [state.token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Set a timeout to prevent hanging if backend is not available
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await api.get("/auth/me", {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              user: response.data.user,
              token,
            },
          });
        } catch (error) {
          console.log("Auth check failed:", error.message);
          localStorage.removeItem("token");
          dispatch({ type: "LOGOUT" });
        }
      } else {
        dispatch({ type: "LOGOUT" });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const response = await api.post("/auth/login", credentials);
      const { user, token } = response.data.data;

      localStorage.setItem("token", token);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token },
      });

      toast.success(`Welcome back, ${user.firstName}!`);

      // Redirect based on role
      if (user.role === "admin") {
        navigate("/dashboard/admin");
      } else if (user.role === "doctor") {
        navigate("/dashboard/doctor");
      } else {
        navigate("/dashboard/patient");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      dispatch({ type: "LOGIN_FAILURE", payload: message });
      toast.error(message);
    }
  };

  const register = async (userData) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const response = await api.post("/auth/register", userData);
      const { user, token } = response.data.data;

      localStorage.setItem("token", token);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token },
      });

      toast.success(`Welcome to Smart Healthcare, ${user.firstName}!`);

      // Redirect based on role
      if (user.role === "admin") {
        navigate("/dashboard/admin");
      } else if (user.role === "doctor") {
        navigate("/dashboard/doctor");
      } else {
        navigate("/dashboard/patient");
      }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      dispatch({ type: "LOGIN_FAILURE", payload: message });
      toast.error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    dispatch({ type: "LOGOUT" });
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const updateUser = (userData) => {
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
