import api from './api';

export const updatePresence = async (presence) => {
    const response = await api.patch('/user-status/presence', { presence });
    return response.data;
};

export const updateCustomStatus = async (customStatus) => {
    const response = await api.patch('/user-status/custom', customStatus);
    return response.data;
};

export const getUserStatus = async (userId) => {
    const response = await api.get(`/user-status/${userId}`);
    return response.data;
};

export const getMultipleUserStatuses = async (userIds) => {
    const response = await api.get(`/user-status?userIds=${userIds.join(',')}`);
    return response.data;
}; 