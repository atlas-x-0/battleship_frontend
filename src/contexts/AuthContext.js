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

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true); // 用于初次加载时检查用户状态
    const [error, setError] = useState(null); // 用于存储认证相关的错误信息

    const fetchCurrentUser = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) {
            setUser(null);
            setToken(null);
            setIsLoading(false);
            return;
        }
        try {
            // console.log("Attempting to fetch current user with token...");
            const userData = await getCurrentUserAPI(); // USE the actual API call
            setUser(userData);
            setToken(storedToken);
            // console.log("Current user fetched:", userData);
        } catch (err) {
            console.error("Failed to fetch current user:", err);
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken'); 
            // setError(err.message || "Failed to verify user session."); 
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    const login = async (username, password) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await loginAPI({ username, password });
            if (response.token) {
                localStorage.setItem('authToken', response.token);
                setToken(response.token);
                if (response.user) { 
                    setUser(response.user);
                } else { 
                    await fetchCurrentUser(); 
                }
            }
            return response.user || user; // Return the user from response or newly fetched user
        } catch (err) {
            console.error("Login failed:", err);
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
                if (response.user) { 
                    setUser(response.user);
                } else { 
                    await fetchCurrentUser(); 
                }
            }
            return response.user || user; // Return the user from response or newly fetched user
        } catch (err) {
            console.error("Registration failed:", err);
            setError(err.response?.data?.msg || err.message || "Registration failed");
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 后端logout是象征性的，主要操作在客户端
            await logoutAPI(); 
        } catch (err) {
            // 即便logout API调用失败，客户端也应继续登出流程
            console.warn("调用后端logout API失败:", err);
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        setIsLoading(false);
        setError(null);
        // 通常在logout后会重定向，这可以在组件层面处理
    }, []);

    const value = {
        user,
        token,
        isAuthenticated: !!user, // 或者 !!token 也可以，但 !!user 更准确反映用户信息是否已加载
        isLoading,
        error,
        login,
        register,
        logout,
        fetchCurrentUser,
        clearError: () => setError(null) // 清除错误的方法
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 
