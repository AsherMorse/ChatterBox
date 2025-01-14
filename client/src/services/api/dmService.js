import api from './api';
import { CHATTERBOT_ID, sendMessageToChatterBot } from './chatterbotService';
import { getUser } from './auth';

// ChatterBot's welcome message
const WELCOME_MESSAGE = {
    id: 'welcome',
    content: "👋 Hi! I'm ChatterBot, your AI assistant for ChatterBox. I can help you find information from your chat history and answer questions about past conversations. Feel free to ask me anything!",
    created_at: new Date().toISOString(),
    sender: {
        id: CHATTERBOT_ID,
        username: 'ChatterBot',
        isBot: true
    }
};

/**
 * Get all DM conversations for the current user
 * @returns {Promise<Array>} Array of DM conversations
 */
export const getDMConversations = async () => {
    try {
        const response = await api.get('/direct-messages');
        return response.data;
    } catch (error) {
        console.error('Error fetching DM conversations:', error);
        throw error;
    }
};

/**
 * Get messages for a specific DM conversation
 * @param {string} dmId - The ID of the DM conversation
 * @returns {Promise<Array>} Array of messages
 */
export const getDMMessages = async (dmId) => {
    try {
        // If it's ChatterBot, return the welcome message
        if (dmId === CHATTERBOT_ID) {
            return [WELCOME_MESSAGE];
        }

        const response = await api.get(`/messages/dm/${dmId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching DM messages:', error);
        throw error;
    }
};

/**
 * Send a message in a DM conversation
 * @param {string} dmId - The ID of the DM conversation
 * @param {string} message - The message content
 * @returns {Promise<Object>} The sent message
 */
export const sendDMMessage = async (dmId, message) => {
    try {
        // If it's ChatterBot, use the ChatterBot service
        if (dmId === CHATTERBOT_ID) {
            return await sendMessageToChatterBot(message);
        }

        const response = await api.post('/messages', {
            content: message,
            dm_id: dmId
        });
        return response.data;
    } catch (error) {
        console.error('Error sending DM message:', error);
        throw error;
    }
};

/**
 * Send a message to ChatterBot with conversation history
 * @param {string} message - The message content
 * @param {Array} conversationHistory - Array of previous messages
 * @returns {Promise<Object>} ChatterBot's response
 */
export const sendChatterBotMessage = async (message, conversationHistory = []) => {
    try {
        return await sendMessageToChatterBot(message, conversationHistory);
    } catch (error) {
        console.error('Error sending message to ChatterBot:', error);
        throw error;
    }
};

/**
 * Get a specific DM conversation
 * @param {string} dmId - The ID of the DM conversation
 * @returns {Promise<Object>} The DM conversation
 */
export const getDMConversation = async (dmId) => {
    try {
        // If it's ChatterBot, get info from ChatterBot service
        if (dmId === CHATTERBOT_ID) {
            const { getChatterBotInfo } = await import('./chatterbotService');
            const chatterbot = await getChatterBotInfo();
            return {
                id: CHATTERBOT_ID,
                users: [chatterbot],
                isBot: true
            };
        }

        const response = await api.get(`/direct-messages/${dmId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching DM conversation:', error);
        throw error;
    }
};

/**
 * Create a new DM conversation
 * @param {string} userId - The ID of the user to start a conversation with
 * @returns {Promise<Object>} The created DM conversation
 */
export const createDMConversation = async (userId) => {
    try {
        const response = await api.post('/direct-messages', { userId });
        return response.data;
    } catch (error) {
        console.error('Error creating DM conversation:', error);
        throw error;
    }
};

/**
 * Get the target user for avatar command in a DM context
 * @param {string} dmId - The ID of the DM conversation
 * @returns {Promise<Object>} The target user object
 * @throws {Error} If the DM doesn't exist or user is not authorized
 */
export const getAvatarTargetUser = async (dmId) => {
    try {
        // Don't allow avatar commands with ChatterBot
        if (dmId === CHATTERBOT_ID) {
            throw new Error('Avatar commands are not supported with ChatterBot');
        }

        // Get the DM conversation
        const conversation = await getDMConversation(dmId);
        if (!conversation) {
            throw new Error('DM conversation not found');
        }

        // Get the current user
        const currentUser = getUser();
        if (!currentUser) {
            throw new Error('User not authenticated');
        }

        // Find the other user in the conversation
        const targetUser = conversation.users.find(u => u.id !== currentUser.id);
        if (!targetUser) {
            throw new Error('Target user not found in conversation');
        }

        return targetUser;
    } catch (error) {
        console.error('Error getting avatar target user:', error);
        throw error;
    }
};

/**
 * Get conversation history for the avatar command
 * @param {string} dmId - The ID of the DM conversation
 * @param {number} limit - Maximum number of messages to fetch (default: 100)
 * @returns {Promise<Array>} Array of messages from the conversation history
 */
export const getAvatarConversationHistory = async (dmId, limit = 100) => {
    try {
        // Don't allow avatar commands with ChatterBot
        if (dmId === CHATTERBOT_ID) {
            throw new Error('Avatar commands are not supported with ChatterBot');
        }

        // Get messages from the DM conversation
        const response = await api.get(`/messages/dm/${dmId}`, {
            params: {
                limit,
                // Order by created_at to get most recent messages first
                order: 'desc',
                // Exclude system messages and bot messages
                exclude_system: true,
                exclude_bots: true
            }
        });

        // Get the target user for filtering
        const targetUser = await getAvatarTargetUser(dmId);

        // Filter messages to only include those from the target user
        const targetUserMessages = response.data
            .filter(message => message.sender?.id === targetUser.id)
            // Sort messages chronologically (oldest first) for better context
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        return targetUserMessages;
    } catch (error) {
        console.error('Error fetching avatar conversation history:', error);
        throw error;
    }
};

/**
 * Get all messages for a specific user
 * @param {string} userId - The ID of the user
 * @param {Object} options - Optional parameters
 * @param {number} options.limit - Maximum number of messages to fetch (default: 100)
 * @param {boolean} options.excludeSystem - Whether to exclude system messages (default: true)
 * @param {boolean} options.excludeBots - Whether to exclude bot messages (default: true)
 * @returns {Promise<Array>} Array of messages from the user
 */
export const getUserMessages = async (userId, options = {}) => {
    try {
        const {
            limit = 100,
            excludeSystem = true,
            excludeBots = true
        } = options;

        const response = await api.get(`/messages/user/${userId}`, {
            params: {
                limit,
                exclude_system: excludeSystem,
                exclude_bots: excludeBots
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user messages:', error);
        throw error;
    }
};

/**
 * Analyze writing patterns from a user's messages
 * @param {Array} messages - Array of messages to analyze
 * @returns {Object} Analysis of writing patterns
 */
export const analyzeWritingPatterns = (messages) => {
    try {
        // Initialize pattern analysis
        const patterns = {
            averageMessageLength: 0,
            punctuationFrequency: {
                exclamation: 0,
                question: 0,
                ellipsis: 0,
                comma: 0,
                period: 0,
                semicolon: 0
            },
            wordFrequency: {},
            emojiFrequency: {},
            capitalizationStyle: {
                allCaps: 0,
                noCaps: 0,
                properCaps: 0,
                sentenceCase: 0
            },
            commonPhrases: {},
            messageStartPatterns: {},
            messageEndPatterns: {},
            sentimentIndicators: {
                positive: 0,
                negative: 0,
                neutral: 0
            },
            messageStructure: {
                averageSentencesPerMessage: 0,
                averageWordsPerSentence: 0,
                paragraphBreakFrequency: 0
            },
            formatting: {
                boldCount: 0,
                italicCount: 0,
                codeBlockCount: 0,
                linkCount: 0
            }
        };

        if (!messages || messages.length === 0) {
            return patterns;
        }

        // Analyze each message
        let totalLength = 0;
        let totalSentences = 0;
        let totalWords = 0;
        const phraseLength = 3; // Length of phrases to track

        messages.forEach(message => {
            const content = message.content || '';
            totalLength += content.length;

            // Analyze punctuation
            patterns.punctuationFrequency.exclamation += (content.match(/!/g) || []).length;
            patterns.punctuationFrequency.question += (content.match(/\?/g) || []).length;
            patterns.punctuationFrequency.ellipsis += (content.match(/\.{3}/g) || []).length;
            patterns.punctuationFrequency.comma += (content.match(/,/g) || []).length;
            patterns.punctuationFrequency.period += (content.match(/\./g) || []).length;
            patterns.punctuationFrequency.semicolon += (content.match(/;/g) || []).length;

            // Analyze formatting
            patterns.formatting.boldCount += (content.match(/\*\*.*?\*\*/g) || []).length;
            patterns.formatting.italicCount += (content.match(/\*.*?\*/g) || []).length;
            patterns.formatting.codeBlockCount += (content.match(/```.*?```/gs) || []).length;
            patterns.formatting.linkCount += (content.match(/\[.*?\]\(.*?\)/g) || []).length;

            // Analyze capitalization
            if (content === content.toUpperCase() && content.length > 3) {
                patterns.capitalizationStyle.allCaps++;
            } else if (content === content.toLowerCase()) {
                patterns.capitalizationStyle.noCaps++;
            } else if (/^[A-Z][a-z\s]*$/.test(content)) {
                patterns.capitalizationStyle.sentenceCase++;
            } else {
                patterns.capitalizationStyle.properCaps++;
            }

            // Message structure analysis
            const sentences = content.split(/[.!?]+\s*/);
            totalSentences += sentences.length;
            const words = content.split(/\s+/);
            totalWords += words.length;
            patterns.messageStructure.paragraphBreakFrequency += (content.match(/\n\s*\n/g) || []).length;

            // Basic sentiment analysis
            const positiveWords = /\b(good|great|awesome|excellent|happy|love|wonderful|fantastic)\b/gi;
            const negativeWords = /\b(bad|terrible|awful|horrible|sad|hate|unfortunate|poor)\b/gi;
            const positiveCount = (content.match(positiveWords) || []).length;
            const negativeCount = (content.match(negativeWords) || []).length;
            
            if (positiveCount > negativeCount) patterns.sentimentIndicators.positive++;
            else if (negativeCount > positiveCount) patterns.sentimentIndicators.negative++;
            else patterns.sentimentIndicators.neutral++;

            // Word frequency and phrases analysis
            const normalizedWords = words.map(w => w.toLowerCase());
            
            normalizedWords.forEach(word => {
                if (word.length > 2) { // Ignore very short words
                    patterns.wordFrequency[word] = (patterns.wordFrequency[word] || 0) + 1;
                }
            });

            // Common phrases (n-grams)
            for (let i = 0; i <= normalizedWords.length - phraseLength; i++) {
                const phrase = normalizedWords.slice(i, i + phraseLength).join(' ');
                patterns.commonPhrases[phrase] = (patterns.commonPhrases[phrase] || 0) + 1;
            }

            // Message start/end patterns
            if (normalizedWords.length > 0) {
                const startWord = normalizedWords[0];
                const endWord = normalizedWords[normalizedWords.length - 1];
                patterns.messageStartPatterns[startWord] = (patterns.messageStartPatterns[startWord] || 0) + 1;
                patterns.messageEndPatterns[endWord] = (patterns.messageEndPatterns[endWord] || 0) + 1;
            }

            // Emoji analysis
            const emojis = content.match(/[\p{Emoji}]/gu) || [];
            emojis.forEach(emoji => {
                patterns.emojiFrequency[emoji] = (patterns.emojiFrequency[emoji] || 0) + 1;
            });
        });

        // Calculate final averages and metrics
        patterns.averageMessageLength = totalLength / messages.length;
        patterns.messageStructure.averageSentencesPerMessage = totalSentences / messages.length;
        patterns.messageStructure.averageWordsPerSentence = totalWords / totalSentences;

        // Sort and limit frequencies to top N items
        const topN = 10;
        const sortAndLimit = (obj) => Object.fromEntries(
            Object.entries(obj)
                .sort(([,a], [,b]) => b - a)
                .slice(0, topN)
        );

        patterns.wordFrequency = sortAndLimit(patterns.wordFrequency);
        patterns.commonPhrases = sortAndLimit(patterns.commonPhrases);
        patterns.messageStartPatterns = sortAndLimit(patterns.messageStartPatterns);
        patterns.messageEndPatterns = sortAndLimit(patterns.messageEndPatterns);
        patterns.emojiFrequency = sortAndLimit(patterns.emojiFrequency);

        return patterns;
    } catch (error) {
        console.error('Error analyzing writing patterns:', error);
        throw error;
    }
}; 