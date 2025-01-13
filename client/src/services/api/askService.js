import api from './api';

/**
 * Sends a query to the AI assistant
 * @param {string} query - The user's question
 * @returns {Promise<Object>} The AI's response with answer and context
 */
export const askAI = async (query) => {
    try {
        const response = await api.post('/ask', { query });
        return response.data;
    } catch (error) {
        console.error('Error asking AI:', error);
        throw error;
    }
}; 