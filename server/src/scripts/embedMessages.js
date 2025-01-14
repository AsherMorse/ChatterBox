import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.join(__dirname, '../../', envFile);
console.log(`Loading environment from: ${envPath}`);
dotenv.config({ path: envPath });

// Initialize Pinecone client
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

// Debug: Log Pinecone configuration (without showing full API key)
const apiKeyPrefix = process.env.PINECONE_API_KEY.substring(0, 10) + '...';
console.log('Pinecone Configuration:', {
    index: process.env.PINECONE_INDEX,
    apiKeyPrefix
});

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Initialize embeddings model
const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-large',
    maxConcurrency: 5 // Limit concurrent API calls
});

// Initialize text splitter
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100
});

async function loadMessagesFromSupabase() {
    const { data: messages, error } = await supabase
        .from('messages')
        .select(`
            id,
            content,
            created_at,
            updated_at,
            sender_id,
            channel_id,
            dm_id,
            parent_id,
            is_edited,
            is_thread_reply
        `);

    if (error) throw error;
    return messages;
}

async function createDocuments(messages) {
    const documents = messages.map(message => ({
        pageContent: message.content,
        metadata: {
            messageId: message.id,
            senderId: message.sender_id,
            channelId: message.channel_id,
            dmId: message.dm_id,
            parentId: message.parent_id,
            createdAt: message.created_at,
            updatedAt: message.updated_at,
            isEdited: message.is_edited,
            isThreadReply: message.is_thread_reply
        }
    }));

    return await textSplitter.splitDocuments(documents);
}

async function processBatch(documents, index, batchSize, startIdx) {
    const batch = documents.slice(startIdx, startIdx + batchSize);
    if (batch.length === 0) return;

    console.log(`Processing batch ${Math.floor(startIdx/batchSize) + 1}/${Math.ceil(documents.length/batchSize)} (${startIdx + 1}-${Math.min(startIdx + batchSize, documents.length)} of ${documents.length})`);
    
    try {
        const vectorStore = await PineconeStore.fromDocuments(
            batch,
            embeddings,
            {
                pineconeIndex: index,
                namespace: 'chat-messages',
                dimension: 3072
            }
        );
        console.log(`Successfully processed batch of ${batch.length} documents`);
        return true;
    } catch (error) {
        console.error('Error processing batch:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        return false;
    }
}

async function main() {
    try {
        // Verify environment variables
        const requiredEnvVars = ['PINECONE_API_KEY', 'PINECONE_INDEX', 'OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }

        console.log('Loading messages from Supabase...');
        const messages = await loadMessagesFromSupabase();
        console.log(`Found ${messages.length} messages`);

        console.log('Creating and splitting documents...');
        const documents = await createDocuments(messages);
        console.log(`Created ${documents.length} document chunks`);

        console.log('Initializing Pinecone vector store...');
        const index = pinecone.index(process.env.PINECONE_INDEX);
        
        // Test Pinecone connection
        try {
            console.log('Testing Pinecone connection...');
            const stats = await index.describeIndexStats();
            console.log('Pinecone connection successful:', stats);
        } catch (error) {
            console.error('Failed to connect to Pinecone:');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response data:', error.response.data);
            }
            throw error;
        }

        console.log('Processing documents in batches...');
        const batchSize = 10; // Process 10 documents at a time
        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < documents.length; i += batchSize) {
            const success = await processBatch(documents, index, batchSize, i);
            if (success) {
                successCount += Math.min(batchSize, documents.length - i);
            } else {
                failureCount += Math.min(batchSize, documents.length - i);
            }

            // Add a small delay between batches to avoid rate limiting
            if (i + batchSize < documents.length) {
                console.log('Waiting 2 seconds before next batch...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        console.log('\nProcessing Summary:');
        console.log(`Total documents: ${documents.length}`);
        console.log(`Successfully processed: ${successCount}`);
        console.log(`Failed to process: ${failureCount}`);

        if (failureCount > 0) {
            throw new Error(`Failed to process ${failureCount} documents`);
        }

        console.log('Successfully loaded all messages to vector store');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main().catch(console.error); 