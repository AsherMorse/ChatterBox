import api from './api';
import { supabase } from '../../config/supabase';

/**
 * Upload a file to Supabase storage
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} The uploaded file data
 */
export const uploadFile = async (file) => {
    try {
        // Upload file to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        console.log('Attempting to upload file:', { fileName, fileType: file.type, fileSize: file.size });
        
        const { data, error } = await supabase.storage
            .from('file_attachments')
            .upload(fileName, file);

        if (error) {
            console.error('Supabase storage upload error:', {
                error,
                fileName,
                fileType: file.type,
                fileSize: file.size
            });
            throw error;
        }

        console.log('File uploaded successfully:', data);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('file_attachments')
            .getPublicUrl(fileName);

        console.log('Generated public URL:', publicUrl);

        // Generate thumbnail for images
        let thumbnailUrl = null;
        if (file.type.startsWith('image/')) {
            thumbnailUrl = supabase.storage
                .from('file_attachments')
                .getPublicUrl(fileName, {
                    transform: {
                        width: 200,
                        height: 200,
                        resize: 'contain'
                    }
                }).data.publicUrl;
        }

        return {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileUrl: publicUrl,
            thumbnailUrl
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

/**
 * Create a file attachment for a message
 * @param {Object} params - The attachment parameters
 * @param {string} params.messageId - The ID of the message
 * @param {Object} params.fileData - The file data from uploadFile
 * @returns {Promise<Object>} The created file attachment
 */
export const createFileAttachment = async ({ messageId, ...fileData }) => {
    try {
        const response = await api.post('/messages/attachments', {
            messageId,
            ...fileData
        });
        return response.data;
    } catch (error) {
        console.error('Error creating file attachment:', error);
        throw error;
    }
};

/**
 * Get file attachments for a message
 * @param {string} messageId - The ID of the message
 * @returns {Promise<Array>} List of file attachments
 */
export const getFileAttachments = async (messageId) => {
    try {
        const response = await api.get(`/messages/${messageId}/attachments`);
        return response.data;
    } catch (error) {
        console.error('Error fetching file attachments:', error);
        throw error;
    }
}; 