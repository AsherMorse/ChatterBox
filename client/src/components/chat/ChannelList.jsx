import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getChannels } from '../../services/api/channelService';
import CreateChannelModal from './CreateChannelModal';

function ChannelList({ onChannelSelect, selectedChannelId }) {
    const [channels, setChannels] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        try {
            const channelList = await getChannels();
            setChannels(channelList);
            // Auto-select first channel if no channel is selected and channels exist
            if (channelList.length > 0 && !selectedChannelId) {
                onChannelSelect(channelList[0].id);
            }
        } catch (error) {
            console.error('Error loading channels:', error);
        }
    };

    const handleChannelCreated = (channel) => {
        setChannels(prev => [...prev, channel]);
        onChannelSelect(channel.id);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-rose-quartz dark:text-dark-text-secondary uppercase tracking-wider">
                    Your Channels
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => navigate('/browse-channels')}
                        className="p-1.5 text-rose-quartz dark:text-dark-text-secondary hover:text-emerald dark:hover:text-emerald rounded-lg transition-colors duration-200"
                        aria-label="Browse channels"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="p-1.5 text-rose-quartz dark:text-dark-text-secondary hover:text-emerald dark:hover:text-emerald rounded-lg transition-colors duration-200"
                        aria-label="Create new channel"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Channel List */}
            <div className="space-y-0.5">
                {channels.length > 0 ? (
                    channels.map((channel) => (
                        <button
                            key={channel.id}
                            onClick={() => onChannelSelect(channel.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 group flex items-center space-x-2
                                ${selectedChannelId === channel.id 
                                    ? 'bg-emerald/10 text-emerald'
                                    : 'text-gunmetal dark:text-dark-text-primary hover:bg-alice-blue dark:hover:bg-dark-bg-primary'
                                }`}
                        >
                            <span className="text-lg">#</span>
                            <span className="truncate">{channel.name}</span>
                            {channel.is_private && (
                                <svg className="w-4 h-4 ml-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            )}
                        </button>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <p className="text-rose-quartz dark:text-dark-text-secondary">
                            You haven't joined any channels yet
                        </p>
                    </div>
                )}
            </div>

            {/* Create Channel Modal */}
            <CreateChannelModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onChannelCreated={handleChannelCreated}
            />
        </div>
    );
}

ChannelList.propTypes = {
    onChannelSelect: PropTypes.func.isRequired,
    selectedChannelId: PropTypes.string
};

export default ChannelList;
