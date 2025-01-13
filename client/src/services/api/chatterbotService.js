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
 * @param {Array} conversationHistory - Array of previous messages in the conversation
 * @returns {Promise<Object>} ChatterBot's response message
 */
export const sendMessageToChatterBot = async (message, conversationHistory = []) => {
    try {
        // Format only the direct conversation history
        const formattedHistory = conversationHistory
            .filter(msg => msg.content?.trim() !== '')
            .map(msg => ({
                role: msg.sender?.id === CHATTERBOT_ID ? 'assistant' : 'user',
                content: msg.content || '',
                timestamp: msg.created_at,
                sender: msg.sender?.username || 'Unknown',
                channel: msg.channel_name || 'DM',
                channel_id: msg.channel_id || null
            }));

        // Send the message to the backend which will use Pinecone for context
        const response = await api.post('/chatterbot/message', { 
            message,
            conversationHistory: formattedHistory
        });
        return response.data;
    } catch (error) {
        console.error('Error sending message to ChatterBot:', error);
        throw error;
    }
}; 