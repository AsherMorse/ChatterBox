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

export const getMessageReactions = async (messageId) => {
    const response = await api.get(`/messages/${messageId}/reactions`);
    return response.data;
};

export const addReaction = async (messageId, emoji) => {
    const response = await api.post(`/messages/${messageId}/reactions`, { emoji });
    return response.data;
};

export const removeReaction = async (messageId, emoji) => {
    const response = await api.delete(`/messages/${messageId}/reactions`, {
        data: { emoji }
    });
    return response.data;
};

export const getThreadMessages = async (messageId) => {
    const response = await api.get(`/messages/${messageId}/thread`);
    return response.data;
};

export const sendThreadReply = async (messageId, content) => {
    const response = await api.post(`/messages/${messageId}/thread`, { content });
    return response.data;
};