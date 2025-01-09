import PropTypes from 'prop-types';

function DirectMessageHeader({ user }) {
    return (
        <div className="h-16 px-6 border-b border-powder-blue dark:border-dark-border flex items-center">
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                    <img
                        src={user.avatar_url || '/default-avatar.png'}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                    <div
                        className={`
                            absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full
                            ${user.presence === 'online' ? 'bg-emerald' : ''}
                            ${user.presence === 'idle' ? 'bg-yellow-400' : ''}
                            ${user.presence === 'offline' ? 'bg-rose-quartz' : ''}
                            border-2 border-white dark:border-dark-bg-secondary
                        `}
                    />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-base">{user.username}</span>
                    {user.custom_status_text && (
                        <span
                            className="text-sm"
                            style={{ color: user.custom_status_color }}
                        >
                            {user.custom_status_text}
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
        status: PropTypes.string
    })
};

export default DirectMessageHeader; 