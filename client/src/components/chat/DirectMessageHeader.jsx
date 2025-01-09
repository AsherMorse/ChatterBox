import PropTypes from 'prop-types';

function DirectMessageHeader({ user }) {
    return (
        <div className="h-16 px-6 border-b border-powder-blue dark:border-dark-border flex items-center">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden">
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.username}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm text-gunmetal dark:text-dark-text-primary">
                                {user?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-dark-bg-secondary ${
                        user?.status === 'online' ? 'bg-emerald' : 'bg-rose-quartz'
                    }`}></div>
                </div>
                <h2 className="font-bold text-base text-gunmetal dark:text-dark-text-primary">
                    {user?.username || 'Loading...'}
                </h2>
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