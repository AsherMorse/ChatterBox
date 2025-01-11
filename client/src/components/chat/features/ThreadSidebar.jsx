import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import { getThreadMessages, sendThreadReply, getMessageSender } from '../../../services/api/messageService';
import realtimeService from '../../../services/realtime/realtimeService';

function ThreadSidebar({ isOpen, onClose, parentMessage }) {
    const [replyMessage, setReplyMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const messagesContainerRef = useRef(null);

    // Add scroll handler to detect when user scrolls up
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShouldAutoScroll(isNearBottom);
        }
    };

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
            setShouldAutoScroll(true);
        }
    };

    useEffect(() => {
        if (isOpen && parentMessage) {
            loadThreadMessages();

            // Subscribe to realtime updates
            const channel = realtimeService.subscribeToThread(parentMessage.id, handleRealtimeMessage);

            return () => {
                realtimeService.unsubscribeFromThread(parentMessage.id);
            };
        }
    }, [isOpen, parentMessage]);

    // Clear messages when parent message changes
    useEffect(() => {
        setMessages([]);
        setShouldAutoScroll(true);
    }, [parentMessage?.id]);

    // Add effect to scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleRealtimeMessage = async (event) => {
        switch (event.type) {
            case 'new_message':
                let messageWithSender = event.message;
                if (!event.message.sender) {
                    const sender = await getMessageSender(event.message.sender_id);
                    messageWithSender = { ...event.message, sender };
                }
                // Only add the message if it's not already in the list
                setMessages(prev => {
                    if (prev.some(msg => msg.id === messageWithSender.id)) {
                        return prev;
                    }
                    return [...prev, messageWithSender];
                });
                break;
            case 'message_deleted':
                setMessages(prev => prev.filter(msg => msg.id !== event.messageId));
                break;
            case 'message_updated':
                setMessages(prev => prev.map(msg =>
                    msg.id === event.message.id ? { ...msg, ...event.message } : msg
                ));
                break;
        }
    };

    const loadThreadMessages = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const threadMessages = await getThreadMessages(parentMessage.id);
            // Ensure we don't add duplicates when setting initial messages
            const uniqueMessages = [parentMessage];
            threadMessages.forEach(msg => {
                if (!uniqueMessages.some(m => m.id === msg.id)) {
                    uniqueMessages.push(msg);
                }
            });
            setMessages(uniqueMessages);
        } catch (err) {
            console.error('Error loading thread messages:', err);
            setError('Failed to load thread messages');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim() || !parentMessage) return;

        try {
            setIsLoading(true);
            const newReply = await sendThreadReply(parentMessage.id, replyMessage.trim());
            setMessages(prev => [...prev, newReply]);
            setReplyMessage('');
        } catch (err) {
            console.error('Error sending reply:', err);
            setError('Failed to send reply');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div 
            className={`
                fixed top-[80px] h-[calc(100vh-80px-16px)] w-[400px] 
                bg-white dark:bg-dark-bg-secondary
                border border-powder-blue dark:border-dark-border
                transition-all duration-200
                shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(0,0,0,0.3)]
                rounded-2xl
                overflow-hidden
                z-40
                ${isOpen ? 'right-4 opacity-100' : '-right-[420px] opacity-0 pointer-events-none'}
            `}
        >
            {/* Header */}
            <div className="h-16 px-6 border-b border-powder-blue dark:border-dark-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gunmetal dark:text-dark-text-primary">Thread</h2>
                <button
                    onClick={onClose}
                    className="p-2 text-rose-quartz hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-lg transition-colors duration-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content Area */}
            <div className="h-[calc(100%-4rem)] flex flex-col">
                {/* Messages Area */}
                <div 
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-6 relative"
                >
                    {error && (
                        <div className="text-red-500 dark:text-red-400 text-sm mb-4 text-center">
                            {error}
                        </div>
                    )}
                    <div className="space-y-6">
                        {messages.map((message, index) => (
                            <div key={message.id} className={`flex gap-3 group ${index === 0 ? 'p-4 bg-alice-blue dark:bg-dark-bg-primary border border-powder-blue dark:border-dark-border rounded-xl' : ''}`}>
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden flex-shrink-0">
                                    {message.sender?.avatar_url ? (
                                        <img
                                            src={message.sender.avatar_url}
                                            alt={message.sender.username}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm text-gunmetal dark:text-dark-text-primary">
                                            {message.sender?.username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                </div>

                                {/* Message Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="font-bold text-base text-gunmetal dark:text-dark-text-primary">
                                            {message.sender?.username}
                                        </span>
                                        <span className="text-xs text-rose-quartz dark:text-dark-text-secondary">
                                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="prose prose-sm max-w-none text-sm leading-5 text-gunmetal dark:text-dark-text-primary">
                                        {message.content}
                                    </div>
                                    {index === 0 && messages.length > 1 && (
                                        <div className="mt-2 text-xs text-rose-quartz dark:text-dark-text-secondary">
                                            {messages.length - 1} {messages.length === 2 ? 'reply' : 'replies'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-powder-blue dark:border-dark-border bg-[#F8FAFD] dark:bg-dark-bg-secondary relative z-10">
                    {/* Scroll to bottom button */}
                    {!shouldAutoScroll && (
                        <div className="absolute right-8 -top-14 z-10">
                            <button
                                onClick={() => {
                                    setShouldAutoScroll(true);
                                    scrollToBottom();
                                }}
                                className="p-2 
                                    bg-[#F8FAFD] dark:bg-dark-bg-secondary 
                                    border border-[#B8C5D6] dark:border-dark-border rounded-lg shadow-sm
                                    text-rose-quartz dark:text-dark-text-secondary
                                    hover:text-emerald dark:hover:text-emerald
                                    hover:bg-white dark:hover:bg-dark-bg-primary transition-colors duration-200"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Reply in thread..."
                                className="w-full px-4 py-2.5 rounded-xl border border-powder-blue dark:border-dark-border hover:border-emerald dark:hover:border-emerald bg-white dark:bg-dark-bg-primary dark:text-dark-text-primary focus:outline-none"
                                disabled={isLoading}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button
                                    type="submit"
                                    disabled={!replyMessage.trim() || isLoading}
                                    className="p-2 text-emerald hover:text-emerald-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

ThreadSidebar.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    parentMessage: PropTypes.shape({
        id: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        created_at: PropTypes.string.isRequired,
        sender: PropTypes.shape({
            id: PropTypes.string.isRequired,
            username: PropTypes.string.isRequired,
            avatar_url: PropTypes.string
        }).isRequired
    })
};

export default ThreadSidebar; 