// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    registerAPI,
    loginAPI,
    logoutAPI,
    getCurrentUserAPI,
} from '../services/apiService';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// Helper function to normalize user data from API
const normalizeUserData = (apiUser) => {
    if (!apiUser) return null;
    // Ensure 'id' property exists, using 'apiUser.id' or 'apiUser._id'
    const normalized = { ...apiUser, id: apiUser.id || apiUser._id };
    // console.log('[AuthContext] Normalized user data:', normalized); // For debugging
    return normalized;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true); // 用于初次加载时检查用户状态
    const [error, setError] = useState(null); // 用于存储认证相关的错误信息

    const fetchCurrentUser = useCallback(async (existingToken) => { // Pass token to avoid race condition with state
        setIsLoading(true);
        setError(null);
        const tokenToUse = existingToken || localStorage.getItem('authToken'); // Use passed token or from localStorage

        if (!tokenToUse) {
            setUser(null);
            setToken(null);
            setIsLoading(false);
            // console.log('[AuthContext] fetchCurrentUser: No token, user set to null.');
            return null; // Return null if no user
        }
        try {
            // console.log("[AuthContext] Attempting to fetch current user with token:", tokenToUse);
            // getCurrentUserAPI should ideally use the token from apiService's headers
            const userDataFromApi = await getCurrentUserAPI(); 
            
            if (userDataFromApi) {
                const normalizedUser = normalizeUserData(userDataFromApi);
                setUser(normalizedUser);
                setToken(tokenToUse); // Ensure token state is also in sync
                // console.log("[AuthContext] Current user fetched and normalized:", normalizedUser);
                return normalizedUser; // Return the fetched user
            } 
            // API returned null or invalid data for a valid token (should ideally not happen)
            // console.warn("[AuthContext] getCurrentUserAPI returned falsy data with a token.");
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken');
            return null;
            
        } catch (err) {
            console.error("[AuthContext] Failed to fetch current user:", err);
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken'); 
            // setError(err.message || "Failed to verify user session."); 
            return null; // Return null on error
        } finally {
            setIsLoading(false);
        }
    }, []); // Removed setToken from dependencies as it's managed with tokenToUse

    useEffect(() => {
        // console.log('[AuthContext] Initial useEffect running fetchCurrentUser.');
        fetchCurrentUser();
    }, [fetchCurrentUser]); // fetchCurrentUser is stable due to useCallback

    const login = async (username, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await loginAPI({ username, password });
            if (response.token) {
                localStorage.setItem('authToken', response.token);
                setToken(response.token); // Set token state
                
                let loggedInUser;
                if (response.user) {
                    loggedInUser = normalizeUserData(response.user);
                    setUser(loggedInUser);
                    // console.log('[AuthContext] User set from login response.user:', loggedInUser);
                } else {
                    // console.log('[AuthContext] Login response.user missing, calling fetchCurrentUser.');
                    // Pass the new token to fetchCurrentUser directly
                    loggedInUser = await fetchCurrentUser(response.token); 
                }
                return loggedInUser; // Return the (potentially fetched and) normalized user
            }
            // Should not reach here if token is expected
            throw new Error("Login response did not include a token."); 
        } catch (err) {
            console.error("[AuthContext] Login failed:", err);
            setError(err.response?.data?.msg || err.message || "Login failed");
            throw err; 
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (username, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await registerAPI({ username, password });
            if (response.token) {
                localStorage.setItem('authToken', response.token);
                setToken(response.token);
                
                let registeredUser;
                if (response.user) {
                    registeredUser = normalizeUserData(response.user);
                    setUser(registeredUser);
                    // console.log('[AuthContext] User set from register response.user:', registeredUser);
                } else {
                    // console.log('[AuthContext] Register response.user missing, calling fetchCurrentUser.');
                    registeredUser = await fetchCurrentUser(response.token);
                }
                return registeredUser; // Return the (potentially fetched and) normalized user
            }
            throw new Error("Registration response did not include a token.");
        } catch (err) {
            console.error("[AuthContext] Registration failed:", err);
            setError(err.response?.data?.msg || err.message || "Registration failed");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = useCallback(async () => {
        // console.log('[AuthContext] Logging out...');
        setIsLoading(true);
        setError(null);
        try {
            // 后端logout是象征性的，主要操作在客户端
            await logoutAPI(); 
        } catch (err) {
            // 即便logout API调用失败，客户端也应继续登出流程
            console.warn("[AuthContext] Calling backend logout API failed, proceeding with client-side logout:", err);
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        setIsLoading(false);
        setError(null);
        // console.log('[AuthContext] Logout complete. User and token cleared.');
        // 通常在logout后会重定向，这可以在组件层面处理
    }, []);

    const value = {
        user,
        token,
        isAuthenticated: !!user && !!token, // 或者 !!token 也可以，但 !!user 更准确反映用户信息是否已加载
        isLoading,
        error,
        login,
        register,
        logout,
        fetchCurrentUser, // Exposing this might be useful for manual refresh
        clearError: () => setError(null) // 清除错误的方法
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 
