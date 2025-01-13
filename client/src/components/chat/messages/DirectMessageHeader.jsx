import React from 'react';
import PropTypes from 'prop-types';
import { CHATTERBOT_ID } from '../../../services/api/chatterbotService';

function DirectMessageHeader({ user }) {
    // Special header for ChatterBot
    if (user.id === CHATTERBOT_ID) {
        return (
            <div className="flex items-center gap-3">
                {/* Bot Avatar */}
                <div className="w-8 h-8 rounded-full bg-emerald/10 dark:bg-emerald/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <h2 className="font-bold text-base text-gunmetal dark:text-dark-text-primary">
                        {user.username}
                    </h2>
                    <span className="text-xs text-rose-quartz dark:text-dark-text-secondary">
                        AI Assistant
                    </span>
                </div>
            </div>
        );
    }

    // Regular user header
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
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
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-dark-bg-secondary">
                    <div 
                        className="w-full h-full rounded-full"
                        style={{ 
                            backgroundColor: user.presence === 'online' ? '#10B981' 
                                : user.presence === 'idle' ? '#F59E0B' 
                                : '#94A3B8'
                        }}
                    />
                </div>
            </div>
            <div className="flex flex-col">
                <h2 className="font-bold text-base text-gunmetal dark:text-dark-text-primary">
                    {user.username}
                </h2>
                <span className="text-xs text-rose-quartz dark:text-dark-text-secondary">
                    {user.presence === 'online' ? 'Online' 
                        : user.presence === 'idle' ? 'Idle' 
                        : 'Offline'}
                </span>
            </div>
        </div>
    );
}

DirectMessageHeader.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
        avatar_url: PropTypes.string,
        presence: PropTypes.string,
        isBot: PropTypes.bool
    }).isRequired
};

export default DirectMessageHeader; 