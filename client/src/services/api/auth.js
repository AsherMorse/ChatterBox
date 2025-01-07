import api from './api';

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
};

export const register = async (email, password, username) => {
    const response = await api.post('/auth/register', { email, password, username });
    const { token, user } = response.data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
};

export const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
};

export const getToken = () => {
    return localStorage.getItem('auth_token');
};

export const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = () => {
    return !!getToken();
}; 