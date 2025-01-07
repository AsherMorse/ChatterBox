import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicChannels, joinChannel } from '../services/api/channelService';

function BrowseChannels() {
    const [channels, setChannels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadChannels();
    }, []);

    const loadChannels = async () => {
        try {
            setIsLoading(true);
            const channelList = await getPublicChannels();
            setChannels(channelList);
        } catch (error) {
            setError('Error loading channels');
            console.error('Error loading channels:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinChannel = async (channelId) => {
        try {
            await joinChannel(channelId);
            navigate(`/chat?channel=${channelId}`);
        } catch (error) {
            console.error('Error joining channel:', error);
        }
    };

    const filteredChannels = channels.filter(channel => 
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-alice-blue dark:bg-dark-bg-primary flex items-center justify-center transition-colors duration-200">
                <div className="flex items-center space-x-3 text-gunmetal dark:text-dark-text-primary">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading channels...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-alice-blue dark:bg-dark-bg-primary flex items-center justify-center transition-colors duration-200">
                <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-alice-blue dark:bg-dark-bg-primary transition-colors duration-200">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gunmetal dark:text-dark-text-primary">Browse Channels</h1>
                            <p className="mt-1 text-rose-quartz dark:text-dark-text-secondary">
                                Discover and join public channels
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/chat')}
                            className="flex items-center space-x-2 px-4 py-2 text-gunmetal dark:text-dark-text-primary hover:text-emerald dark:hover:text-emerald transition-colors duration-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back to Chat</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-rose-quartz dark:text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search channels..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-bg-secondary border border-powder-blue dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald placeholder-rose-quartz dark:placeholder-dark-text-secondary text-gunmetal dark:text-dark-text-primary transition-colors duration-200"
                        />
                    </div>

                    {/* Channel Grid */}
                    {filteredChannels.length === 0 ? (
                        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-powder-blue dark:border-dark-border p-8 text-center">
                            <div className="text-rose-quartz dark:text-dark-text-secondary">
                                {searchQuery ? 'No channels match your search' : 'No public channels available'}
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredChannels.map((channel) => (
                                <div
                                    key={channel.id}
                                    className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-powder-blue dark:border-dark-border overflow-hidden hover:border-emerald dark:hover:border-emerald transition-colors duration-200"
                                >
                                    <div className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-semibold text-gunmetal dark:text-dark-text-primary flex items-center space-x-2">
                                                    <span className="text-rose-quartz dark:text-dark-text-secondary">#</span>
                                                    <span className="truncate">{channel.name}</span>
                                                </h3>
                                                {channel.description && (
                                                    <p className="mt-2 text-rose-quartz dark:text-dark-text-secondary line-clamp-2">
                                                        {channel.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="flex items-center space-x-4 text-sm text-rose-quartz dark:text-dark-text-secondary">
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    <span>{channel.creator?.username || 'Unknown'}</span>
                                                </div>
                                                {channel.members_count && (
                                                    <div className="flex items-center space-x-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                        <span>{channel.members_count}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleJoinChannel(channel.id)}
                                                className="px-4 py-2 bg-emerald text-white rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald transition-all duration-200"
                                            >
                                                Join
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BrowseChannels;
