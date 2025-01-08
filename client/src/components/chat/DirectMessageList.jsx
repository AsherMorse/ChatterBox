import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getDMConversations } from '../../services/api/dmService';
import { getUser } from '../../services/api/auth';

function DirectMessageList({ onDMSelect, selectedDMId }) {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const currentUser = getUser();

    useEffect(() => {
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

        loadConversations();
    }, []);

    // Get the other user in a DM conversation
    const getOtherUser = (conversation) => {
        return conversation.users.find(user => user.id !== currentUser.id);
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
        <div className="space-y-0.5">
            {conversations.map((conversation) => {
                const otherUser = getOtherUser(conversation);
                return (
                    <button
                        key={conversation.dm_id}
                        onClick={() => onDMSelect(conversation.dm_id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors duration-200 ${
                            selectedDMId === conversation.dm_id
                                ? 'bg-emerald/10 text-emerald'
                                : 'text-gunmetal dark:text-dark-text-primary hover:bg-alice-blue dark:hover:bg-dark-bg-primary'
                        }`}
                    >
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden">
                                {otherUser?.avatar_url ? (
                                    <img
                                        src={otherUser.avatar_url}
                                        alt={otherUser.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm text-gunmetal dark:text-dark-text-primary">
                                        {otherUser?.username?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-dark-bg-secondary ${
                                otherUser?.status === 'online' ? 'bg-emerald' : 'bg-rose-quartz'
                            }`}></div>
                        </div>
                        <span className="flex-1 text-left truncate">
                            {otherUser?.username || 'Unknown User'}
                        </span>
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