import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getDMConversations } from '../../services/api/dmService';
import { getUser } from '../../services/api/auth';
import realtimeService from '../../services/realtime/realtimeService';

function DirectMessageList({ onDMSelect, selectedDMId }) {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const currentUser = getUser();

    const loadConversations = async () => {
        try {
            setIsLoading(true);
            const data = await getDMConversations();
            setConversations(data);
        } catch (err) {
            console.error('Error loading DM conversations:', err);
            setError('Failed to load conversations');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadConversations();

        // Subscribe to DM conversation updates
        const conversationChannel = realtimeService.subscribeToDMConversations(currentUser.id, () => {
            loadConversations();
        });

        // Subscribe to presence updates
        const presenceChannel = realtimeService.subscribeToUserPresence((updatedUser) => {
            setConversations(prevConversations => 
                prevConversations.map(conv => ({
                    ...conv,
                    users: conv.users.map(user => 
                        user.id === updatedUser.id 
                            ? { ...user, presence: updatedUser.presence, custom_status_text: updatedUser.custom_status_text, custom_status_color: updatedUser.custom_status_color }
                            : user
                    )
                }))
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

    // Get the other user in a DM conversation
    const getOtherUser = (conversation) => {
        if (!conversation.users) {
            console.error('Users not found for conversation:', conversation);
            return null;
        }
        return conversation.users.find((user) => user.id !== currentUser.id);
    };

    if (isLoading) {
        return (
            <div className="py-2 px-2">
                <div className="animate-pulse space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-powder-blue dark:bg-dark-border rounded-full"></div>
                            <div className="h-4 bg-powder-blue dark:bg-dark-border rounded w-24"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-2 px-2 text-rose-quartz dark:text-dark-text-secondary">
                {error}
            </div>
        );
    }

    return (
        <ul className="space-y-0.5">
            {conversations.map((conversation) => {
                const user = getOtherUser(conversation);
                if (!user) return null; // Skip rendering if user is not found
                return (
                    <li
                        key={conversation.dm_id}
                        className={`
                            p-2 rounded-lg cursor-pointer transition-colors duration-200
                            ${selectedDMId === conversation.dm_id 
                                ? 'bg-emerald/10 text-emerald' 
                                : 'text-gunmetal dark:text-dark-text-primary hover:bg-alice-blue dark:hover:bg-dark-bg-primary'
                            }
                        `}
                        onClick={() => onDMSelect(conversation.dm_id)}
                    >
                        <div className="flex items-center gap-2">
                            <div className="relative flex-shrink-0">
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.username}
                                        className="w-8 h-8 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-xl bg-powder-blue dark:bg-dark-border flex items-center justify-center">
                                        <span className="text-sm font-medium text-gunmetal dark:text-dark-text-primary">
                                            {user.username?.[0]?.toUpperCase() || '?'}
                                        </span>
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-dark-bg-secondary">
                                    <div className="w-full h-full rounded-full" style={{ 
                                        backgroundColor: user.custom_status_color || (
                                            user.presence === 'online' ? '#10B981' 
                                            : user.presence === 'idle' ? '#F59E0B' 
                                            : '#94A3B8'
                                        )
                                    }} />
                                </div>
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-medium truncate">
                                    {user.username}
                                </span>
                                {user.custom_status_text ? (
                                    <span
                                        className="text-xs truncate"
                                        style={{ color: user.custom_status_color }}
                                    >
                                        {user.custom_status_text}
                                    </span>
                                ) : (
                                    <span className="text-xs truncate text-rose-quartz dark:text-dark-text-secondary">
                                        {user.presence === 'online' ? 'Online' : user.presence === 'idle' ? 'Idle' : 'Offline'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

DirectMessageList.propTypes = {
    onDMSelect: PropTypes.func.isRequired,
    selectedDMId: PropTypes.string
};

export default DirectMessageList; 