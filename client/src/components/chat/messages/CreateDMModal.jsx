import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { searchUsers } from '../../../services/api/userService';
import { createDMConversation } from '../../../services/api/dmService';

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
            <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-xl w-full max-w-md animate-scale">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-semibold text-rose-quartz dark:text-dark-text-secondary uppercase tracking-wider">
                            New Message
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-rose-quartz dark:text-dark-text-secondary hover:text-emerald dark:hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-2xl transition-colors duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="user-search" className="block text-sm font-medium text-rose-quartz dark:text-dark-text-secondary mb-1">
                                Search users
                            </label>
                            <input
                                id="user-search"
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2.5 border border-powder-blue dark:border-dark-border rounded-2xl focus:outline-none hover:border-emerald dark:hover:border-emerald bg-white dark:bg-dark-bg-primary placeholder-rose-quartz dark:placeholder-dark-text-secondary text-gunmetal dark:text-dark-text-primary transition-colors duration-200"
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
                                {error}
                            </div>
                        )}

                        <div className="max-h-60 overflow-y-auto">
                            {isLoading ? (
                                <div className="animate-pulse space-y-2">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-powder-blue dark:bg-dark-border rounded-2xl"></div>
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
                                            className={`w-full flex items-center gap-2 p-2 rounded-2xl transition-colors duration-200 ${
                                                selectedUser?.id === user.id
                                                    ? 'text-emerald'
                                                    : 'text-gunmetal dark:text-dark-text-primary hover:bg-alice-blue dark:hover:bg-dark-bg-primary'
                                            }`}
                                        >
                                            <div className="w-8 h-8 rounded-2xl bg-powder-blue dark:bg-dark-border overflow-hidden">
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
                            className="px-4 py-2 text-rose-quartz dark:text-dark-text-secondary hover:text-emerald dark:hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-2xl transition-colors duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateDM}
                            disabled={!selectedUser || isLoading}
                            className="px-4 py-2 text-emerald hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-colors duration-200"
                        >
                            {isLoading ? (
                                <span className="flex items-center space-x-2">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Creating...</span>
                                </span>
                            ) : (
                                'Start Conversation'
                            )}
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