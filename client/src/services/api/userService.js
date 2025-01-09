import api from './api';

/**
 * Search for users by username
 * @param {string} query - The search query
 * @returns {Promise<Array>} List of matching users
 */
export const searchUsers = async (query) => {
    try {
        if (!query.trim()) {
            return [];
        }

        const response = await api.get('/users/search', {
            params: { query }
        });
        return response.data;
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
}; 