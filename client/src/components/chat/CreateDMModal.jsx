import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { searchUsers } from '../../services/api/userService';
import { createDMConversation } from '../../services/api/dmService';

function CreateDMModal({ isOpen, onClose, onDMCreated }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        // Reset state when modal opens/closes
        if (!isOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUser(null);
            setError(null);
        }
    }, [isOpen]);

    useEffect(() => {
        // Debounced search
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                setIsLoading(true);
                const results = await searchUsers(searchQuery);
                setSearchResults(results);
                setError(null);
            } catch (err) {
                console.error('Error searching users:', err);
                setError('Failed to search users');
                setSearchResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    const handleStartDM = async () => {
        if (!selectedUser) return;

        try {
            setIsLoading(true);
            const dmId = await createDMConversation(selectedUser.id);
            onDMCreated(dmId);
            onClose();
        } catch (err) {
            console.error('Error creating DM:', err);
            setError('Failed to start conversation');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gunmetal/50 dark:bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gunmetal dark:text-dark-text-primary mb-4">
                        New Message
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="user-search" className="sr-only">
                                Search users
                            </label>
                            <input
                                id="user-search"
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 bg-alice-blue dark:bg-dark-bg-primary border border-powder-blue dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald placeholder-rose-quartz dark:placeholder-dark-text-secondary text-gunmetal dark:text-dark-text-primary"
                            />
                        </div>

                        {error && (
                            <div className="text-rose-quartz dark:text-dark-text-secondary text-sm">
                                {error}
                            </div>
                        )}

                        <div className="max-h-60 overflow-y-auto">
                            {isLoading ? (
                                <div className="animate-pulse space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-powder-blue dark:bg-dark-border rounded-full"></div>
                                            <div className="h-4 bg-powder-blue dark:bg-dark-border rounded w-24"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="space-y-1">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className={`w-full flex items-center gap-2 p-2 rounded-lg transition-colors duration-200 ${
                                                selectedUser?.id === user.id
                                                    ? 'bg-emerald/10 text-emerald'
                                                    : 'text-gunmetal dark:text-dark-text-primary hover:bg-alice-blue dark:hover:bg-dark-bg-primary'
                                            }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden">
                                                {user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt={user.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-sm text-gunmetal dark:text-dark-text-primary">
                                                        {user.username[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="flex-1 text-left">
                                                {user.username}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : searchQuery && (
                                <div className="text-rose-quartz dark:text-dark-text-secondary text-sm text-center py-4">
                                    No users found
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-powder-blue dark:border-dark-border p-4 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-rose-quartz dark:text-dark-text-secondary hover:text-emerald dark:hover:text-emerald transition-colors duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleStartDM}
                        disabled={!selectedUser || isLoading}
                        className="px-4 py-2 bg-emerald text-white rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald disabled:opacity-50 transition-all duration-200"
                    >
                        Start Conversation
                    </button>
                </div>
            </div>
        </div>
    );
}

CreateDMModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onDMCreated: PropTypes.func.isRequired
};

export default CreateDMModal; 