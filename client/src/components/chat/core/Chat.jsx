import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ChannelList from '../channels/ChannelList';
import DirectMessageList from '../messages/DirectMessageList';
import CreateChannelModal from '../channels/CreateChannelModal';
import CreateDMModal from '../messages/CreateDMModal';
import DirectMessageHeader from '../messages/DirectMessageHeader';
import { getMessages, sendMessage, getMessageSender } from '../../../services/api/messageService';
import { getDMMessages, sendDMMessage, getDMConversation } from '../../../services/api/dmService';
import { getChannel } from '../../../services/api/channelService';
import realtimeService from '../../../services/realtime/realtimeService';
import Header from '../../common/Header';
import PropTypes from 'prop-types';
import { getUser } from '../../../services/api/auth';
import MessageReactions from '../features/MessageReactions';
import FileUpload from '../files/FileUpload';
import FileAttachment from '../files/FileAttachment';
import { uploadFile, createFileAttachment } from '../../../services/api/fileService';
import UserStatusEditor from '../../sidebar/UserStatusEditor';
import SearchBar from '../features/SearchBar';
import ThreadSidebar from '../features/ThreadSidebar';
import { CHATTERBOT_ID } from '../../../services/api/chatterbotService';

function Chat({ onLogout }) {
    const [messages, setMessages] = useState([]);
    const [filteredMessages, setFilteredMessages] = useState([]);
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
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const typingChannelRef = useRef(null);
    const currentMessagesRef = useRef(messages);
    const currentUser = getUser();
    const currentChannelId = searchParams.get('channel');
    const currentDMId = searchParams.get('dm');
    const navigate = useNavigate();
    const [isTypingVisible, setIsTypingVisible] = useState('hidden');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const messageRefs = useRef({});
    const [isThreadOpen, setIsThreadOpen] = useState(false);
    const [activeThreadMessage, setActiveThreadMessage] = useState(null);
    const [isChatterbotTyping, setIsChatterbotTyping] = useState(false);

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

    // Add scroll handler to detect when user scrolls up
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShouldAutoScroll(isNearBottom);
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            setShouldAutoScroll(true);
        }
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

        // Cleanup previous typing subscription
        if (typingChannelRef.current) {
            realtimeService.stopTyping(typingChannelRef.current);
            if (currentChannelId) {
                realtimeService.unsubscribeFromTyping(currentChannelId);
            } else if (currentDMId) {
                realtimeService.unsubscribeFromTyping(`dm:${currentDMId}`);
            }
            typingChannelRef.current = null;
        }

        // Subscribe to typing indicators first
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

        // Subscribe to realtime messages
        const messageChannel = currentChannelId 
            ? realtimeService.subscribeToChannel(currentChannelId, handleRealtimeMessage)
            : realtimeService.subscribeToDM(currentDMId, handleRealtimeMessage);

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

    const handleRealtimeMessage = async (event) => {
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
                const targetMessage = currentMessagesRef.current.find(msg => msg.id === event.messageId);
                if (targetMessage) {
                    realtimeService.reactionEvents.emit(event.messageId);
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
                // For ChatterBot, add user's message immediately
                if (currentDMId === CHATTERBOT_ID) {
                    // Add user's message right away
                    const userMessage = {
                        id: Date.now().toString(),
                        content: messageContent,
                        created_at: new Date().toISOString(),
                        sender: currentUser
                    };
                    setMessages(prev => [...prev, userMessage]);
                    
                    // Show typing indicator
                    setIsChatterbotTyping(true);
                    
                    // Send message and handle bot's response separately
                    sendDMMessage(currentDMId, messageContent)
                        .then(botResponse => {
                            if (botResponse) {
                                setMessages(prev => [...prev, botResponse]);
                                // Add a small delay before hiding the typing indicator
                                setTimeout(() => {
                                    setIsChatterbotTyping(false);
                                }, 300);
                            }
                        })
                        .catch(error => {
                            setIsChatterbotTyping(false);
                            console.error('Error getting bot response:', error);
                        });
                } else {
                    // For regular DMs
                    sentMessage = await sendDMMessage(currentDMId, messageContent);
                }
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
        }
        setSearchParams({ channel: channelId });
    };

    const handleDMSelect = (dmId) => {
        // Clear typing state when changing DMs
        if (typingChannelRef.current) {
            realtimeService.stopTyping(typingChannelRef.current);
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
        } else if (isTypingVisible === 'entering') {
            setIsTypingVisible('exiting');
            setTimeout(() => {
                setIsTypingVisible('hidden');
            }, 300);
        }
    }, [typingUsers, isTypingVisible]);

    // Update the renderTypingIndicator function
    const renderTypingIndicator = () => {
        // For ChatterBot
        if (currentDMId === CHATTERBOT_ID) {
            if (!isChatterbotTyping) return null;
            
            return (
                <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 
                        bg-[#F8FAFD] dark:bg-dark-bg-secondary 
                        border border-[#B8C5D6] dark:border-dark-border rounded-lg shadow-sm
                        animate-typing-slide-up
                        whitespace-nowrap"
                    >
                        <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-[#23CE6B] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-[#4DD88C] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-[#1BA557] rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-sm text-[#272D2D] dark:text-dark-text-primary">
                            ChatterBot is typing...
                        </span>
                    </div>
                </div>
            );
        }

        // For regular channels and DMs
        if (isTypingVisible !== 'hidden' && typingUsers.length > 0) {
            return (
                <div className="absolute left-1/2 -translate-x-1/2 -top-10 z-0">
                    <div className="relative h-8 overflow-visible">
                        <div className={`
                            inline-flex items-center gap-2 px-3 py-1.5 
                            bg-[#F8FAFD] dark:bg-dark-bg-secondary 
                            border border-[#B8C5D6] dark:border-dark-border rounded-lg shadow-sm
                            ${isTypingVisible === 'entering' ? 'animate-typing-slide-up' : ''}
                            ${isTypingVisible === 'exiting' ? 'animate-typing-slide-down' : ''}
                            whitespace-nowrap
                        `}>
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-[#23CE6B] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-[#4DD88C] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-[#1BA557] rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-sm text-[#272D2D] dark:text-dark-text-primary">
                                {getTypingText()}
                            </span>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    // Helper function to get typing text
    const getTypingText = () => {
        const otherTypingUsers = typingUsers.filter(username => username !== currentUser.username);
        if (otherTypingUsers.length === 0) return '';

        if (otherTypingUsers.length === 1) {
            return `${otherTypingUsers[0]} is typing...`;
        } else if (otherTypingUsers.length === 2) {
            return `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing...`;
        } else {
            const othersCount = otherTypingUsers.length - 2;
            return `${otherTypingUsers[0]}, ${otherTypingUsers[1]} and ${othersCount} more are typing...`;
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        
        const results = messages.filter(message => 
            message.content?.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(results);
    };

    const handleMessageClick = (message) => {
        const messageElement = messageRefs.current[message.id];
        const messagesContainer = messageElement?.closest('.overflow-y-auto');
        
        if (messageElement && messagesContainer) {
            // Calculate the center position
            const containerHeight = messagesContainer.clientHeight;
            const messageTop = messageElement.offsetTop;
            const messageHeight = messageElement.clientHeight;
            const scrollTop = messageTop - (containerHeight / 2) + (messageHeight / 2);
            
            // Smooth scroll to position
            messagesContainer.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });

            // Add highlight effect
            messageElement.classList.add('bg-emerald/10');
            setTimeout(() => {
                messageElement.classList.remove('bg-emerald/10');
            }, 2000);
        }
    };

    // Add handleThreadReply function
    const handleThreadReply = (message) => {
        setActiveThreadMessage(message);
        setIsThreadOpen(true);
    };

    const handleCloseThread = () => {
        setIsThreadOpen(false);
        setActiveThreadMessage(null);
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
                        isSidebarOpen ? 'translate-x-0 lg:translate-x-0 left-4 lg:left-0' : '-translate-x-full left-0'
                    } lg:translate-x-0 fixed lg:relative lg:inset-auto inset-y-[80px] z-40 w-72 bg-white dark:bg-dark-bg-secondary border border-powder-blue dark:border-dark-border transition-all duration-200 flex flex-col rounded-2xl overflow-hidden`}
                >
                    <div className="p-6 flex-1 overflow-y-auto">
                        {/* Channels Section */}
                        <div className="mb-8">
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
                                <h2 className="text-sm font-semibold text-rose-quartz dark:text-dark-text-secondary uppercase tracking-wider">Direct Messages</h2>
                                <button
                                    onClick={() => setIsCreateDMModalOpen(true)}
                                    className="p-2 text-rose-quartz dark:text-dark-text-secondary hover:text-emerald dark:hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-xl transition-colors duration-200"
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
                    <div className="flex flex-col">
                        <UserStatusEditor currentUser={currentUser} onLogout={onLogout} />
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white dark:bg-dark-bg-primary rounded-2xl overflow-hidden border border-powder-blue dark:border-dark-border transition-all duration-200">
                    {/* Chat Header */}
                    {currentChannelId && (
                        <div className="h-16 px-6 border-b border-powder-blue dark:border-dark-border flex items-center justify-between bg-[#F8FAFD] dark:bg-dark-bg-secondary">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl text-gunmetal dark:text-dark-text-primary">#</span>
                                <h2 className="font-bold text-base text-gunmetal dark:text-dark-text-primary">
                                    {currentChannel?.name || 'Loading...'}
                                </h2>
                            </div>
                            <SearchBar 
                                onSearch={handleSearch} 
                                searchResults={searchResults} 
                                onMessageClick={handleMessageClick}
                            />
                        </div>
                    )}
                    {currentDMId && currentDMConversation && (
                        <div className="h-16 px-6 border-b border-powder-blue dark:border-dark-border flex items-center justify-between bg-[#F8FAFD] dark:bg-dark-bg-secondary">
                            <DirectMessageHeader 
                                user={currentDMConversation.users.find(u => u.id !== currentUser.id)} 
                            />
                            <SearchBar 
                                onSearch={handleSearch} 
                                searchResults={searchResults} 
                                onMessageClick={handleMessageClick}
                            />
                        </div>
                    )}

                    {/* Messages Area */}
                    <div 
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto px-6 py-4 relative"
                    >
                        {/* Messages */}
                        <div className="space-y-0">
                            {messages.map((message, index) => {
                                const isFirstInGroup = index === 0 || messages[index - 1].sender?.id !== message.sender?.id;
                                const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender?.id !== message.sender?.id;

                                return (
                                    <div
                                        key={message.id}
                                        ref={el => messageRefs.current[message.id] = el}
                                        className={`
                                            group flex items-start hover:bg-alice-blue dark:hover:bg-dark-bg-secondary rounded-xl 
                                            ${!isFirstInGroup ? '-mt-1' : 'mt-1'}
                                            py-0.5 px-3 transition-all duration-200
                                        `}
                                    >
                                        <div className="w-9 flex-shrink-0 relative h-0">
                                            {isFirstInGroup && (
                                                <div className="w-9 h-9 absolute">
                                                    {message.sender?.avatar_url ? (
                                                        <img
                                                            src={message.sender.avatar_url}
                                                            alt={message.sender.username}
                                                            className="w-full h-full object-cover rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-sm text-gunmetal dark:text-dark-text-primary rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden">
                                                            {message.sender?.username?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {!isFirstInGroup && message.reply_count > 0 && (
                                                <div className="absolute top-[0.15rem] w-9 flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-rose-quartz dark:text-dark-text-secondary opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.174 0-2.3-.183-3.352-.518L3 21l1.424-4.272C3.515 15.293 3 13.693 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 ml-2.5">
                                            {isFirstInGroup && (
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="font-bold text-base text-gunmetal dark:text-dark-text-primary">
                                                        {message.sender?.username || 'Unknown User'}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-xs text-rose-quartz dark:text-dark-text-secondary">
                                                        <span>
                                                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {message.reply_count > 0 && (
                                                            <>
                                                                <span className="opacity-40">•</span>
                                                                <svg className="w-3.5 h-3.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.174 0-2.3-.183-3.352-.518L3 21l1.424-4.272C3.515 15.293 3 13.693 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                </svg>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <div className="flex items-start gap-2 group -mt-0.5">
                                                    <div className="prose prose-sm max-w-none text-sm leading-5 text-gunmetal dark:text-dark-text-primary mt-0.5">
                                                        {message.content}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {/* Only show reactions for regular messages (not ChatterBot or messages in ChatterBot chat) */}
                                                        {(!message.file_attachments || message.file_attachments.length === 0) && 
                                                         message.sender?.id !== CHATTERBOT_ID && 
                                                         currentDMId !== CHATTERBOT_ID && (
                                                            <div className="flex-shrink-0">
                                                                <div id={`message-reactions-${message.id}`} className="flex-shrink-0">
                                                                    <MessageReactions 
                                                                        messageId={message.id}
                                                                        currentUserId={currentUser.id}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Reply in Thread button (not for ChatterBot messages or messages in ChatterBot chat) */}
                                                        {message.sender?.id !== CHATTERBOT_ID && currentDMId !== CHATTERBOT_ID && (
                                                            <button
                                                                key={`reply-${message.id}`}
                                                                className="flex items-center gap-1 p-1 text-rose-quartz hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-lg transition-colors duration-200 opacity-0 group-hover:opacity-100"
                                                                onClick={() => handleThreadReply(message)}
                                                                title="Reply in Thread"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                                </svg>
                                                                {message.reply_count > 0 && (
                                                                    <>
                                                                        <span className="opacity-40 text-xs">•</span>
                                                                        <span className="text-xs">
                                                                            {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
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

                        {/* Message Input */}
                        <div className="p-4 border-t border-powder-blue dark:border-dark-border bg-[#F8FAFD] dark:bg-dark-bg-secondary relative z-10">
                            {/* Show staged files */}
                            {stagedFiles.length > 0 && (
                                <div className="flex flex-col gap-2 mb-3">
                                    {stagedFiles.map((file, index) => (
                                        <div 
                                            key={index} 
                                            className="flex items-center gap-3 p-3 rounded-lg bg-[#F8FAFD] dark:bg-dark-bg-secondary border border-powder-blue dark:border-dark-border"
                                        >
                                            <div className="text-emerald">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gunmetal dark:text-dark-text-primary truncate">
                                                    {file.fileName}
                                                </div>
                                                <p className="text-xs text-rose-quartz dark:text-dark-text-secondary">
                                                    {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveStagedFile(index)}
                                                className="p-1.5 text-rose-quartz dark:text-dark-text-secondary hover:text-red-500 dark:hover:text-red-500 hover:bg-white/50 dark:hover:bg-dark-bg-secondary/50 rounded-lg transition-colors duration-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                <div className="flex-1 relative">
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                        <FileUpload 
                                            onFileSelect={handleFileSelect} 
                                            disabled={isUploading || (!currentChannelId && !currentDMId)} 
                                        />
                                    </div>
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
                                        className="w-full px-4 py-2.5 pl-12 pr-12 rounded-xl border border-powder-blue dark:border-dark-border hover:border-emerald dark:hover:border-emerald bg-white dark:bg-dark-bg-primary dark:text-dark-text-primary focus:outline-none"
                                        disabled={!currentChannelId && !currentDMId}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <button
                                            type="submit"
                                            disabled={(!newMessage.trim() && stagedFiles.length === 0) || (!currentChannelId && !currentDMId)}
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

            {/* Add ThreadSidebar */}
            <ThreadSidebar 
                isOpen={isThreadOpen}
                onClose={handleCloseThread}
                parentMessage={activeThreadMessage}
            />
        </div>
    );
}

Chat.propTypes = {
    onLogout: PropTypes.func.isRequired
};

export default Chat; 