import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import EmojiPicker from './EmojiPicker';

function MessageReactions({ reactions = [], messageId, onAddReaction }) {
    const [showPicker, setShowPicker] = useState(false);
    const containerRef = useRef(null);
    const timeoutRef = useRef(null);

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

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setShowPicker(false);
        }, 300); // Longer delay when leaving message cell
    };

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    return (
        <div 
            className="relative message-reaction" 
            ref={containerRef}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
        >
            {/* Show add reaction button on hover */}
            <div className={`${!reactions.length ? 'opacity-0 group-hover:opacity-100' : ''} transition-opacity duration-100`}>
                <button
                    className="text-rose-quartz hover:text-gunmetal dark:text-dark-text-secondary dark:hover:text-dark-text-primary p-0.5 rounded hover:bg-alice-blue dark:hover:bg-dark-bg-primary transition-colors duration-200"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowPicker(!showPicker);
                    }}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>

            {/* Emoji Picker */}
            {showPicker && (
                <div 
                    className="absolute left-full top-1/2 -translate-y-1/2 ml-1"
                    onMouseEnter={handleMouseEnter}
                >
                    <EmojiPicker
                        onSelect={(emoji) => {
                            onAddReaction(emoji);
                            setShowPicker(false);
                        }}
                        onClose={() => setShowPicker(false)}
                    />
                </div>
            )}
        </div>
    );
}

MessageReactions.propTypes = {
    reactions: PropTypes.arrayOf(PropTypes.shape({
        emoji: PropTypes.string.isRequired,
        count: PropTypes.number.isRequired,
    })),
    messageId: PropTypes.string.isRequired,
    onAddReaction: PropTypes.func.isRequired,
};

export default MessageReactions; 