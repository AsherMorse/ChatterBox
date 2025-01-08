import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ChannelList from './ChannelList';
import CreateChannelModal from './CreateChannelModal';
import { getMessages, sendMessage, getMessageSender } from '../../services/api/messageService';
import realtimeService from '../../services/realtime/realtimeService';
import Header from '../common/Header';
import PropTypes from 'prop-types';
import { getUser } from '../../services/api/auth';

function Chat({ onLogout }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const typingChannelRef = useRef(null);
    const currentUser = getUser();
    const currentChannelId = searchParams.get('channel');
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!currentChannelId) {
            setMessages([]);
            setTypingUsers([]);
            return;
        }

        // Clear messages when changing channels
        setMessages([]);
        setTypingUsers([]);

        // Subscribe to realtime messages
        const messageChannel = realtimeService.subscribeToChannel(currentChannelId, (event) => {
            let messageWithSender;
            switch (event.type) {
                case 'new_message':
                    messageWithSender = {
                        ...event.message,
                        sender: event.message.sender || {
                            id: event.message.sender_id,
                            username: 'Loading...',
                            avatar_url: null
                        }
                    };
                    setMessages(prev => [...prev, messageWithSender]);

                    if (!event.message.sender) {
                        getMessageSender(event.message.sender_id)
                            .then(sender => {
                                setMessages(prev => prev.map(msg =>
                                    msg.id === event.message.id ? { ...msg, sender } : msg
                                ));
                            });
                    }
                    break;
                case 'message_updated':
                    messageWithSender = {
                        ...event.message,
                        sender: event.message.sender || {
                            id: event.message.sender_id,
                            username: 'Loading...',
                            avatar_url: null
                        }
                    };
                    setMessages(prev => prev.map(msg =>
                        msg.id === event.message.id ? messageWithSender : msg
                    ));

                    if (!event.message.sender) {
                        getMessageSender(event.message.sender_id)
                            .then(sender => {
                                setMessages(prev => prev.map(msg =>
                                    msg.id === event.message.id ? { ...msg, sender } : msg
                                ));
                            });
                    }
                    break;
                case 'message_deleted':
                    setMessages(prev => prev.filter(msg => msg.id !== event.messageId));
                    break;
            }
        });

        // Subscribe to typing indicators
        const typingChannel = realtimeService.subscribeToTyping(currentChannelId, (typingUsers) => {
            console.log('Typing users update:', typingUsers);
            setTypingUsers(
                typingUsers
                    .filter(user => user.id !== currentUser.id)
                    .map(user => user.username)
            );
        });

        // Load initial messages
        const loadMessages = async () => {
            try {
                const channelMessages = await getMessages(currentChannelId);
                setMessages(channelMessages);
                scrollToBottom();
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        loadMessages();

        return () => {
            // Cleanup message subscription
            realtimeService.unsubscribeFromChannel(currentChannelId);
            
            // Cleanup typing indicators
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (typingChannelRef.current === currentChannelId) {
                const channel = realtimeService.typingChannels.get(currentChannelId);
                if (channel) {
                    realtimeService.stopTyping(channel);
                }
                typingChannelRef.current = null;
            }
        };
    }, [currentChannelId, currentUser.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const message = {
                content: newMessage.trim(),
                channel_id: currentChannelId
            };
            await sendMessage(message);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = () => {
        if (!currentChannelId) {
            console.log('No channel selected, skipping typing indicator');
            return;
        }
        
        const channelKey = `typing:${currentChannelId}`;
        console.log('Looking up typing channel:', channelKey);
        const typingChannel = realtimeService.typingChannels.get(channelKey);
        
        if (!typingChannel) {
            console.log('No typing channel found for:', channelKey);
            return;
        }

        if (typingChannelRef.current !== currentChannelId) {
            console.log('Starting typing indicator for user:', currentUser.username);
            typingChannelRef.current = currentChannelId;
            realtimeService.startTyping(typingChannel, currentUser);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            console.log('Stopping typing indicator for user:', currentUser.username);
            if (typingChannel) {
                realtimeService.stopTyping(typingChannel);
            }
            typingChannelRef.current = null;
        }, 3000);
    };

    const handleChannelSelect = (channelId) => {
        // Clear typing state when changing channels
        if (typingChannelRef.current) {
            const channelKey = `typing:${typingChannelRef.current}`;
            const channel = realtimeService.typingChannels.get(channelKey);
            if (channel) {
                realtimeService.stopTyping(channel);
            }
            typingChannelRef.current = null;
        }
        setSearchParams({ channel: channelId });
    };

    return (
        <div className="min-h-screen bg-alice-blue dark:bg-dark-bg-primary transition-colors duration-200">
            <Header onLogout={onLogout} />
            <div className="flex h-[calc(100vh-64px)]">
                {/* Sidebar */}
                <div className="w-72 bg-white dark:bg-dark-bg-secondary border-r border-powder-blue dark:border-dark-border transition-colors duration-200">
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gunmetal dark:text-dark-text-primary mb-6">Channels</h2>
                        <ChannelList
                            onChannelSelect={handleChannelSelect}
                            selectedChannelId={currentChannelId}
                        />
                    </div>
                </div>

                {/* Main chat area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-dark-bg-secondary transition-colors duration-200">
                    {currentChannelId ? (
                        <>
                            {/* Messages area */}
                            <div className="flex-1 overflow-y-auto p-2">
                                <div className="space-y-0">
                                    {messages.map((message, index) => {
                                        const isFirstInGroup = index === 0 || messages[index - 1].sender?.id !== message.sender?.id;
                                        const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender?.id !== message.sender?.id;

                                        return (
                                            <div
                                                key={message.id}
                                                className={`group flex items-start hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-lg py-0.5 px-2.5 transition-colors duration-200 ${
                                                    isFirstInGroup ? 'mt-2' : 'mt-0'
                                                }`}
                                            >
                                                <div className="w-7 flex-shrink-0">
                                                    {isFirstInGroup && (
                                                        <div className="w-7 h-7 rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden">
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
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 ml-2.5">
                                                    {isFirstInGroup && (
                                                        <div className="flex items-baseline gap-1.5 mb-0">
                                                            <span className="font-semibold text-sm text-gunmetal dark:text-dark-text-primary">
                                                                {message.sender?.username || 'Unknown User'}
                                                            </span>
                                                            <span className="text-xs text-rose-quartz dark:text-dark-text-secondary">
                                                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="prose prose-sm max-w-none text-sm leading-5 text-gunmetal dark:text-dark-text-primary">
                                                        {message.content}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Typing indicator */}
                            {typingUsers.length > 0 && (
                                <div className="px-6 py-2 text-sm text-rose-quartz dark:text-dark-text-secondary animate-pulse">
                                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                </div>
                            )}

                            {/* Message input */}
                            <div className="p-4 border-t border-powder-blue dark:border-dark-border">
                                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                                    <div className="flex-1 flex flex-col space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                type="button"
                                                className="flex items-center justify-center w-9 h-9 text-rose-quartz hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200 rounded-lg hover:bg-alice-blue dark:hover:bg-dark-bg-primary"
                                                aria-label="Add attachment"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={newMessage}
                                                    onChange={(e) => {
                                                        setNewMessage(e.target.value);
                                                        handleTyping();
                                                    }}
                                                    placeholder="Type a message..."
                                                    className="w-full px-4 py-2 bg-alice-blue dark:bg-dark-bg-primary border border-powder-blue dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald placeholder-rose-quartz dark:placeholder-dark-text-secondary text-gunmetal dark:text-dark-text-primary transition-colors duration-200"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="flex items-center justify-center w-9 h-9 text-rose-quartz hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200 rounded-lg hover:bg-alice-blue dark:hover:bg-dark-bg-primary"
                                                aria-label="Add emoji"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                        {/* Image preview area - hidden by default */}
                                        <div className="hidden space-x-2">
                                            <div className="relative inline-block">
                                                <div className="relative w-20 h-20 rounded-lg bg-alice-blue dark:bg-dark-bg-primary border border-powder-blue dark:border-dark-border overflow-hidden">
                                                    <img src="" alt="" className="w-full h-full object-cover" />
                                                    <button className="absolute top-1 right-1 p-1 bg-gunmetal/50 hover:bg-gunmetal text-white rounded-full">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="flex items-center justify-center w-9 h-9 bg-emerald text-white rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald disabled:opacity-50 transition-all duration-200"
                                        aria-label="Send message"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center p-8">
                                <h3 className="text-2xl font-bold text-gunmetal dark:text-dark-text-primary mb-4">
                                    Welcome to ChatterBox! 👋
                                </h3>
                                <p className="text-rose-quartz dark:text-dark-text-secondary mb-8">
                                    Get started by joining or creating a channel
                                </p>
                                <div className="space-x-4">
                                    <button
                                        onClick={() => navigate('/browse-channels')}
                                        className="px-6 py-3 bg-emerald/10 text-emerald rounded-lg hover:bg-emerald/20 transition-colors duration-200"
                                    >
                                        Browse Channels
                                    </button>
                                    <button
                                        onClick={() => setIsCreateModalOpen(true)}
                                        className="px-6 py-3 bg-emerald/10 text-emerald rounded-lg hover:bg-emerald/20 transition-colors duration-200"
                                    >
                                        Create Channel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Create Channel Modal */}
            <CreateChannelModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onChannelCreated={(channel) => {
                    setIsCreateModalOpen(false);
                    handleChannelSelect(channel.id);
                }}
            />
        </div>
    );
}

Chat.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default Chat; 