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
                setError(null);
                const results = await searchUsers(searchQuery);
                setSearchResults(results);
            } catch (err) {
                console.error('Error searching users:', err);
                setError('Failed to search users. Please try again.');
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

    const handleCreateDM = async () => {
        if (!selectedUser) {
            setError('Please select a user to message');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const dmId = await createDMConversation(selectedUser.id);
            onDMCreated(dmId);
        } catch (err) {
            console.error('Error creating DM:', err);
            setError('Failed to create conversation. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-xl w-full max-w-md animate-scale">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gunmetal dark:text-dark-text-primary">
                            New Message
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-rose-quartz hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="user-search" className="block text-sm font-medium text-gunmetal dark:text-dark-text-primary mb-1">
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
                            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
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

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-rose-quartz hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateDM}
                            disabled={!selectedUser || isLoading}
                            className={`px-4 py-2 bg-emerald text-white rounded-lg transition-all duration-200 ${
                                !selectedUser || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                            }`}
                        >
                            {isLoading ? 'Creating...' : 'Start Conversation'}
                        </button>
                    </div>
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