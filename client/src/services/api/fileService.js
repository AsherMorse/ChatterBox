import api from './api';
import { supabase } from '../../config/supabase';
import { getUser } from './auth';

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
 * @param {string} params.fileName - The name of the file
 * @param {string} params.fileType - The MIME type of the file
 * @param {number} params.fileSize - The size of the file in bytes
 * @param {string} params.fileUrl - The public URL of the file
 * @returns {Promise<Object>} The created file attachment
 */
export const createFileAttachment = async ({ messageId, fileName, fileType, fileSize, fileUrl }) => {
    try {
        // First create the file record
        const { data: file, error: fileError } = await supabase
            .from('files')
            .insert({
                name: fileName,
                type: fileType,
                size: fileSize,
                url: fileUrl
            })
            .select()
            .single();

        if (fileError) {
            console.error('Error creating file record:', fileError);
            throw fileError;
        }

        // Get current user from app state
        const currentUser = getUser();
        if (!currentUser) {
            throw new Error('No user found');
        }
        
        // Then create the file attachment
        const { data: attachment, error: attachmentError } = await supabase
            .from('file_attachments')
            .insert({
                file_id: file.id,
                message_id: messageId,
                uploader_id: currentUser.id
            })
            .select(`
                id,
                message_id,
                uploader_id,
                file:file_id (
                    id,
                    name,
                    type,
                    size,
                    url
                )
            `)
            .single();

        if (attachmentError) {
            console.error('Error creating file attachment:', attachmentError);
            throw attachmentError;
        }

        return {
            id: attachment.id,
            message_id: attachment.message_id,
            uploader_id: attachment.uploader_id,
            file_name: attachment.file.name,
            file_type: attachment.file.type,
            file_size: attachment.file.size,
            file_url: attachment.file.url
        };
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