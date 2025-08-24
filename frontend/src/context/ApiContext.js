import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  properties: [],
  faqEntries: [],
  loading: false,
  error: null,
};

// Action types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USER: 'SET_USER',
  SET_PROPERTIES: 'SET_PROPERTIES',
  SET_FAQ: 'SET_FAQ',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
const apiReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ACTIONS.SET_USER:
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload,
        error: null 
      };
    case ACTIONS.SET_PROPERTIES:
      return { ...state, properties: action.payload, loading: false };
    case ACTIONS.SET_FAQ:
      return { ...state, faqEntries: action.payload, loading: false };
    case ACTIONS.LOGOUT:
      return { ...state, user: null, isAuthenticated: false };
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

// Create context
const ApiContext = createContext();

// Provider component
export const ApiProvider = ({ children }) => {
  const [state, dispatch] = useReducer(apiReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: ACTIONS.SET_USER, payload: user });
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // API actions
  const actions = {
    // Set loading state
    setLoading: (loading) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
    },

    // Clear errors
    clearError: () => {
      dispatch({ type: ACTIONS.CLEAR_ERROR });
    },

    // User registration
    register: async (userData) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        const result = await api.auth.register(userData);
        dispatch({ type: ACTIONS.SET_ERROR, payload: null });
        return result;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // User login
    login: async (credentials) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        const result = await api.auth.login(credentials);
        
        // Save JWT token and user type for navigation
        console.log('Login successful, storing token:', result.access_token);
        console.log('User data:', result.user);
        
        localStorage.setItem('accessToken', result.access_token);
        localStorage.setItem('userType', result.user.user_type);
        
        console.log('localStorage set - accessToken:', localStorage.getItem('accessToken'));
        console.log('localStorage set - userType:', localStorage.getItem('userType'));
        
        dispatch({ type: ACTIONS.SET_USER, payload: result.user });
        
        return result.user;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // User logout
    logout: (redirectTo = '/') => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userType');
      dispatch({ type: ACTIONS.LOGOUT });
      
      // Redirect to specified path (defaults to landing page)
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo;
      }
    },

    // Fetch properties
    fetchProperties: async () => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        const result = await api.properties.getAll();
        dispatch({ type: ACTIONS.SET_PROPERTIES, payload: result.properties });
        return result;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Fetch FAQ entries
    fetchFAQ: async () => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        const result = await api.faq.getAll();
        dispatch({ type: ACTIONS.SET_FAQ, payload: result.faq_entries });
        return result;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Get property by ID
    getProperty: async (id) => {
      try {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });
        const result = await api.properties.getById(id);
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        return result;
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    // Get current user's name
    getUserName: () => {
      try {
        // Get user name from context state instead of localStorage
        if (state.user && state.user.full_name) {
          return state.user.full_name;
        }
        return 'User';
      } catch (error) {
        console.error('Error getting user name:', error);
        return 'User';
      }
    },
  };

  const value = {
    ...state,
    ...actions,
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

// Custom hook to use the context
export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};
