import { supabase } from '../../config/supabase';

/**
 * Fetches all DM conversations for the current user
 * @returns {Promise<Array>} List of DM conversations with latest message and other user info
 */
export const getDMConversations = async () => {
    try {
        const { data: currentUser } = await supabase.auth.getUser();
        
        const { data: conversations, error } = await supabase
            .from('direct_message_members')
            .select(`
                dm_id,
                direct_messages!inner(
                    id,
                    created_at
                ),
                users!inner(
                    id,
                    username,
                    avatar_url,
                    status
                )
            `)
            .eq('user_id', currentUser.user.id);

        if (error) throw error;

        // Get latest message for each conversation
        const conversationsWithMessages = await Promise.all(
            conversations.map(async (conv) => {
                const { data: messages } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('dm_id', conv.dm_id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                return {
                    ...conv,
                    latest_message: messages?.[0] || null
                };
            })
        );

        return conversationsWithMessages;
    } catch (error) {
        console.error('Error fetching DM conversations:', error);
        throw error;
    }
};

/**
 * Creates a new DM conversation with another user
 * @param {string} otherUserId - The ID of the user to start a DM with
 * @returns {Promise<Object>} The created DM conversation
 */
export const createDMConversation = async (otherUserId) => {
    try {
        const { data: currentUser } = await supabase.auth.getUser();
        
        // First check if a DM already exists between these users
        const { data: existingDMs } = await supabase
            .from('direct_message_members')
            .select('dm_id')
            .eq('user_id', currentUser.user.id);

        if (existingDMs?.length) {
            const { data: existingConversation } = await supabase
                .from('direct_message_members')
                .select('dm_id')
                .eq('user_id', otherUserId)
                .in('dm_id', existingDMs.map(dm => dm.dm_id))
                .single();

            if (existingConversation) {
                return existingConversation.dm_id;
            }
        }

        // Create new DM conversation
        const { data: newDM, error: dmError } = await supabase
            .from('direct_messages')
            .insert({})
            .select()
            .single();

        if (dmError) throw dmError;

        // Add both users to the conversation
        const { error: membersError } = await supabase
            .from('direct_message_members')
            .insert([
                { dm_id: newDM.id, user_id: currentUser.user.id },
                { dm_id: newDM.id, user_id: otherUserId }
            ]);

        if (membersError) throw membersError;

        return newDM.id;
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
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:sender_id(
                    id,
                    username,
                    avatar_url
                )
            `)
            .eq('dm_id', dmId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return messages;
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
        const { data: currentUser } = await supabase.auth.getUser();
        
        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                content,
                dm_id: dmId,
                sender_id: currentUser.user.id
            })
            .select(`
                *,
                sender:sender_id(
                    id,
                    username,
                    avatar_url
                )
            `)
            .single();

        if (error) throw error;
        return message;
    } catch (error) {
        console.error('Error sending DM message:', error);
        throw error;
    }
}; 