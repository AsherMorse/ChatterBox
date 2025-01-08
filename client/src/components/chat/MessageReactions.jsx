import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import EmojiPicker from './EmojiPicker';
import { addReaction, removeReaction, getMessageReactions } from '../../services/api/messageService';
import { reactionEvents } from '../../services/realtime/realtimeService';

function MessageReactions({ messageId, currentUserId }) {
    const [showPicker, setShowPicker] = useState(false);
    const [reactions, setReactions] = useState([]);
    const [removingReactions, setRemovingReactions] = useState(new Set());
    const [isPickerMounted, setIsPickerMounted] = useState(false);
    const containerRef = useRef(null);
    const timeoutRef = useRef(null);
    const animationTimeoutRef = useRef(null);

    const loadReactions = useCallback(async () => {
        try {
            console.log('Loading reactions for message:', messageId);
            const reactionData = await getMessageReactions(messageId);
            console.log('Loaded reactions:', reactionData);
            setReactions(reactionData);
            setRemovingReactions(new Set());
        } catch (error) {
            console.error('Error loading reactions:', error);
        }
    }, [messageId]);

    useEffect(() => {
        loadReactions();

        // Subscribe to reaction changes
        reactionEvents.addListener(messageId, loadReactions);

        return () => {
            reactionEvents.removeListener(messageId);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [messageId, loadReactions]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowPicker(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (showPicker) {
            setIsPickerMounted(true);
        } else {
            // Delay unmounting to allow exit animation
            animationTimeoutRef.current = setTimeout(() => {
                setIsPickerMounted(false);
            }, 200); // Match this with the animation duration
        }

        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, [showPicker]);

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowPicker(false);
        }, 300);
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const handleReactionClick = async (emoji, hasReacted) => {
        try {
            if (hasReacted) {
                // Start removal animation
                setRemovingReactions(prev => new Set([...prev, emoji]));
                // Wait for animation
                await new Promise(resolve => setTimeout(resolve, 150));
                await removeReaction(messageId, emoji);
            } else {
                await addReaction(messageId, emoji);
            }
        } catch (error) {
            console.error('Error handling reaction:', error);
            setRemovingReactions(prev => {
                const next = new Set(prev);
                next.delete(emoji);
                return next;
            });
            await loadReactions();
        }
    };

    return (
        <div 
            className="relative message-reaction flex items-center gap-1.5" 
            ref={containerRef}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
        >
            {/* Emoji Picker */}
            {isPickerMounted && (
                <div 
                    className={`
                        absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50
                        shadow-lg rounded-lg bg-white dark:bg-dark-bg-secondary
                        border border-powder-blue dark:border-dark-border
                        ${showPicker ? 'animate-slide-in' : 'animate-slide-out'}
                    `}
                    onMouseEnter={handleMouseEnter}
                >
                    <EmojiPicker
                        onSelect={(emoji) => {
                            handleReactionClick(emoji, false);
                            setShowPicker(false);
                        }}
                        onClose={() => setShowPicker(false)}
                    />
                </div>
            )}

            {/* Reactions Container */}
            <div className="reactions-container">
                {reactions.map(({ emoji, count, users }) => {
                    const hasReacted = users.some(user => user.id === currentUserId);
                    const isRemoving = removingReactions.has(emoji);
                    
                    return (
                        <button
                            key={emoji}
                            onClick={() => !isRemoving && handleReactionClick(emoji, hasReacted)}
                            className={`
                                reaction-button
                                inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
                                ${hasReacted 
                                    ? 'bg-emerald/10 text-emerald hover:bg-emerald/20' 
                                    : 'bg-alice-blue text-rose-quartz hover:bg-powder-blue dark:bg-dark-bg-primary dark:text-dark-text-secondary dark:hover:bg-dark-bg-secondary'
                                }
                                transition-all duration-200 ease-in-out transform hover:scale-105
                                ${isRemoving ? 'animate-fade-out pointer-events-none' : 'animate-fade-in'}
                            `}
                            title={users.map(u => u.username).join(', ')}
                            disabled={isRemoving}
                        >
                            <span className="text-sm leading-none">{emoji}</span>
                            <span className="leading-none">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Add reaction button */}
            <div 
                className={`
                    ${reactions.length === 0 ? 'opacity-0 group-hover:opacity-100' : ''} 
                    transition-all duration-200
                `}
            >
                <button
                    className={`
                        flex items-center justify-center w-6 h-6
                        text-rose-quartz hover:text-emerald
                        dark:text-dark-text-secondary dark:hover:text-emerald
                        rounded-full hover:bg-alice-blue dark:hover:bg-dark-bg-primary
                        transition-all duration-200 ease-in-out transform hover:scale-105
                        ${showPicker ? 'rotate-180 text-emerald' : ''}
                    `}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowPicker(!showPicker);
                    }}
                >
                    <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

MessageReactions.propTypes = {
    messageId: PropTypes.string.isRequired,
    currentUserId: PropTypes.string.isRequired
};

export default MessageReactions; 