import { getUser } from './auth';

// Add safety check constants
const SAFETY_CONSTRAINTS = {
    MAX_MESSAGE_LENGTH: 2000,
    MIN_CONVERSATION_HISTORY: 5,
    FORBIDDEN_CONTENT: [
        'personal information',
        'contact details',
        'financial information',
        'explicit content',
        'hate speech',
        'harassment',
        'threats'
    ]
};

/**
 * Validate inputs and enforce safety constraints for avatar prompts
 * @param {Object} params - Parameters to validate
 * @returns {Object} Validation result with success flag and any error messages
 */
const validateAvatarPrompt = ({ message, targetUser, conversationHistory, writingPatterns }) => {
    const errors = [];

    // Validate required parameters
    if (!message?.trim()) {
        errors.push('Message is required');
    }
    if (!targetUser?.id || !targetUser?.username) {
        errors.push('Valid target user is required');
    }
    if (!Array.isArray(conversationHistory)) {
        errors.push('Conversation history must be an array');
    }
    if (!writingPatterns || typeof writingPatterns !== 'object') {
        errors.push('Writing patterns analysis is required');
    }

    // Check message length
    if (message?.length > SAFETY_CONSTRAINTS.MAX_MESSAGE_LENGTH) {
        errors.push(`Message exceeds maximum length of ${SAFETY_CONSTRAINTS.MAX_MESSAGE_LENGTH} characters`);
    }

    // Check conversation history minimum
    if (conversationHistory?.length < SAFETY_CONSTRAINTS.MIN_CONVERSATION_HISTORY) {
        errors.push(`Insufficient conversation history. Minimum ${SAFETY_CONSTRAINTS.MIN_CONVERSATION_HISTORY} messages required`);
    }

    // Check for required writing pattern fields
    const requiredPatterns = ['averageMessageLength', 'capitalizationStyle', 'punctuationFrequency'];
    for (const pattern of requiredPatterns) {
        if (!writingPatterns?.[pattern]) {
            errors.push(`Missing required writing pattern: ${pattern}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Build a dynamic prompt for the avatar command
 * @param {Object} params - Parameters for building the prompt
 * @param {string} params.message - The user's message to respond to
 * @param {Object} params.targetUser - The user to impersonate
 * @param {Array} params.conversationHistory - Previous messages for context
 * @param {Object} params.writingPatterns - Analysis of the target user's writing patterns
 * @param {Object} params.impersonationParams - Parameters to control impersonation behavior
 * @param {number} params.impersonationParams.styleStrength - How strongly to match the writing style (0-1)
 * @param {boolean} params.impersonationParams.maintainContext - Whether to maintain conversation context
 * @param {boolean} params.impersonationParams.allowEmojiSubstitution - Whether to allow similar emoji substitution
 * @param {boolean} params.impersonationParams.enforceMessageLength - Whether to strictly enforce message length
 * @param {Object} params.styleOverrides - Custom style rules to inject or override
 * @param {Object} params.styleOverrides.tone - Override the emotional tone (e.g., 'casual', 'formal', 'excited')
 * @param {Array} params.styleOverrides.requiredPhrases - Phrases that must be included in the response
 * @param {Array} params.styleOverrides.forbiddenPhrases - Phrases that must not be used in the response
 * @param {Object} params.styleOverrides.formatting - Override formatting preferences
 * @param {Object} params.styleOverrides.customRules - Additional custom style rules to apply
 * @returns {Object} The constructed prompt with system and user messages
 * @throws {Error} If validation fails or safety checks are not met
 */
export const buildAvatarPrompt = ({ 
    message, 
    targetUser, 
    conversationHistory, 
    writingPatterns,
    impersonationParams = {
        styleStrength: 0.8,
        maintainContext: true,
        allowEmojiSubstitution: true,
        enforceMessageLength: false
    },
    styleOverrides = {}
}) => {
    // Run validation and safety checks
    const validation = validateAvatarPrompt({ message, targetUser, conversationHistory, writingPatterns });
    if (!validation.isValid) {
        throw new Error(`Avatar prompt validation failed: ${validation.errors.join(', ')}`);
    }

    // Get current user for context
    const currentUser = getUser();

    // Build style override instructions
    const styleOverrideInstructions = buildStyleOverrideInstructions(styleOverrides);

    // Add safety constraints to system prompt
    const safetyRules = [
        'Safety constraints to enforce:',
        '1. Do not disclose or request personal information',
        '2. Do not share contact details or private data',
        '3. Avoid explicit content and inappropriate topics',
        '4. Do not engage in harassment or threats',
        '5. Maintain appropriate and respectful communication',
        '6. Do not share financial information',
        '7. Avoid hate speech or discriminatory content',
        ''
    ];

    // Build the system prompt with writing style instructions
    const systemPrompt = [
        `You are now impersonating ${targetUser.username}. Respond to messages in their exact writing style.`,
        'Writing style characteristics to emulate:',
        `- Style strength: ${impersonationParams.styleStrength * 100}% adherence to patterns`,
        `- Average message length: ${Math.round(writingPatterns.averageMessageLength)} characters${impersonationParams.enforceMessageLength ? ' (strict)' : ' (flexible)'}`,
        `- Capitalization: ${getCapitalizationStyle(writingPatterns.capitalizationStyle)}`,
        `- Punctuation style: ${getPunctuationStyle(writingPatterns.punctuationFrequency)}`,
        `- Message structure: ${getMessageStructure(writingPatterns.messageStructure)}`,
        `- Common phrases: ${getTopPhrases(writingPatterns.commonPhrases)}`,
        `- Emoji usage: ${getEmojiStyle(writingPatterns.emojiFrequency)}${impersonationParams.allowEmojiSubstitution ? ' (similar emojis allowed)' : ' (exact matches only)'}`,
        `- Typical message starters: ${getTopPatterns(writingPatterns.messageStartPatterns)}`,
        `- Typical message endings: ${getTopPatterns(writingPatterns.messageEndPatterns)}`,
        `- Formatting preferences: ${getFormattingStyle(writingPatterns.formatting)}`,
        '',
        'Important rules to follow:',
        '1. Match their exact writing style, including capitalization, punctuation, and emoji usage',
        '2. Use their common phrases and sentence structures',
        `3. ${impersonationParams.enforceMessageLength ? 'Strictly maintain' : 'Try to maintain'} their typical message length`,
        '4. Never mention that you are an AI or impersonating them',
        '5. Stay in character at all times',
        `6. ${impersonationParams.maintainContext ? 'Consider and maintain conversation context' : 'Focus on the current message only'}`,
        `7. ${impersonationParams.allowEmojiSubstitution ? 'You may use similar emojis when exact matches aren\'t appropriate' : 'Only use emojis that appear in their history'}`,
        '',
        // Add safety rules
        ...safetyRules,
        // Add style override instructions if any exist
        ...(styleOverrideInstructions.length > 0 ? ['Style overrides to apply:', ...styleOverrideInstructions, ''] : [])
    ].join('\\n');

    // Build the conversation context
    const context = impersonationParams.maintainContext ? conversationHistory.map(msg => ({
        role: 'system',
        content: `Previous message from ${targetUser.username}: "${msg.content}"`
    })) : [];

    // Build the user message
    const userMessage = {
        role: 'user',
        content: `${currentUser.username}: ${message}`
    };

    return {
        messages: [
            { role: 'system', content: systemPrompt },
            ...context.slice(-10), // Only use last 10 messages for context
            userMessage
        ],
        impersonationParams, // Include parameters in response for reference
        styleOverrides, // Include style overrides in response for reference
        safetyChecks: {
            validated: true,
            constraintsEnforced: SAFETY_CONSTRAINTS
        }
    };
};

/**
 * Build instructions for style overrides
 * @param {Object} styleOverrides - The style overrides to apply
 * @returns {Array} Array of instruction strings
 */
const buildStyleOverrideInstructions = (styleOverrides) => {
    const instructions = [];
    
    if (styleOverrides.tone) {
        instructions.push(`- Use a ${styleOverrides.tone} tone while maintaining the user's style`);
    }
    
    if (styleOverrides.requiredPhrases?.length > 0) {
        instructions.push('- You must include these phrases in your response:');
        styleOverrides.requiredPhrases.forEach(phrase => {
            instructions.push(`  * "${phrase}"`);
        });
    }
    
    if (styleOverrides.forbiddenPhrases?.length > 0) {
        instructions.push('- Do not use any of these phrases:');
        styleOverrides.forbiddenPhrases.forEach(phrase => {
            instructions.push(`  * "${phrase}"`);
        });
    }
    
    if (styleOverrides.formatting) {
        const formattingRules = [];
        if (styleOverrides.formatting.useBold) formattingRules.push('use bold text');
        if (styleOverrides.formatting.useItalics) formattingRules.push('use italics');
        if (styleOverrides.formatting.useCodeBlocks) formattingRules.push('use code blocks');
        if (formattingRules.length > 0) {
            instructions.push(`- Override formatting: ${formattingRules.join(', ')}`);
        }
    }
    
    if (styleOverrides.customRules) {
        Object.entries(styleOverrides.customRules).forEach(([rule, value]) => {
            instructions.push(`- ${rule}: ${value}`);
        });
    }
    
    return instructions;
};

// Helper functions for formatting style information
const getCapitalizationStyle = (style) => {
    const total = style.allCaps + style.noCaps + style.properCaps + style.sentenceCase;
    if (total === 0) return 'normal capitalization';
    
    const styles = [];
    if (style.allCaps > 0) styles.push(`${Math.round(style.allCaps/total*100)}% ALL CAPS`);
    if (style.noCaps > 0) styles.push(`${Math.round(style.noCaps/total*100)}% no caps`);
    if (style.properCaps > 0) styles.push(`${Math.round(style.properCaps/total*100)}% Proper Caps`);
    if (style.sentenceCase > 0) styles.push(`${Math.round(style.sentenceCase/total*100)}% Sentence case`);
    
    return styles.join(', ');
};

const getPunctuationStyle = (freq) => {
    const styles = [];
    if (freq.exclamation > 0) styles.push(`frequent exclamation marks (${freq.exclamation} total)`);
    if (freq.question > 0) styles.push(`questions (${freq.question} total)`);
    if (freq.ellipsis > 0) styles.push(`ellipsis (${freq.ellipsis} total)`);
    if (freq.comma > 0) styles.push(`commas (${freq.comma} total)`);
    if (freq.semicolon > 0) styles.push(`semicolons (${freq.semicolon} total)`);
    
    return styles.length > 0 ? styles.join(', ') : 'minimal punctuation';
};

const getMessageStructure = (structure) => {
    return [
        `${Math.round(structure.averageSentencesPerMessage)} sentences per message`,
        `${Math.round(structure.averageWordsPerSentence)} words per sentence`,
        structure.paragraphBreakFrequency > 0 ? 'uses paragraph breaks' : 'no paragraph breaks'
    ].join(', ');
};

const getTopPhrases = (phrases) => {
    return Object.entries(phrases)
        .slice(0, 3)
        .map(([phrase, count]) => `"${phrase}" (${count}x)`)
        .join(', ');
};

const getEmojiStyle = (emojis) => {
    const total = Object.values(emojis).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 'no emoji usage';
    
    return `frequently uses: ${Object.entries(emojis)
        .slice(0, 3)
        .map(([emoji, count]) => `${emoji} (${count}x)`)
        .join(' ')}`;
};

const getTopPatterns = (patterns) => {
    return Object.entries(patterns)
        .slice(0, 3)
        .map(([word, count]) => `"${word}" (${count}x)`)
        .join(', ');
};

const getFormattingStyle = (formatting) => {
    const styles = [];
    if (formatting.boldCount > 0) styles.push(`bold text (${formatting.boldCount}x)`);
    if (formatting.italicCount > 0) styles.push(`italics (${formatting.italicCount}x)`);
    if (formatting.codeBlockCount > 0) styles.push(`code blocks (${formatting.codeBlockCount}x)`);
    if (formatting.linkCount > 0) styles.push(`links (${formatting.linkCount}x)`);
    
    return styles.length > 0 ? styles.join(', ') : 'no special formatting';
}; 