// src/services/apiService.js
import axios from 'axios';

const API_URL = 'https://battleship-backend-2kem.onrender.com/api';

const apiClient = axios.create({
    baseURL: API_URL,
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- Auth Service ---
export const registerAPI = async (userData) => {
    const response = await apiClient.post('/users/register', userData);
    return response.data; // Expects { token, user } or similar
};

export const loginAPI = async (credentials) => {
    const response = await apiClient.post('/users/login', credentials);
    return response.data; // Expects { token, user } or similar
};

export const logoutAPI = async () => {
    // Optional: If your backend has a route to invalidate the token on the server-side.
    try {
        const response = await apiClient.post('/users/logout');
        return response.data;
    } catch (error) {
        console.warn("调用后端logout API失败:", error);
        return Promise.resolve();
    }
};

export const getCurrentUserAPI = async () => {
    // This function assumes the apiClient has an interceptor to attach the auth token.
    // It makes a request to a backend endpoint that verifies the token and returns user data.
    const response = await apiClient.get('/users/me'); // API path based on backend route
    return response.data; // Expects user object { id, username, ... }
};

// --- Game Service ---
export const createGameAPI = async (ships1Layout) => { // Expects ships1Layout: { ships: [], boardCells: [] }
    // Backend expects { ships1Layout: { ships: [], boardCells: [] } }
    // The variable ships1Layout itself is the object that contains ships and boardCells.
    const response = await apiClient.post('/games', { ships1Layout }); 
    return response.data;
};

export const getAllGamesAPI = async (params = {}) => { // params for filtering, e.g., { type: 'my_active' }
    const response = await apiClient.get('/games', { params });
    return response.data;
};

export const getGameDetailsAPI = async (gameId) => {
    const response = await apiClient.get(`/games/${gameId}`);
    return response.data;
};

// joinGameAPI needs to be updated to send P2's layout
export const joinGameAPI = async (gameId, ships2Layout) => { // Expects ships2Layout: { ships: [], boardCells: [] }
    // Backend expects PUT /api/games/:gameId/join with body { ships2Layout: { ... } }
    const response = await apiClient.put(`/games/${gameId}/join`, { ships2Layout });
    return response.data;
};

// attackAPI needs to be called with client-calculated results
export const attackAPI = async (gameId, attackData) => {
    // attackData: { targetPlayerId, coordinates, hit, sunkShipName, allPlayerShipsSunk }
    const response = await apiClient.post(`/games/${gameId}/attack`, attackData);
    return response.data;
};

export const surrenderAPI = async (gameId) => {
    const response = await apiClient.put(`/games/${gameId}/surrender`);
    return response.data;
};

export default apiClient; 
