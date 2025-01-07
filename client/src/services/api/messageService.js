import api from './api';

export const getMessages = async (channelId) => {
    const response = await api.get(`/messages/channel/${channelId}`);
    return response.data;
};

export const sendMessage = async (message) => {
    const response = await api.post('/messages', message);
    return response.data;
};

export const getMessageSender = async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
};