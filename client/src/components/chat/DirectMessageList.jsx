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
        const channel = realtimeService.subscribeToDMConversations(currentUser.id, () => {
            loadConversations();
        });

        return () => {
            if (channel) {
                channel.unsubscribe();
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
        <ul className="dm-list">
            {conversations.map((conversation) => {
                const user = getOtherUser(conversation);
                if (!user) return null; // Skip rendering if user is not found
                return (
                    <li
                        key={conversation.dm_id}
                        className={`dm-item ${selectedDMId === conversation.dm_id ? 'selected' : ''}`}
                        onClick={() => onDMSelect(conversation.dm_id)}
                    >
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <span
                                    className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full
                                        ${user.presence === 'online' ? 'bg-emerald' : ''}
                                        ${user.presence === 'idle' ? 'bg-yellow-400' : ''}
                                        ${user.presence === 'offline' ? 'bg-rose-quartz' : ''}
                                        border-2 border-white dark:border-dark-bg-secondary`}
                                />
                                <img
                                    src={user.avatar_url || '/default-avatar.png'}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            </div>
                            <span>{user.username}</span>
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