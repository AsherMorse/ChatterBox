import express from 'express';
import { authenticateJWT } from '../middleware/auth.js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';

const router = express.Router();
dotenv.config();

// ChatterBot's static information
export const CHATTERBOT_ID = 'chatterbot';
export const CHATTERBOT_INFO = {
    id: CHATTERBOT_ID,
    username: 'ChatterBot',
    avatar_url: null, // We can add a custom avatar URL later
    isBot: true
};

// Initialize Pinecone client
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

// Initialize embeddings model
const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'text-embedding-3-large',
    maxConcurrency: 5
});

// Initialize ChatGPT model
const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4',
    temperature: 0.7
});

// GET /api/chatterbot - Get ChatterBot information
router.get('/', authenticateJWT, (req, res) => {
    res.json(CHATTERBOT_INFO);
});

// POST /api/chatterbot/message - Send a message to ChatterBot
router.post('/message', authenticateJWT, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Initialize Pinecone vector store
        const index = pinecone.index(process.env.PINECONE_INDEX);
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
            namespace: 'chat-messages'
        });

        // Perform similarity search
        const relevantDocs = await vectorStore.similaritySearch(message, 5);
        
        if (!relevantDocs || !Array.isArray(relevantDocs)) {
            throw new Error('No relevant documents found');
        }

        // Construct context from relevant documents
        const context = relevantDocs
            .filter(doc => doc && doc.pageContent)
            .map(doc => doc.pageContent)
            .join('\n\n');

        // Construct the messages using LangChain message objects
        const messages = [
            new SystemMessage({
                content: "You are ChatterBot, a friendly and helpful AI assistant integrated into the ChatterBox chat application. You help users by answering questions about their chat history and providing relevant context. Keep your responses conversational and engaging, while being accurate and helpful. If the context doesn't contain enough information to answer the question, be honest about it."
            }),
            new HumanMessage({
                content: `Context from chat history:\n${context}\n\nUser message: ${message}`
            })
        ];

        // Get response from ChatGPT
        const response = await llm.invoke(messages);

        // Format the response as a message
        const botResponse = {
            id: Date.now().toString(), // Simple ID generation
            content: response.content,
            created_at: new Date().toISOString(),
            sender: CHATTERBOT_INFO,
            context: relevantDocs
                .filter(doc => doc && doc.pageContent && doc.metadata)
                .map(doc => ({
                    content: doc.pageContent,
                    metadata: {
                        senderId: doc.metadata.senderId || null,
                        createdAt: doc.metadata.createdAt || null
                    }
                }))
        };

        res.json(botResponse);

    } catch (error) {
        console.error('Error in ChatterBot message:', error);
        res.status(500).json({ 
            message: 'Error processing message',
            error: error.message 
        });
    }
});

export default router; 