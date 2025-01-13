import api from './api';

// ChatterBot's static ID
export const CHATTERBOT_ID = 'chatterbot';

/**
 * Get ChatterBot's information
 * @returns {Promise<Object>} ChatterBot's user information
 */
export const getChatterBotInfo = async () => {
    try {
        const response = await api.get('/chatterbot');
        return response.data;
    } catch (error) {
        console.error('Error getting ChatterBot info:', error);
        throw error;
    }
};

/**
 * Send a message to ChatterBot
 * @param {string} message - The message to send
 * @returns {Promise<Object>} ChatterBot's response message
 */
export const sendMessageToChatterBot = async (message) => {
    try {
        const response = await api.post('/chatterbot/message', { message });
        return response.data;
    } catch (error) {
        console.error('Error sending message to ChatterBot:', error);
        throw error;
    }
}; 