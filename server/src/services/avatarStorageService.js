import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

/**
 * Stores an avatar response in the database
 * @param {Object} params - Storage parameters
 * @param {string} params.messageId - ID of the message that triggered the avatar
 * @param {string} params.targetUserId - ID of the user being impersonated
 * @param {string} params.originalMessage - Original message that triggered the response
 * @param {string} params.generatedResponse - The AI-generated response
 * @param {Object} params.metadata - Additional metadata about the response
 * @returns {Promise<Object>} The stored response record
 */
export async function storeAvatarResponse({
    messageId,
    targetUserId,
    originalMessage,
    generatedResponse,
    metadata
}) {
    try {
        const { data, error } = await supabase
            .from('avatar_responses')
            .insert({
                message_id: messageId,
                target_user_id: targetUserId,
                original_message: originalMessage,
                generated_response: generatedResponse,
                status: 'success',
                processing_time: metadata.processingTime,
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString()
                }
            })
            .select()
            .single();

        if (error) throw error;
        return data;

    } catch (error) {
        console.error('Error storing avatar response:', error);
        throw error;
    }
}

/**
 * Stores an error response in the database
 * @param {Object} params - Error storage parameters
 * @param {string} params.messageId - ID of the message that triggered the avatar
 * @param {string} params.targetUserId - ID of the user being impersonated
 * @param {string} params.originalMessage - Original message that triggered the response
 * @param {string} params.errorType - Type of error that occurred
 * @param {Object} params.errorDetails - Detailed error information
 * @param {number} params.processingTime - Time taken to process the request
 * @returns {Promise<Object>} The stored error record
 */
export async function storeAvatarError({
    messageId,
    targetUserId,
    originalMessage,
    errorType,
    errorDetails,
    processingTime
}) {
    try {
        const { data, error } = await supabase
            .from('avatar_responses')
            .insert({
                message_id: messageId,
                target_user_id: targetUserId,
                original_message: originalMessage,
                generated_response: '', // Empty for errors
                status: 'error',
                processing_time: processingTime,
                error_type: errorType,
                error_details: errorDetails,
                metadata: {
                    timestamp: new Date().toISOString(),
                    error: true
                }
            })
            .select()
            .single();

        if (error) throw error;
        return data;

    } catch (error) {
        console.error('Error storing avatar error:', error);
        throw error;
    }
}

/**
 * Retrieves avatar response history for a user
 * @param {string} targetUserId - ID of the user to get history for
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of responses to return
 * @param {number} options.offset - Number of responses to skip
 * @returns {Promise<Array>} Array of avatar responses
 */
export async function getAvatarHistory(targetUserId, { limit = 50, offset = 0 } = {}) {
    try {
        const { data, error } = await supabase
            .from('avatar_responses')
            .select(`
                *,
                message:message_id (
                    id,
                    content,
                    created_at
                ),
                target_user:target_user_id (
                    id,
                    username,
                    avatar_url
                )
            `)
            .eq('target_user_id', targetUserId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data;

    } catch (error) {
        console.error('Error fetching avatar history:', error);
        throw error;
    }
}

/**
 * Gets statistics about avatar responses for a user
 * @param {string} targetUserId - ID of the user to get stats for
 * @returns {Promise<Object>} Statistics about the user's avatar responses
 */
export async function getAvatarStats(targetUserId) {
    try {
        const { data, error } = await supabase
            .from('avatar_responses')
            .select('status, processing_time')
            .eq('target_user_id', targetUserId);

        if (error) throw error;

        const stats = {
            total: data.length,
            successful: data.filter(r => r.status === 'success').length,
            failed: data.filter(r => r.status === 'error').length,
            averageProcessingTime: data.reduce((acc, r) => acc + r.processing_time, 0) / data.length
        };

        stats.successRate = stats.total > 0 
            ? (stats.successful / stats.total * 100).toFixed(2) + '%'
            : '0%';

        return stats;

    } catch (error) {
        console.error('Error fetching avatar stats:', error);
        throw error;
    }
} 