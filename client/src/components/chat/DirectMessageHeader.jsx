import PropTypes from 'prop-types';

function DirectMessageHeader({ user }) {
    if (!user) return null;

    return (
        <div className="h-16 px-6 border-b border-powder-blue dark:border-dark-border flex items-center">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden">
                        {user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-base text-gunmetal dark:text-dark-text-primary">
                                {user.username[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-dark-bg-secondary ${
                        user.status === 'online' ? 'bg-emerald' : 'bg-rose-quartz'
                    }`}></div>
                </div>
                <div>
                    <h2 className="font-bold text-base text-gunmetal dark:text-dark-text-primary">
                        {user.username}
                    </h2>
                    <p className="text-sm text-rose-quartz dark:text-dark-text-secondary">
                        {user.status === 'online' ? 'Online' : 'Offline'}
                    </p>
                </div>
            </div>
        </div>
    );
}

DirectMessageHeader.propTypes = {
    user: PropTypes.shape({
        username: PropTypes.string.isRequired,
        avatar_url: PropTypes.string,
        status: PropTypes.string.isRequired
    })
};

export default DirectMessageHeader; 