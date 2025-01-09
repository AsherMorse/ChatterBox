import api from './api';

/**
 * Fetches all DM conversations for the current user
 * @returns {Promise<Array>} List of DM conversations with latest message and other user info
 */
export const getDMConversations = async () => {
    try {
        const response = await api.get('/direct-messages');
        return response.data;
    } catch (error) {
        console.error('Error fetching DM conversations:', error);
        throw error;
    }
};

/**
 * Creates a new DM conversation with another user
 * @param {string} userId - The ID of the user to start a conversation with
 * @returns {Promise<Object>} The created DM conversation
 */
export const createDMConversation = async (userId) => {
    try {
        const response = await api.post('/direct-messages', { userId });
        return response.data;
    } catch (error) {
        console.error('Error creating DM conversation:', error);
        throw error;
    }
};

/**
 * Fetches messages for a specific DM conversation
 * @param {string} dmId - The ID of the DM conversation
 * @returns {Promise<Array>} List of messages in the conversation
 */
export const getDMMessages = async (dmId) => {
    try {
        const response = await api.get(`/messages/dm/${dmId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching DM messages:', error);
        throw error;
    }
};

/**
 * Sends a message in a DM conversation
 * @param {string} dmId - The ID of the DM conversation
 * @param {string} content - The message content
 * @returns {Promise<Object>} The sent message
 */
export const sendDMMessage = async (dmId, content) => {
    try {
        const response = await api.post('/messages', {
            content,
            dm_id: dmId
        });
        return response.data;
    } catch (error) {
        console.error('Error sending DM message:', error);
        throw error;
    }
};

/**
 * Fetches a single DM conversation by ID
 * @param {string} dmId - The ID of the DM conversation
 * @returns {Promise<Object>} The DM conversation with user details
 */
export const getDMConversation = async (dmId) => {
    try {
        const response = await api.get(`/direct-messages/${dmId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching DM conversation:', error);
        throw error;
    }
}; 