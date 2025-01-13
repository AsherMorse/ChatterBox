import api from './api';
import { CHATTERBOT_ID, sendMessageToChatterBot } from './chatterbotService';

// ChatterBot's welcome message
const WELCOME_MESSAGE = {
    id: 'welcome',
    content: "👋 Hi! I'm ChatterBot, your AI assistant for ChatterBox. I can help you find information from your chat history and answer questions about past conversations. Feel free to ask me anything!",
    created_at: new Date().toISOString(),
    sender: {
        id: CHATTERBOT_ID,
        username: 'ChatterBot',
        isBot: true
    }
};

/**
 * Get all DM conversations for the current user
 * @returns {Promise<Array>} Array of DM conversations
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
 * Get messages for a specific DM conversation
 * @param {string} dmId - The ID of the DM conversation
 * @returns {Promise<Array>} Array of messages
 */
export const getDMMessages = async (dmId) => {
    try {
        // If it's ChatterBot, return the welcome message
        if (dmId === CHATTERBOT_ID) {
            return [WELCOME_MESSAGE];
        }

        const response = await api.get(`/messages/dm/${dmId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching DM messages:', error);
        throw error;
    }
};

/**
 * Send a message in a DM conversation
 * @param {string} dmId - The ID of the DM conversation
 * @param {string} message - The message content
 * @returns {Promise<Object>} The sent message
 */
export const sendDMMessage = async (dmId, message) => {
    try {
        // If it's ChatterBot, use the ChatterBot service
        if (dmId === CHATTERBOT_ID) {
            return await sendMessageToChatterBot(message);
        }

        const response = await api.post('/messages', {
            content: message,
            dm_id: dmId
        });
        return response.data;
    } catch (error) {
        console.error('Error sending DM message:', error);
        throw error;
    }
};

/**
 * Send a message to ChatterBot with conversation history
 * @param {string} message - The message content
 * @param {Array} conversationHistory - Array of previous messages
 * @returns {Promise<Object>} ChatterBot's response
 */
export const sendChatterBotMessage = async (message, conversationHistory = []) => {
    try {
        return await sendMessageToChatterBot(message, conversationHistory);
    } catch (error) {
        console.error('Error sending message to ChatterBot:', error);
        throw error;
    }
};

/**
 * Get a specific DM conversation
 * @param {string} dmId - The ID of the DM conversation
 * @returns {Promise<Object>} The DM conversation
 */
export const getDMConversation = async (dmId) => {
    try {
        // If it's ChatterBot, get info from ChatterBot service
        if (dmId === CHATTERBOT_ID) {
            const { getChatterBotInfo } = await import('./chatterbotService');
            const chatterbot = await getChatterBotInfo();
            return {
                id: CHATTERBOT_ID,
                users: [chatterbot],
                isBot: true
            };
        }

        const response = await api.get(`/direct-messages/${dmId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching DM conversation:', error);
        throw error;
    }
};

/**
 * Create a new DM conversation
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