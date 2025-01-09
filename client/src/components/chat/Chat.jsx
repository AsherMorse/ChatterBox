import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ChannelList from './ChannelList';
import DirectMessageList from './DirectMessageList';
import CreateChannelModal from './CreateChannelModal';
import CreateDMModal from './CreateDMModal';
import DirectMessageHeader from './DirectMessageHeader';
import { getMessages, sendMessage, getMessageSender } from '../../services/api/messageService';
import { getDMMessages, sendDMMessage } from '../../services/api/dmService';
import realtimeService from '../../services/realtime/realtimeService';
import Header from '../common/Header';
import PropTypes from 'prop-types';
import { getUser } from '../../services/api/auth';
import MessageReactions from './MessageReactions';

function Chat({ onLogout }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateDMModalOpen, setIsCreateDMModalOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const typingChannelRef = useRef(null);
    const currentMessagesRef = useRef(messages);
    const currentUser = getUser();
    const currentChannelId = searchParams.get('channel');
    const currentDMId = searchParams.get('dm');
    const navigate = useNavigate();

    // Keep currentMessagesRef in sync with messages
    useEffect(() => {
        currentMessagesRef.current = messages;
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!currentChannelId && !currentDMId) {
            setMessages([]);
            setTypingUsers([]);
            return;
        }

        // Clear messages when changing channels/DMs
        setMessages([]);
        setTypingUsers([]);

        // Subscribe to realtime messages
        const messageChannel = currentChannelId 
            ? realtimeService.subscribeToChannel(currentChannelId, handleRealtimeMessage)
            : realtimeService.subscribeToDM(currentDMId, handleRealtimeMessage);

        // Subscribe to typing indicators (only for channels)
        let typingChannel;
        if (currentChannelId) {
            typingChannel = realtimeService.subscribeToTyping(currentChannelId, (typingUsers) => {
                console.log('Typing users update:', typingUsers);
                setTypingUsers(
                    typingUsers
                        .filter(user => user.id !== currentUser.id)
                        .map(user => user.username)
                );
            });
            typingChannelRef.current = typingChannel;
        }

        // Load initial messages
        const loadMessages = async () => {
            try {
                const loadedMessages = currentChannelId 
                    ? await getMessages(currentChannelId)
                    : await getDMMessages(currentDMId);
                setMessages(loadedMessages);
                scrollToBottom();
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        loadMessages();

        return () => {
            // Cleanup message subscription
            if (currentChannelId) {
                realtimeService.unsubscribeFromChannel(currentChannelId);
            } else if (currentDMId) {
                realtimeService.unsubscribeFromDM(currentDMId);
            }
            
            // Cleanup typing indicators
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (typingChannelRef.current) {
                realtimeService.stopTyping(typingChannelRef.current);
                typingChannelRef.current = null;
            }
        };
    }, [currentChannelId, currentDMId, currentUser.id]);

    const handleRealtimeMessage = (event) => {
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
            case 'reaction_change':
                console.log('Handling reaction change for message:', event.messageId);
                console.log('Current messages:', currentMessagesRef.current);
                const targetMessage = currentMessagesRef.current.find(msg => msg.id === event.messageId);
                console.log('Found target message:', targetMessage);
                if (targetMessage) {
                    console.log('Found message, triggering reaction refresh');
                } else {
                    console.log('Message not found in current conversation');
                }
                break;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            if (currentChannelId) {
                const message = {
                    content: newMessage.trim(),
                    channel_id: currentChannelId
                };
                await sendMessage(message);
            } else if (currentDMId) {
                await sendDMMessage(currentDMId, newMessage.trim());
            }
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = () => {
        if (!currentChannelId || !typingChannelRef.current) {
            console.log('No channel selected or no typing channel, skipping typing indicator');
            return;
        }

        console.log('Starting typing indicator for user:', currentUser.username);
        realtimeService.startTyping(typingChannelRef.current, currentUser);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            console.log('Stopping typing indicator for user:', currentUser.username);
            if (typingChannelRef.current) {
                realtimeService.stopTyping(typingChannelRef.current);
            }
        }, 3000);
    };

    const handleChannelSelect = (channelId) => {
        // Clear typing state when changing channels
        if (typingChannelRef.current) {
            realtimeService.stopTyping(typingChannelRef.current);
            typingChannelRef.current = null;
        }
        setSearchParams({ channel: channelId });
    };

    const handleDMSelect = (dmId) => {
        // Clear typing state when changing DMs
        if (typingChannelRef.current) {
            realtimeService.stopTyping(typingChannelRef.current);
            typingChannelRef.current = null;
        }
        setSearchParams({ dm: dmId });
    };

    const handleCreateDM = (dmId) => {
        // The dmId from createDMConversation comes as an object with dm_id property
        const actualDmId = typeof dmId === 'object' ? dmId.dm_id : dmId;
        handleDMSelect(actualDmId);
        setIsCreateDMModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-alice-blue dark:bg-dark-bg-primary transition-colors duration-200">
            <Header onLogout={onLogout} />
            <div className="flex h-[calc(100vh-64px)]">
                {/* Sidebar */}
                <div className="w-72 bg-white dark:bg-dark-bg-secondary border-r border-powder-blue dark:border-dark-border transition-colors duration-200 flex flex-col">
                    <div className="p-6 flex-1 overflow-y-auto">
                        {/* Channels Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gunmetal dark:text-dark-text-primary">Workspaces</h2>
                            </div>
                            <ChannelList
                                onChannelSelect={handleChannelSelect}
                                selectedChannelId={currentChannelId}
                            />
                        </div>

                        {/* Direct Messages Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gunmetal dark:text-dark-text-primary">Direct Messages</h2>
                                <button
                                    onClick={() => setIsCreateDMModalOpen(true)}
                                    className="p-1 text-rose-quartz hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200"
                                    title="New Message"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                            <DirectMessageList
                                onDMSelect={handleDMSelect}
                                selectedDMId={currentDMId}
                            />
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="p-4 border-t border-powder-blue dark:border-dark-border flex items-center">
                        <div className="w-10 h-10 rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden mr-3">
                            {currentUser?.avatar_url ? (
                                <img
                                    src={currentUser.avatar_url}
                                    alt={currentUser.username}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-base font-medium text-gunmetal dark:text-dark-text-primary">
                                    {currentUser?.username?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-base text-gunmetal dark:text-dark-text-primary truncate">
                                {currentUser?.username || 'Unknown User'}
                            </div>
                        </div>
                        <button 
                            onClick={onLogout}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-rose-quartz hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200 rounded-lg hover:bg-alice-blue dark:hover:bg-dark-bg-primary"
                        >
                            <span>Sign out</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-dark-bg-secondary">
                    {/* Chat Header */}
                    {currentChannelId && (
                        <div className="h-16 px-6 border-b border-powder-blue dark:border-dark-border flex items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl text-gunmetal dark:text-dark-text-primary">#</span>
                                <h2 className="font-bold text-base text-gunmetal dark:text-dark-text-primary">
                                    {/* Replace with actual channel name */}
                                    General
                                </h2>
                            </div>
                        </div>
                    )}
                    {currentDMId && (
                        <DirectMessageHeader user={messages[0]?.sender} />
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {/* Messages */}
                        <div className="space-y-1">
                            {messages.map((message, index) => {
                                const isFirstInGroup = index === 0 || messages[index - 1].sender?.id !== message.sender?.id;
                                const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender?.id !== message.sender?.id;

                                return (
                                    <React.Fragment key={message.id}>
                                        <div
                                            className="group flex items-start hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-lg py-0.5 px-2.5 transition-colors duration-200"
                                            onMouseEnter={() => {
                                                const reactionComponent = document.querySelector(`#message-reactions-${message.id}`);
                                                if (reactionComponent) {
                                                    reactionComponent.dispatchEvent(new Event('mouseenter'));
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                const toElement = e.relatedTarget;
                                                const isMovingToAnotherMessage = toElement?.closest('.group');
                                                
                                                if (!isMovingToAnotherMessage) {
                                                    const reactionComponent = document.querySelector(`#message-reactions-${message.id}`);
                                                    if (reactionComponent) {
                                                        reactionComponent.dispatchEvent(new Event('mouseleave'));
                                                    }
                                                }
                                            }}
                                        >
                                            <div className="w-9 flex-shrink-0">
                                                {isFirstInGroup && (
                                                    <div className="w-9 h-9 rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden mt-0.5">
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
                                                    <div className="flex items-baseline gap-1.5 mb-0.5">
                                                        <span className="font-bold text-base text-gunmetal dark:text-dark-text-primary">
                                                            {message.sender?.username || 'Unknown User'}
                                                        </span>
                                                        <span className="text-xs text-rose-quartz dark:text-dark-text-secondary">
                                                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 group">
                                                        <div className="prose prose-sm max-w-none text-sm leading-5 text-gunmetal dark:text-dark-text-primary">
                                                            {message.content}
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <div id={`message-reactions-${message.id}`} className="flex-shrink-0">
                                                                <MessageReactions 
                                                                    messageId={message.id}
                                                                    currentUserId={currentUser.id}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {isLastInGroup && <div className="h-2" />}
                                    </React.Fragment>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Message Input */}
                    <div className="px-6 py-4 border-t border-powder-blue dark:border-dark-border">
                        <form onSubmit={handleSendMessage}>
                            <div className="relative">
                                {typingUsers.length > 0 && (
                                    <div className="absolute -top-10 left-4 transform animate-typingIndicator">
                                        <div className="bg-white dark:bg-dark-bg-primary shadow-lg rounded-lg px-3 py-1.5 border border-powder-blue dark:border-dark-border">
                                            <div className="flex items-center gap-2">
                                                <div className="flex space-x-1">
                                                    <div className="w-1.5 h-1.5 bg-emerald rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                    <div className="w-1.5 h-1.5 bg-emerald rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                    <div className="w-1.5 h-1.5 bg-emerald rounded-full animate-bounce"></div>
                                                </div>
                                                <span className="text-sm text-rose-quartz dark:text-dark-text-secondary whitespace-nowrap">
                                                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    placeholder={currentChannelId ? "Message #general" : "Send a message"}
                                    className="w-full px-4 py-2 bg-alice-blue dark:bg-dark-bg-primary border border-powder-blue dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald placeholder-rose-quartz dark:placeholder-dark-text-secondary text-gunmetal dark:text-dark-text-primary"
                                />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            {/* Modals */}
            <CreateChannelModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onChannelCreated={(channel) => {
                    handleChannelSelect(channel.id);
                    setIsCreateModalOpen(false);
                }}
            />
            <CreateDMModal
                isOpen={isCreateDMModalOpen}
                onClose={() => setIsCreateDMModalOpen(false)}
                onDMCreated={handleCreateDM}
            />
        </div>
    );
}

Chat.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default Chat; 