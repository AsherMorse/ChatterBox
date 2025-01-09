import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import realtimeService from '../../services/realtime/realtimeService';

function DirectMessageHeader({ user: initialUser }) {
    const [user, setUser] = useState(initialUser);

    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);

    useEffect(() => {
        // Subscribe to presence updates
        const presenceChannel = realtimeService.subscribeToUserPresence((updatedUser) => {
            if (updatedUser.id === user.id) {
                setUser(prevUser => ({
                    ...prevUser,
                    presence: updatedUser.presence,
                    custom_status_text: updatedUser.custom_status_text,
                    custom_status_color: updatedUser.custom_status_color
                }));
            }
        });

        return () => {
            if (presenceChannel) {
                presenceChannel.unsubscribe();
            }
        };
    }, [user.id]);

    const getPresenceColor = (presence) => {
        switch (presence) {
            case 'online': return '#10B981'; // emerald
            case 'idle': return '#F59E0B'; // yellow
            case 'offline': return '#94A3B8'; // slate-400 (grey)
            default: return '#10B981'; // default to online
        }
    };

    return (
        <div className="h-16 px-6 border-b border-powder-blue dark:border-dark-border flex items-center bg-[#F8FAFD] dark:bg-dark-bg-secondary">
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                    {user.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-10 h-10 rounded-xl object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-powder-blue dark:bg-dark-border flex items-center justify-center">
                            <span className="text-base font-medium text-gunmetal dark:text-dark-text-primary">
                                {user.username?.[0]?.toUpperCase() || '?'}
                            </span>
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-dark-bg-secondary">
                        <div className="w-full h-full rounded-full" style={{ backgroundColor: getPresenceColor(user.presence) }} />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-base text-gunmetal dark:text-dark-text-primary">{user.username}</span>
                    {user.custom_status_text ? (
                        <span
                            className="text-sm"
                            style={{ color: user.custom_status_color }}
                        >
                            {user.custom_status_text}
                        </span>
                    ) : (
                        <span className="text-sm text-rose-quartz dark:text-dark-text-secondary">
                            {user.presence === 'online' ? 'Online' : user.presence === 'idle' ? 'Away' : 'Offline'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

DirectMessageHeader.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.string,
        username: PropTypes.string,
        avatar_url: PropTypes.string,
        presence: PropTypes.oneOf(['online', 'offline', 'idle']),
        custom_status_text: PropTypes.string,
        custom_status_color: PropTypes.string
    }).isRequired
};

export default DirectMessageHeader; 