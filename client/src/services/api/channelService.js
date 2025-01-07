import api from './api';

export const getChannels = async () => {
    const response = await api.get('/channels');
    return response.data;
};

export const getPublicChannels = async () => {
    const response = await api.get('/channels/public');
    return response.data;
};

export const createChannel = async (channelData) => {
    const response = await api.post('/channels', channelData);
    return response.data;
};

export const joinChannel = async (channelId) => {
    const response = await api.post(`/channels/${channelId}/join`);
    return response.data;
};

export const getChannel = async (channelId) => {
    const response = await api.get(`/channels/${channelId}`);
    return response.data;
};
