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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const typingChannelRef = useRef(null);
    const currentMessagesRef = useRef(messages);
    const currentUser = getUser();
    const currentChannelId = searchParams.get('channel');
    const currentDMId = searchParams.get('dm');
    const navigate = useNavigate();
    const [isTypingVisible, setIsTypingVisible] = useState('hidden');

    // Initialize sidebar state based on screen size
    useEffect(() => {
        const handleResize = () => {
            setIsSidebarOpen(window.innerWidth >= 1024); // 1024px is the 'lg' breakpoint in Tailwind
        };

        // Set initial state
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            // Ensure we unsubscribe from any existing typing channel first
            if (typingChannelRef.current) {
                realtimeService.stopTyping(typingChannelRef.current);
                realtimeService.unsubscribeFromTyping(currentChannelId);
            }
            
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
            // Ensure we unsubscribe from any existing typing channel first
            if (typingChannelRef.current) {
                realtimeService.stopTyping(typingChannelRef.current);
                realtimeService.unsubscribeFromTyping(`dm:${currentDMId}`);
            }
            
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
                if (currentChannelId) {
                    realtimeService.unsubscribeFromTyping(currentChannelId);
                } else if (currentDMId) {
                    realtimeService.unsubscribeFromTyping(`dm:${currentDMId}`);
                }
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
                    }
                };

                // If we're receiving a file attachment update, merge it with existing attachments
                if (event.message.file_attachments) {
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === event.message.id) {
                            // Deduplicate file attachments based on their ID
                            const existingAttachments = msg.file_attachments || [];
                            const newAttachments = event.message.file_attachments;
                            const mergedAttachments = [...existingAttachments];
                            
                            for (const newAttachment of newAttachments) {
                                const existingIndex = mergedAttachments.findIndex(att => att.id === newAttachment.id);
                                if (existingIndex === -1) {
                                    // Add new attachment if it doesn't exist
                                    mergedAttachments.push(newAttachment);
                                } else {
                                    // Update existing attachment with new data
                                    mergedAttachments[existingIndex] = newAttachment;
                                }
                            }
                            
                            return {
                                ...msg,
                                ...messageWithSender,
                                file_attachments: mergedAttachments
                            };
                        }
                        return msg;
                    }));
                } else {
                    setMessages(prev => prev.map(msg =>
                        msg.id === event.message.id ? { ...msg, ...messageWithSender } : msg
                    ));
                }

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

        // Clear typing indicator immediately before sending
        if (typingChannelRef.current) {
            realtimeService.stopTyping(typingChannelRef.current);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }

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
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = () => {
        if (!currentChannelId && !currentDMId) {
            return;
        }

        // Start typing immediately if we have a channel
        if (typingChannelRef.current) {
            realtimeService.startTyping(typingChannelRef.current, currentUser);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
            if (typingChannelRef.current) {
                realtimeService.stopTyping(typingChannelRef.current);
            }
        }, 1000);
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

    // Update the useEffect for typing users
    useEffect(() => {
        if (typingUsers.length > 0) {
            setIsTypingVisible('entering');
        } else {
            setIsTypingVisible('exiting');
            const timeout = setTimeout(() => {
                setIsTypingVisible('hidden');
            }, 500); // Increased from 300ms to 500ms to ensure animation completes
            return () => clearTimeout(timeout);
        }
    }, [typingUsers]);

    // Update the renderTypingIndicator function
    const renderTypingIndicator = () => {
        // Always render the container, but conditionally render the content
        return (
            <div className="absolute -top-10 left-0 right-0 z-0">
                <div className="relative h-8 overflow-visible px-6">
                    {(isTypingVisible !== 'hidden' && typingUsers.length > 0) && (
                        <div className={`
                            absolute bottom-0 inline-flex items-center gap-2 px-3 py-1.5 
                            bg-[#F8FAFD] dark:bg-dark-bg-secondary 
                            border border-[#B8C5D6] dark:border-dark-border rounded-lg shadow-sm
                            ${isTypingVisible === 'entering' ? 'animate-typing-slide-up' : ''}
                            ${isTypingVisible === 'exiting' ? 'animate-typing-slide-down' : ''}
                        `}>
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-[#23CE6B] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-[#4DD88C] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-[#1BA557] rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-sm text-[#272D2D] dark:text-dark-text-primary whitespace-nowrap">
                                {getTypingText()}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Helper function to get typing text
    const getTypingText = () => {
        const otherTypingUsers = typingUsers.filter(username => username !== currentUser.username);
        if (otherTypingUsers.length === 0) return '';

        if (otherTypingUsers.length === 1) {
            return `${otherTypingUsers[0]} is typing`;
        } else if (otherTypingUsers.length === 2) {
            return `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing`;
        } else {
            const othersCount = otherTypingUsers.length - 2;
            return `${otherTypingUsers[0]}, ${otherTypingUsers[1]} and ${othersCount} more are typing`;
        }
    };

    return (
        <div className="min-h-screen bg-alice-blue dark:bg-dark-bg-primary transition-colors duration-200">
            <Header 
                onLogout={onLogout} 
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            <div className="flex h-[calc(100vh-64px)] p-4 gap-4">
                {/* Sidebar Overlay */}
                <div 
                    className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
                        isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                />

                {/* Sidebar */}
                <div 
                    className={`${
                        isSidebarOpen ? 'translate-x-0 ml-4' : '-translate-x-full'
                    } lg:translate-x-0 fixed lg:relative lg:inset-auto inset-y-[80px] left-0 z-40 w-72 bg-white dark:bg-dark-bg-secondary border border-powder-blue dark:border-dark-border transition-all duration-200 flex flex-col rounded-2xl overflow-hidden ${
                        !isSidebarOpen ? 'lg:mr-4' : ''
                    }`}
                >
                    <div className="p-6 flex-1 overflow-y-auto">
                        {/* Channels Section */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gunmetal dark:text-dark-text-primary">Workspaces</h2>
                            </div>
                            <ChannelList
                                onChannelSelect={(channelId) => {
                                    handleChannelSelect(channelId);
                                    setIsSidebarOpen(false);
                                }}
                                selectedChannelId={currentChannelId}
                                onCreateChannel={() => setIsCreateModalOpen(true)}
                            />
                        </div>

                        {/* Direct Messages Section */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gunmetal dark:text-dark-text-primary">Direct Messages</h2>
                                <button
                                    onClick={() => setIsCreateDMModalOpen(true)}
                                    className="p-2 text-rose-quartz hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200 hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-xl"
                                    title="New Message"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>
                            <DirectMessageList
                                onDMSelect={(dmId) => {
                                    handleDMSelect(dmId);
                                    setIsSidebarOpen(false);
                                }}
                                selectedDMId={currentDMId}
                            />
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="p-4 border-t border-powder-blue dark:border-dark-border flex items-center bg-[#F8FAFD] dark:bg-dark-bg-secondary">
                        <div className="w-10 h-10 rounded-xl bg-powder-blue dark:bg-dark-border overflow-hidden mr-3">
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
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-rose-quartz hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200 rounded-xl hover:bg-alice-blue dark:hover:bg-dark-bg-primary"
                        >
                            <span>Sign out</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-dark-bg-primary rounded-2xl overflow-hidden border border-powder-blue dark:border-dark-border transition-all duration-200">
                    {/* Chat Header */}
                    {currentChannelId && (
                        <div className="h-16 px-6 border-b border-powder-blue dark:border-dark-border flex items-center bg-[#F8FAFD] dark:bg-dark-bg-secondary">
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
                        <div className="space-y-0">
                            {messages.map((message, index) => {
                                const isFirstInGroup = index === 0 || messages[index - 1].sender?.id !== message.sender?.id;
                                const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender?.id !== message.sender?.id;

                                return (
                                    <div
                                        key={message.id}
                                        className={`
                                            group flex items-start hover:bg-alice-blue dark:hover:bg-dark-bg-secondary rounded-xl 
                                            ${!isFirstInGroup ? '-mt-1' : 'mt-1'}
                                            py-0.5 px-3 transition-all duration-200
                                        `}
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
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Message Input Container */}
                    <div className="relative">
                        {renderTypingIndicator()}
                        
                        {/* Message Input */}
                        <div className="p-4 border-t border-powder-blue dark:border-dark-border bg-[#F8FAFD] dark:bg-dark-bg-secondary relative z-10">
                            {/* Show staged files */}
                            {stagedFiles.length > 0 && (
                                <div className="flex flex-col items-center gap-2 mb-3">
                                    {stagedFiles.map((file, index) => (
                                        <div 
                                            key={index} 
                                            className="flex items-center gap-2 bg-alice-blue dark:bg-dark-bg-primary rounded-xl px-3 py-1.5"
                                        >
                                            <span className="text-sm text-gray-600 dark:text-dark-text-secondary truncate max-w-[150px]">
                                                {file.fileName}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveStagedFile(index)}
                                                className="text-gray-500 hover:text-red-500 dark:text-dark-text-secondary rounded-lg p-1 hover:bg-white/50 dark:hover:bg-dark-bg-secondary/50 transition-colors duration-200"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
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
                                    onKeyDown={(e) => {
                                        if (e.key !== 'Enter') {
                                            handleTyping();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-powder-blue dark:border-dark-border bg-white dark:bg-dark-bg-secondary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-emerald transition-all duration-200"
                                    disabled={!currentChannelId && !currentDMId}
                                />
                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && stagedFiles.length === 0) || (!currentChannelId && !currentDMId)}
                                    className="px-5 py-2.5 bg-emerald text-white rounded-xl hover:bg-emerald-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
                                >
                                    Send
                                </button>
                            </form>
                        </div>
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