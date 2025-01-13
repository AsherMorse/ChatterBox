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

// POST /api/ask - Get an AI response based on chat history context
router.post('/', authenticateJWT, async (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query) {
            return res.status(400).json({ message: 'Query is required' });
        }

        // Initialize Pinecone vector store
        const index = pinecone.index(process.env.PINECONE_INDEX);
        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
            namespace: 'chat-messages'
        });

        // Perform similarity search
        const relevantDocs = await vectorStore.similaritySearch(query, 5);
        
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
                content: "You are a helpful AI assistant that answers questions based on the chat history context provided. Use the context to provide accurate and relevant answers. If the context doesn't contain enough information to answer the question, say so."
            }),
            new HumanMessage({
                content: `Context:\n${context}\n\nQuestion: ${query}`
            })
        ];

        // Get response from ChatGPT
        const response = await llm.invoke(messages);

        // Return the answer with properly formatted context
        res.json({
            answer: response.content,
            context: relevantDocs
                .filter(doc => doc && doc.pageContent && doc.metadata)
                .map(doc => ({
                    content: doc.pageContent,
                    metadata: {
                        senderId: doc.metadata.senderId || null,
                        createdAt: doc.metadata.createdAt || null
                    }
                }))
        });

    } catch (error) {
        console.error('Error in /api/ask:', error);
        res.status(500).json({ 
            message: 'Error processing request',
            error: error.message 
        });
    }
});

export default router; 