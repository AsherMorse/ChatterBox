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
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Check if picker would be cut off at the bottom
            const bottomOverflow = rect.bottom > viewportHeight;
            // Check if picker would be cut off on the right
            const rightOverflow = rect.right > (viewportWidth - 20); // 20px safety margin
            
            setPosition({
                top: !bottomOverflow,
                right: rightOverflow // If it would overflow right, show on left side
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
            className={`absolute ${position.top ? 'top-1/2' : 'bottom-1/2'} 
                ${position.right ? 'right-full mr-2' : 'left-full ml-2'}
                -translate-y-1/2 bg-white dark:bg-dark-bg-secondary border border-powder-blue 
                dark:border-dark-border rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(0,0,0,0.3)]
                p-2 z-50 min-w-[180px]`}
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
                        className="w-8 h-8 flex items-center justify-center hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-lg transition-colors duration-200 text-base"
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