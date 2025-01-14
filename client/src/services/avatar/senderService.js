/**
 * Utility service for constructing avatar sender objects
 */

/**
 * Creates a sender object for an avatar message
 * @param {Object} baseUser - The user being impersonated
 * @param {Object} options - Additional options for the sender
 * @param {string} options.suffix - Suffix to append to username (default: '(Avatar)')
 * @param {string} options.botType - Type of bot (default: 'avatar')
 * @param {Object} options.metadata - Additional metadata for the sender
 * @returns {Object} The constructed sender object
 */
export function createAvatarSender(baseUser, options = {}) {
    const {
        suffix = '(Avatar)',
        botType = 'avatar',
        metadata = {}
    } = options;

    if (!baseUser || !baseUser.id || !baseUser.username) {
        throw new Error('Invalid base user provided');
    }

    return {
        id: baseUser.id,
        username: `${baseUser.username} ${suffix}`.trim(),
        avatar_url: baseUser.avatar_url,
        isBot: true,
        botType: botType,
        originalUser: {
            id: baseUser.id,
            username: baseUser.username,
            avatar_url: baseUser.avatar_url
        },
        metadata: {
            isAvatar: true,
            timestamp: new Date().toISOString(),
            ...metadata
        }
    };
}

/**
 * Checks if a sender object is an avatar bot
 * @param {Object} sender - The sender object to check
 * @returns {boolean} True if the sender is an avatar bot
 */
export function isAvatarSender(sender) {
    return sender?.isBot && sender?.botType === 'avatar';
}

/**
 * Gets the original user from an avatar sender object
 * @param {Object} sender - The avatar sender object
 * @returns {Object|null} The original user object or null if not an avatar
 */
export function getOriginalUser(sender) {
    if (!isAvatarSender(sender)) {
        return null;
    }
    return sender.originalUser || null;
}

/**
 * Updates an existing sender object with avatar properties
 * @param {Object} sender - The existing sender object
 * @param {Object} options - Options for the avatar properties
 * @returns {Object} The updated sender object
 */
export function updateSenderWithAvatar(sender, options = {}) {
    if (!sender) {
        throw new Error('No sender object provided');
    }

    return createAvatarSender(sender, {
        suffix: options.suffix,
        botType: options.botType,
        metadata: {
            ...sender.metadata,
            ...options.metadata
        }
    });
}

/**
 * Formats the display name for an avatar sender
 * @param {Object} sender - The sender object
 * @param {Object} options - Formatting options
 * @param {boolean} options.showOriginal - Whether to show the original username
 * @param {boolean} options.includeStatus - Whether to include online status
 * @returns {string} The formatted display name
 */
export function formatAvatarDisplayName(sender, options = {}) {
    if (!isAvatarSender(sender)) {
        return sender?.username || 'Unknown User';
    }

    const { showOriginal = false, includeStatus = false } = options;
    const originalName = sender.originalUser?.username || sender.username.split(' ')[0];
    const status = includeStatus && sender.status ? ` (${sender.status})` : '';
    
    return showOriginal
        ? `${originalName}'s Avatar${status}`
        : sender.username + status;
} 