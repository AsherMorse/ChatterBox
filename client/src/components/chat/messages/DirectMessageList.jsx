import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getDMConversations } from '../../../services/api/dmService';
import { getChatterBotInfo } from '../../../services/api/chatterbotService';
import { getUser } from '../../../services/api/auth';
import realtimeService from '../../../services/realtime/realtimeService';

function DirectMessageList({ onDMSelect, selectedDMId }) {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const currentUser = getUser();

    useEffect(() => {
        const loadConversations = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get ChatterBot info
                const chatterbot = await getChatterBotInfo();
                
                // Get regular DM conversations
                const userConversations = await getDMConversations();
                
                // Combine ChatterBot with regular conversations
                const allConversations = [
                    // Add ChatterBot as a special conversation
                    {
                        id: chatterbot.id,
                        users: [chatterbot],
                        isBot: true
                    },
                    // Add regular conversations
                    ...userConversations
                ];

                setConversations(allConversations);
            } catch (err) {
                console.error('Error loading conversations:', err);
                setError('Failed to load conversations');
            } finally {
                setLoading(false);
            }
        };

        loadConversations();

        // Subscribe to DM conversation updates (only for regular DMs)
        const conversationChannel = realtimeService.subscribeToDMConversations(currentUser.id, () => {
            loadConversations();
        });

        // Subscribe to presence updates (only for regular users)
        const presenceChannel = realtimeService.subscribeToUserPresence((updatedUser) => {
            setConversations(prevConversations => 
                prevConversations.map(conv => {
                    // Don't update ChatterBot conversations
                    if (conv.isBot) return conv;

                    return {
                        ...conv,
                        users: conv.users.map(user => 
                            user.id === updatedUser.id 
                                ? { ...user, presence: updatedUser.presence }
                                : user
                        )
                    };
                })
            );
        });

        return () => {
            if (conversationChannel) {
                conversationChannel.unsubscribe();
            }
            if (presenceChannel) {
                presenceChannel.unsubscribe();
            }
        };
    }, [currentUser.id]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-powder-blue/30 dark:bg-dark-border/30 rounded-xl"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-rose-quartz dark:text-dark-text-secondary py-4">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {conversations.map(conversation => {
                // For ChatterBot
                if (conversation.isBot) {
                    const bot = conversation.users[0];
                    const isSelected = selectedDMId === bot.id;
                    return (
                        <button
                            key={bot.id}
                            onClick={() => onDMSelect(bot.id)}
                            className={`
                                relative w-full px-3 py-2 rounded-xl flex items-center gap-3 text-left
                                transition-colors duration-200
                                ${isSelected
                                    ? 'text-emerald z-10' 
                                    : 'text-gunmetal dark:text-dark-text-primary hover:bg-alice-blue dark:hover:bg-dark-bg-primary'
                                }
                            `}
                        >
                            {isSelected && (
                                <div className="absolute inset-0 rounded-xl bg-alice-blue dark:bg-dark-bg-primary border border-emerald" />
                            )}
                            {/* Bot Avatar */}
                            <div className="relative z-10 w-8 h-8 rounded-full bg-emerald/10 dark:bg-emerald/20 flex items-center justify-center flex-shrink-0">
                                <svg 
                                    className="w-5 h-5 text-emerald"
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="relative z-10 truncate">{bot.username}</span>
                        </button>
                    );
                }

                // For regular users
                const otherUser = conversation.users.find(u => u.id !== currentUser.id);
                if (!otherUser) return null;

                const isSelected = selectedDMId === conversation.dm_id;
                return (
                    <button
                        key={conversation.dm_id}
                        onClick={() => onDMSelect(conversation.dm_id)}
                        className={`
                            relative w-full px-3 py-2 rounded-xl flex items-center gap-3 text-left
                            transition-colors duration-200
                            ${isSelected
                                ? 'text-emerald z-10' 
                                : 'text-gunmetal dark:text-dark-text-primary hover:bg-alice-blue dark:hover:bg-dark-bg-primary'
                            }
                        `}
                    >
                        {isSelected && (
                            <div className="absolute inset-0 rounded-xl bg-alice-blue dark:bg-dark-bg-primary border border-emerald" />
                        )}
                        {/* User Avatar with Status */}
                        <div className="relative z-10 flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden">
                                {otherUser.avatar_url ? (
                                    <img
                                        src={otherUser.avatar_url}
                                        alt={otherUser.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm">
                                        {otherUser.username[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-dark-bg-secondary">
                                <div 
                                    className="w-full h-full rounded-full"
                                    style={{ 
                                        backgroundColor: otherUser.presence === 'online' ? '#10B981' 
                                            : otherUser.presence === 'idle' ? '#F59E0B' 
                                            : '#94A3B8'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="relative z-10 flex flex-col min-w-0 text-left">
                            <span className="truncate">{otherUser.username}</span>
                            <span className={`text-xs ${isSelected ? 'text-emerald' : 'text-rose-quartz dark:text-dark-text-secondary'}`}>
                                {otherUser.presence === 'online' ? 'Online' 
                                    : otherUser.presence === 'idle' ? 'Idle' 
                                    : 'Offline'}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

DirectMessageList.propTypes = {
    onDMSelect: PropTypes.func.isRequired,
    selectedDMId: PropTypes.string
};

export default DirectMessageList; 