import { supabase } from '../../config/supabase';

/**
 * Search for users by username, first name, or last name
 * @param {string} query - The search query
 * @returns {Promise<Array>} List of matching users
 */
export const searchUsers = async (query) => {
    try {
        const { data: currentUser } = await supabase.auth.getUser();
        
        if (!query.trim()) {
            return [];
        }

        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, avatar_url, status')
            .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
            .neq('id', currentUser.user.id) // Exclude current user
            .limit(10);

        if (error) throw error;
        return users;
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
}; 