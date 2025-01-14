import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';

dotenv.config();

// Custom error types for avatar service
export class AvatarServiceError extends Error {
    constructor(message, type, details = {}) {
        super(message);
        this.name = 'AvatarServiceError';
        this.type = type;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

export const ErrorTypes = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AI_ERROR: 'AI_ERROR',
    STYLE_ERROR: 'STYLE_ERROR',
    CONTENT_ERROR: 'CONTENT_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR'
};

// Response status tracking
const responseStats = {
    total: 0,
    successful: 0,
    failed: 0,
    lastResponse: null,
    errors: new Map() // Track error frequencies
};

// Initialize ChatGPT model for avatar impersonation
const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4',
    temperature: 0.9 // Higher temperature for more creative responses
});

/**
 * Validates the content of an AI response
 * @param {string} response - The AI-generated response
 * @param {Object} userInfo - Information about the user being impersonated
 * @returns {Object} Validation result with status and optional error message
 */
function validateResponse(response, userInfo) {
    // Check for empty or whitespace-only responses
    if (!response || !response.trim()) {
        return {
            isValid: false,
            error: 'Empty response received'
        };
    }

    // Check response length (prevent extremely long responses)
    if (response.length > 2000) {
        return {
            isValid: false,
            error: 'Response exceeds maximum length'
        };
    }

    // Check for AI disclosure phrases
    const aiDisclosurePhrases = [
        /as an ai/i,
        /i am an ai/i,
        /i'm an ai/i,
        /artificial intelligence/i,
        /language model/i,
        /ai assistant/i,
        /ai model/i
    ];

    for (const phrase of aiDisclosurePhrases) {
        if (phrase.test(response)) {
            return {
                isValid: false,
                error: 'Response contains AI disclosure'
            };
        }
    }

    // Check for impersonation disclosure
    const impersonationPhrases = [
        /pretending to be/i,
        /impersonating/i,
        /acting as/i,
        /roleplaying/i,
        new RegExp(`pretending.*${userInfo.username}`, 'i')
    ];

    for (const phrase of impersonationPhrases) {
        if (phrase.test(response)) {
            return {
                isValid: false,
                error: 'Response contains impersonation disclosure'
            };
        }
    }

    // Check for potentially harmful content
    const harmfulPatterns = [
        /(^|\s)kms(\s|$)/i,  // Self-harm references
        /(^|\s)kys(\s|$)/i,  // Harmful suggestions
        /\b(hate|kill|murder)\b/i,  // Violent content
        /\b(suicide|die)\b/i  // Self-harm content
    ];

    for (const pattern of harmfulPatterns) {
        if (pattern.test(response)) {
            return {
                isValid: false,
                error: 'Response contains potentially harmful content'
            };
        }
    }

    return { isValid: true };
}

/**
 * Sanitizes and formats the response for consistency
 * @param {string} response - The validated response
 * @returns {string} Sanitized and formatted response
 */
function sanitizeResponse(response) {
    return response
        .trim()
        // Remove multiple consecutive spaces
        .replace(/\s+/g, ' ')
        // Remove multiple consecutive newlines
        .replace(/\n{3,}/g, '\n\n')
        // Ensure proper spacing after punctuation
        .replace(/([.!?])\s*(\w)/g, '$1 $2')
        // Remove leading/trailing quotes if they match
        .replace(/^["'](.+)["']$/, '$1');
}

/**
 * Generates an AI response impersonating a user based on their chat history and style
 * @param {string} message - The message to respond to
 * @param {Array} userHistory - Array of user's previous messages
 * @param {Object} userInfo - Information about the user being impersonated
 * @returns {Promise<Object>} The AI-generated response with status information
 */
export async function generateAvatarResponse(message, userHistory, userInfo) {
    responseStats.total++;
    const startTime = Date.now();

    try {
        // Input validation
        if (!message?.trim()) {
            throw new AvatarServiceError(
                'Empty message received',
                ErrorTypes.VALIDATION_ERROR,
                { message }
            );
        }

        if (!userInfo?.id || !userInfo?.username) {
            throw new AvatarServiceError(
                'Invalid user information',
                ErrorTypes.VALIDATION_ERROR,
                { userInfo }
            );
        }

        // Format user history for context
        const formattedHistory = userHistory
            .map(msg => `${msg.sender?.username || 'User'}: ${msg.content}`)
            .join('\n');

        // Analyze user's writing style from history
        const writingStyle = userHistory.length > 0 ? 
            analyzeWritingStyle(userHistory) : 
            'uses a natural, conversational tone';

        // Construct the messages using LangChain message objects
        const messages = [
            new SystemMessage({
                content: `You are now impersonating ${userInfo.username}. ${userHistory.length > 0 ? 
                    `Based on their chat history, they ${writingStyle}.` : 
                    'Respond in a natural, conversational way.'} 
                         Maintain this style while responding naturally and authentically. Keep responses concise and in character.
                         Never mention that you are an AI or that you are impersonating someone.
                         Avoid any harmful, offensive, or inappropriate content.`
            }),
            new HumanMessage({
                content: `${userHistory.length > 0 ? `Previous conversations:\n${formattedHistory}\n\n` : ''}Respond to: ${message}`
            })
        ];

        // Get response from ChatGPT
        const response = await llm.invoke(messages);
        const content = response.content;

        // Validate the response
        const validation = validateResponse(content, userInfo);
        if (!validation.isValid) {
            throw new AvatarServiceError(
                `Invalid response: ${validation.error}`,
                ErrorTypes.CONTENT_ERROR,
                { content, validation }
            );
        }

        // Sanitize the validated response
        const sanitizedResponse = sanitizeResponse(content);

        // Update success stats
        responseStats.successful++;
        responseStats.lastResponse = {
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            status: 'success'
        };

        // Return success response with metadata
        return {
            content: sanitizedResponse,
            metadata: {
                status: 'success',
                processingTime: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                type: 'avatar_response',
                userInfo: {
                    id: userInfo.id,
                    username: userInfo.username
                },
                stats: {
                    historyLength: userHistory.length,
                    responseLength: sanitizedResponse.length,
                    writingStyle: writingStyle.split(', ')
                }
            }
        };

    } catch (error) {
        // Update error stats
        responseStats.failed++;
        const errorType = error instanceof AvatarServiceError ? error.type : ErrorTypes.AI_ERROR;
        responseStats.errors.set(errorType, (responseStats.errors.get(errorType) || 0) + 1);

        // Update last response info
        responseStats.lastResponse = {
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            status: 'error',
            error: {
                type: errorType,
                message: error.message
            }
        };

        // Rethrow with additional context if not already an AvatarServiceError
        if (!(error instanceof AvatarServiceError)) {
            throw new AvatarServiceError(
                'Failed to generate avatar response',
                ErrorTypes.AI_ERROR,
                {
                    originalError: error.message,
                    processingTime: Date.now() - startTime
                }
            );
        }
        throw error;
    }
}

/**
 * Analyzes a user's writing style from their message history
 * @param {Array} messageHistory - Array of user's previous messages
 * @returns {string} Description of the user's writing style
 */
function analyzeWritingStyle(messageHistory) {
    // Initialize style markers
    let usesEmojis = false;
    let usesPunctuation = false;
    let messageLength = 0;
    let formalityScore = 0;
    let commonPhrases = new Map();

    // Analyze messages
    messageHistory.forEach(msg => {
        const content = msg.content;
        
        // Check for emojis
        usesEmojis = usesEmojis || /[\p{Emoji}]/u.test(content);
        
        // Check punctuation usage
        usesPunctuation = usesPunctuation || /[!?]{2,}/.test(content);
        
        // Track message length
        messageLength += content.length;
        
        // Check formality (basic heuristic)
        formalityScore += content.includes('lol') || content.includes('idk') ? -1 : 1;
        
        // Track common phrases (basic implementation)
        const words = content.toLowerCase().split(/\s+/);
        for (let i = 0; i < words.length - 1; i++) {
            const phrase = `${words[i]} ${words[i + 1]}`;
            commonPhrases.set(phrase, (commonPhrases.get(phrase) || 0) + 1);
        }
    });

    // Generate style description
    const avgLength = messageLength / messageHistory.length;
    const styleTraits = [];

    if (usesEmojis) styleTraits.push('frequently uses emojis');
    if (usesPunctuation) styleTraits.push('emphasizes with multiple punctuation marks');
    if (avgLength < 50) styleTraits.push('tends to write brief messages');
    else if (avgLength > 100) styleTraits.push('tends to write detailed messages');
    if (formalityScore < 0) styleTraits.push('uses casual language');
    else styleTraits.push('maintains a more formal tone');

    return styleTraits.join(', ');
}

/**
 * Get current response statistics
 * @returns {Object} Current response statistics
 */
export function getResponseStats() {
    return {
        ...responseStats,
        successRate: responseStats.total > 0 
            ? (responseStats.successful / responseStats.total * 100).toFixed(2) + '%'
            : '0%',
        errorFrequency: Object.fromEntries(responseStats.errors),
        averageSuccessRate: responseStats.total > 0
            ? ((responseStats.successful / responseStats.total) * 100).toFixed(2) + '%'
            : '0%'
    };
} 