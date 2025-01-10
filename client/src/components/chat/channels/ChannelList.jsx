import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getChannels } from '../../../services/api/channelService';
import realtimeService from '../../../services/realtime/realtimeService';
import { getUser } from '../../../services/api/auth';

function ChannelList({ onChannelSelect, selectedChannelId, onCreateChannel }) {
    const [channels, setChannels] = useState([]);
    const navigate = useNavigate();
    const currentUser = getUser();
    const selectedRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        loadChannels();

        // Subscribe to channel changes
        const channel = realtimeService.subscribeToChannelList(async (payload) => {
            // Reload channels when there's any change
            if (payload.eventType === 'INSERT' || 
                payload.eventType === 'DELETE' || 
                (payload.eventType === 'UPDATE' && payload.new?.name !== payload.old?.name)) {
                await loadChannels();
            }
            // For channel_members changes, only reload if it involves the current user
            else if (payload.table === 'channel_members' && 
                    (payload.new?.user_id === currentUser.id || payload.old?.user_id === currentUser.id)) {
                await loadChannels();
            }
        });

        return () => {
            realtimeService.unsubscribeFromChannelList();
        };
    }, [currentUser.id]);

    useEffect(() => {
        if (selectedRef.current && containerRef.current) {
            // Add a small delay to ensure DOM is ready
            const timeoutId = setTimeout(() => {
                const container = containerRef.current;
                const selected = selectedRef.current;
                if (container && selected) {
                    const containerRect = container.getBoundingClientRect();
                    const selectedRect = selected.getBoundingClientRect();
                    const relativeTop = selectedRect.top - containerRect.top;
                    
                    container.style.setProperty('--selected-top', `${relativeTop}px`);
                    container.style.setProperty('--selected-height', `${selectedRect.height}px`);
                }
            }, 10);

            return () => clearTimeout(timeoutId);
        }
    }, [selectedChannelId, channels]); // Also depend on channels to recalculate when they load

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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-rose-quartz dark:text-dark-text-secondary uppercase tracking-wider">
                    Your Channels
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/browse-channels')}
                        className="p-2 text-rose-quartz dark:text-dark-text-secondary hover:text-emerald dark:hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-xl transition-colors duration-200"
                        title="Browse channels"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    <button
                        onClick={onCreateChannel}
                        className="p-2 text-rose-quartz dark:text-dark-text-secondary hover:text-emerald dark:hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-xl transition-colors duration-200"
                        title="Create new channel"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Channel List */}
            <div className="space-y-0.5 relative" ref={containerRef}>
                <div 
                    className="absolute w-full rounded-lg bg-alice-blue dark:bg-dark-bg-primary border border-emerald" 
                    style={{
                        top: 'var(--selected-top, 0)',
                        height: 'var(--selected-height, 0)',
                        opacity: selectedChannelId ? 1 : 0,
                        pointerEvents: 'none',
                        transition: selectedChannelId?.startsWith('channel_') && channels.some(channel => channel.id === selectedChannelId.replace('channel_', '')) ? 'all 200ms ease-in-out' : 'opacity 200ms ease-in-out'
                    }}
                />
                {channels.length > 0 ? (
                    channels.map((channel) => (
                        <button
                            key={channel.id}
                            ref={selectedChannelId === channel.id ? selectedRef : null}
                            onClick={() => onChannelSelect(channel.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 group flex items-center space-x-2 relative
                                ${selectedChannelId === channel.id 
                                    ? 'text-emerald z-10'
                                    : 'text-gunmetal dark:text-dark-text-primary hover:bg-alice-blue dark:hover:bg-dark-bg-primary'
                                }`}
                        >
                            <span className="text-lg">#</span>
                            <span className="truncate">{channel.name}</span>
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
        </div>
    );
}

ChannelList.propTypes = {
    onChannelSelect: PropTypes.func.isRequired,
    selectedChannelId: PropTypes.string,
    onCreateChannel: PropTypes.func.isRequired
};

export default ChannelList;
