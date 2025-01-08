import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

function EmojiPicker({ onSelect, onClose }) {
    const pickerRef = useRef(null);
    const [position, setPosition] = useState({ top: true, right: true });

    useEffect(() => {
        function updatePosition() {
            if (!pickerRef.current) return;
            
            const rect = pickerRef.current.getBoundingClientRect();
            const chatContainer = document.querySelector('.messages-container');
            if (!chatContainer) return;
            
            const containerRect = chatContainer.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            // Check if picker would be cut off on the right
            const rightOverflow = rect.right > containerRect.right;
            // Check if picker would be cut off on the left
            const leftOverflow = rect.left < containerRect.left;
            // Check if picker would be cut off on the bottom
            const bottomOverflow = rect.bottom > viewportHeight;

            setPosition({
                top: !bottomOverflow,
                right: !rightOverflow && !leftOverflow // Keep right alignment unless it would overflow on either side
            });
        }

        // Initial position check after a brief delay to ensure proper layout
        setTimeout(updatePosition, 0);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        };
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose();
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div 
            ref={pickerRef}
            role="dialog"
            className={`absolute ${position.top ? 'top-full' : 'bottom-full'} ${position.right ? 'right-0' : 'left-0'} 
                ${position.top ? 'mt-1' : 'mb-1'} bg-white dark:bg-dark-bg-secondary border border-powder-blue 
                dark:border-dark-border rounded-lg shadow-lg p-1 z-50`}
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={(e) => {
                e.stopPropagation();
                const messageReactionDiv = e.currentTarget.closest('.message-reaction');
                if (messageReactionDiv) {
                    messageReactionDiv.dispatchEvent(new Event('mouseenter'));
                }
            }}
        >
            <div className="flex gap-0.5">
                {COMMON_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => {
                            onSelect(emoji);
                            onClose();
                        }}
                        className="w-7 h-7 flex items-center justify-center hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded transition-colors duration-200"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}

EmojiPicker.propTypes = {
    onSelect: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default EmojiPicker; 