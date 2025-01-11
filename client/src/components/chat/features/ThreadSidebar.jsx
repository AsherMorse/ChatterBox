import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { getThreadMessages, sendThreadReply } from '../../../services/api/messageService';

function ThreadSidebar({ isOpen, onClose, parentMessage }) {
    const [replyMessage, setReplyMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && parentMessage) {
            loadThreadMessages();
        }
    }, [isOpen, parentMessage]);

    const loadThreadMessages = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const threadMessages = await getThreadMessages(parentMessage.id);
            setMessages([parentMessage, ...threadMessages]);
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
                <div className="flex-1 overflow-y-auto p-6">
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

                {/* Input Area */}
                <div className="p-4 border-t border-powder-blue dark:border-dark-border bg-[#F8FAFD] dark:bg-dark-bg-secondary relative z-10 rounded-b-2xl">
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