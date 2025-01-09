import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ChannelList from './ChannelList';
import DirectMessageList from './DirectMessageList';
import CreateChannelModal from './CreateChannelModal';
import CreateDMModal from './CreateDMModal';
import DirectMessageHeader from './DirectMessageHeader';
import { getMessages, sendMessage, getMessageSender } from '../../services/api/messageService';
import { getDMMessages, sendDMMessage, getDMConversation } from '../../services/api/dmService';
import { getChannel } from '../../services/api/channelService';
import realtimeService from '../../services/realtime/realtimeService';
import Header from '../common/Header';
import PropTypes from 'prop-types';
import { getUser } from '../../services/api/auth';
import MessageReactions from './MessageReactions';
import FileUpload from './FileUpload';
import FileAttachment from './FileAttachment';
import { uploadFile, createFileAttachment } from '../../services/api/fileService';

function Chat({ onLogout }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typingUsers, setTypingUsers] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateDMModalOpen, setIsCreateDMModalOpen] = useState(false);
    const [currentChannel, setCurrentChannel] = useState(null);
    const [currentDMConversation, setCurrentDMConversation] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [stagedFiles, setStagedFiles] = useState([]);
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

        // Subscribe to typing indicators
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
        } else if (currentDMId) {
            typingChannel = realtimeService.subscribeToTyping(`dm:${currentDMId}`, (typingUsers) => {
                console.log('Typing users update (DM):', typingUsers);
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
            // Cleanup typing channel subscription
            if (typingChannel) {
                if (currentChannelId) {
                    realtimeService.unsubscribeFromTyping(currentChannelId);
                } else if (currentDMId) {
                    realtimeService.unsubscribeFromTyping(`dm:${currentDMId}`);
                }
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
                    },
                    file_attachments: event.message.file_attachments || []
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
                    },
                    file_attachments: event.message.file_attachments || []
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

    const handleFileSelect = async (file) => {
        const MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25MB in bytes
        
        if (file.size > MAX_UPLOAD_SIZE) {
            alert(`File is too large. Maximum size is 25MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
            return;
        }

        try {
            setIsUploading(true);
            const uploadedFile = await uploadFile(file);
            
            // Add the file to staged files instead of creating attachment immediately
            setStagedFiles(prev => [...prev, {
                fileName: uploadedFile.fileName,
                fileType: uploadedFile.fileType,
                fileSize: uploadedFile.fileSize,
                fileUrl: uploadedFile.fileUrl,
                thumbnailUrl: uploadedFile.thumbnailUrl
            }]);
            
        } catch (error) {
            console.error('Error uploading file:', error);
            // Show specific error message to user
            if (error.statusCode === "413") {
                alert('File is too large to upload. Maximum size is 25MB.');
            } else {
                alert('Failed to upload file. Please try again.');
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveStagedFile = (index) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && stagedFiles.length === 0) return;

        try {
            // Send message first
            let sentMessage;
            const messageContent = newMessage.trim();
            
            if (currentChannelId) {
                const message = {
                    content: messageContent,
                    channel_id: currentChannelId
                };
                sentMessage = await sendMessage(message);
            } else if (currentDMId) {
                sentMessage = await sendDMMessage(currentDMId, messageContent);
            }

            // Create file attachments for staged files
            if (stagedFiles.length > 0 && sentMessage) {
                const attachmentPromises = stagedFiles.map(file => 
                    createFileAttachment({
                        messageId: sentMessage.id,
                        ...file
                    })
                );
                
                // Wait for all attachments to be created
                const createdAttachments = await Promise.all(attachmentPromises);
                
                // Update the message with attachments
                const updatedMessage = {
                    ...sentMessage,
                    file_attachments: createdAttachments
                };
                
                // Update the message in the state
                setMessages(prev => prev.map(msg => 
                    msg.id === sentMessage.id ? updatedMessage : msg
                ));

                // Clear staged files after successful upload
                setStagedFiles([]);
            }

            setNewMessage('');

            // Clear typing indicator after a 200ms delay
            setTimeout(() => {
                if (typingChannelRef.current) {
                    realtimeService.stopTyping(typingChannelRef.current);
                    if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                    }
                }
            }, 200);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = () => {
        if (!typingChannelRef.current) {
            console.log('No typing channel, skipping typing indicator');
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

    useEffect(() => {
        if (currentChannelId) {
            // Fetch channel details
            const fetchChannel = async () => {
                try {
                    const data = await getChannel(currentChannelId);
                    setCurrentChannel(data);
                } catch (error) {
                    console.error('Error fetching channel:', error);
                }
            };
            fetchChannel();
            setCurrentDMConversation(null);
        } else if (currentDMId) {
            // Fetch DM conversation details
            const fetchDMConversation = async () => {
                try {
                    const data = await getDMConversation(currentDMId);
                    setCurrentDMConversation(data);
                } catch (error) {
                    console.error('Error fetching DM conversation:', error);
                }
            };
            fetchDMConversation();
            setCurrentChannel(null);
        } else {
            setCurrentChannel(null);
            setCurrentDMConversation(null);
        }
    }, [currentChannelId, currentDMId]);

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
                                    {currentChannel?.name || 'Loading...'}
                                </h2>
                            </div>
                        </div>
                    )}
                    {currentDMId && currentDMConversation && (
                        <DirectMessageHeader 
                            user={currentDMConversation.users.find(u => u.id !== currentUser.id)} 
                        />
                    )}

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {/* Messages */}
                        <div className="space-y-0.5">
                            {messages.map((message, index) => {
                                const isFirstInGroup = index === 0 || messages[index - 1].sender?.id !== message.sender?.id;
                                const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender?.id !== message.sender?.id;

                                return (
                                    <React.Fragment key={message.id}>
                                        <div
                                            className={`
                                                group flex items-start hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-lg 
                                                ${!isFirstInGroup ? '-mt-2' : ''}
                                                py-px px-2.5 transition-colors duration-200
                                            `}
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
                                                    <div className="w-9 h-9 rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden">
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
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className="font-bold text-base text-gunmetal dark:text-dark-text-primary">
                                                            {message.sender?.username || 'Unknown User'}
                                                        </span>
                                                        <span className="text-xs text-rose-quartz dark:text-dark-text-secondary">
                                                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 group -mt-0.5">
                                                        <div className="prose prose-sm max-w-none text-sm leading-5 text-gunmetal dark:text-dark-text-primary">
                                                            {message.content}
                                                        </div>
                                                        {/* Only show reactions for text messages */}
                                                        {(!message.file_attachments || message.file_attachments.length === 0) && (
                                                            <div className="flex-shrink-0">
                                                                <div id={`message-reactions-${message.id}`} className="flex-shrink-0">
                                                                    <MessageReactions 
                                                                        messageId={message.id}
                                                                        currentUserId={currentUser.id}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Render file attachments */}
                                                    {message.file_attachments && message.file_attachments.length > 0 && (
                                                        <div className="mt-0.5 flex flex-col items-center w-full">
                                                            {message.file_attachments.map((attachment, index) => (
                                                                <div key={index} className="flex justify-center w-full">
                                                                    <FileAttachment 
                                                                        attachment={{
                                                                            fileName: attachment.file_name,
                                                                            fileType: attachment.file_type,
                                                                            fileSize: attachment.file_size,
                                                                            fileUrl: attachment.file_url,
                                                                            thumbnailUrl: attachment.thumbnail_url
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Message Input */}
                    <div className="px-6 py-4 border-t border-powder-blue dark:border-dark-border">
                        {/* Show staged files */}
                        {stagedFiles.length > 0 && (
                            <div className="flex flex-col items-center gap-2 mb-2">
                                {stagedFiles.map((file, index) => (
                                    <div 
                                        key={index} 
                                        className="flex items-center gap-1 bg-gray-100 dark:bg-dark-bg-secondary rounded px-2 py-1"
                                    >
                                        <span className="text-sm text-gray-600 dark:text-dark-text-secondary truncate max-w-[150px]">
                                            {file.fileName}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveStagedFile(index)}
                                            className="text-gray-500 hover:text-red-500 dark:text-dark-text-secondary"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <FileUpload 
                                onFileSelect={handleFileSelect} 
                                disabled={isUploading || (!currentChannelId && !currentDMId)} 
                            />
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    handleTyping();
                                }}
                                placeholder="Type a message..."
                                className="flex-1 p-2 rounded border border-gray-300 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-dark-text-primary"
                                disabled={!currentChannelId && !currentDMId}
                            />
                            <button
                                type="submit"
                                disabled={(!newMessage.trim() && stagedFiles.length === 0) || (!currentChannelId && !currentDMId)}
                                className="px-4 py-2 bg-emerald text-white rounded hover:bg-emerald-dark disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send
                            </button>
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