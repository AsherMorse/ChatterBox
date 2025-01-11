import PropTypes from 'prop-types';
import { useState } from 'react';

function ThreadSidebar({ isOpen, onClose }) {
    const [replyMessage, setReplyMessage] = useState('');

    // Example messages
    const exampleMessages = [
        {
            id: 1,
            content: "This is the parent message that started the thread. It could be a longer message that wraps to multiple lines to show how that looks.",
            created_at: "2024-01-20T10:30:00Z",
            sender: {
                id: "1",
                username: "Sarah Chen",
                avatar_url: null
            }
        },
        {
            id: 2,
            content: "Good point! Let's discuss this further.",
            created_at: "2024-01-20T10:35:00Z",
            sender: {
                id: "2",
                username: "Alex Kim",
                avatar_url: null
            }
        },
        {
            id: 3,
            content: "I agree with Alex. We should consider the implications.",
            created_at: "2024-01-20T10:40:00Z",
            sender: {
                id: "3",
                username: "Jordan Lee",
                avatar_url: null
            }
        }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;
        // TODO: Handle reply submission
        setReplyMessage('');
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
                    <div className="space-y-6">
                        {exampleMessages.map((message, index) => (
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
                                    {index === 0 && (
                                        <div className="mt-2 text-xs text-rose-quartz dark:text-dark-text-secondary">
                                            {exampleMessages.length - 1} replies
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
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <button
                                    type="submit"
                                    disabled={!replyMessage.trim()}
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
    onClose: PropTypes.func.isRequired
};

export default ThreadSidebar; 