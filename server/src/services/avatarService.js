import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import dotenv from 'dotenv';

dotenv.config();

// Initialize ChatGPT model for avatar impersonation
const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: 'gpt-4',
    temperature: 0.9 // Higher temperature for more creative responses
});

/**
 * Generates an AI response impersonating a user based on their chat history and style
 * @param {string} message - The message to respond to
 * @param {Array} userHistory - Array of user's previous messages
 * @param {Object} userInfo - Information about the user being impersonated
 * @returns {Promise<string>} The AI-generated response
 */
export async function generateAvatarResponse(message, userHistory, userInfo) {
    try {
        // Format user history for context
        const formattedHistory = userHistory
            .map(msg => `${msg.sender?.username || 'User'}: ${msg.content}`)
            .join('\n');

        // Analyze user's writing style from history
        const writingStyle = analyzeWritingStyle(userHistory);

        // Construct the messages using LangChain message objects
        const messages = [
            new SystemMessage({
                content: `You are now impersonating ${userInfo.username}. Based on their chat history, they ${writingStyle}. 
                         Maintain this style while responding naturally and authentically. Keep responses concise and in character.
                         Never mention that you are an AI or that you are impersonating someone.`
            }),
            new HumanMessage({
                content: `Previous conversations:\n${formattedHistory}\n\nRespond to: ${message}`
            })
        ];

        // Get response from ChatGPT
        const response = await llm.invoke(messages);
        return response.content;

    } catch (error) {
        console.error('Error generating avatar response:', error);
        throw new Error('Failed to generate avatar response');
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