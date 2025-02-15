import { useState } from 'react';
import PropTypes from 'prop-types';
import { createChannel } from '../../../services/api/channelService';

function CreateChannelModal({ isOpen, onClose, onChannelCreated }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const channelData = {
                name: name.trim(),
                description: description.trim(),
                is_private: false
            };

            const channel = await createChannel(channelData);
            onChannelCreated(channel);
            onClose();

            // Reset form
            setName('');
            setDescription('');
        } catch (error) {
            setError(error.response?.data?.message || 'Error creating channel');
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
                        <h2 className="text-sm font-semibold text-rose-quartz dark:text-dark-text-secondary uppercase tracking-wider">Create New Channel</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-rose-quartz dark:text-dark-text-secondary hover:text-emerald dark:hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-xl transition-colors duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-rose-quartz dark:text-dark-text-secondary mb-1">
                                    Channel Name
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-rose-quartz dark:text-dark-text-secondary">#</span>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-8 pr-4 py-2.5 border border-powder-blue dark:border-dark-border rounded-xl focus:outline-none hover:border-emerald dark:hover:border-emerald bg-white dark:bg-dark-bg-primary placeholder-rose-quartz dark:placeholder-dark-text-secondary text-gunmetal dark:text-dark-text-primary transition-colors duration-200"
                                        placeholder="e.g. general"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-rose-quartz dark:text-dark-text-secondary mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-powder-blue dark:border-dark-border rounded-xl focus:outline-none hover:border-emerald dark:hover:border-emerald bg-white dark:bg-dark-bg-primary placeholder-rose-quartz dark:placeholder-dark-text-secondary text-gunmetal dark:text-dark-text-primary transition-colors duration-200 resize-none"
                                    placeholder="What's this channel about?"
                                    rows="3"
                                />
                            </div>

                            {error && (
                                <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-rose-quartz dark:text-dark-text-secondary hover:text-emerald dark:hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-xl transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !name.trim()}
                                className="px-4 py-2 text-emerald hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors duration-200"
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
                                    'Create Channel'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

CreateChannelModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onChannelCreated: PropTypes.func.isRequired
};

export default CreateChannelModal; 