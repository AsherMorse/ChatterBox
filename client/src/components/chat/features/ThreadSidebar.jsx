import PropTypes from 'prop-types';

function ThreadSidebar({ isOpen, onClose }) {
    return (
        <div 
            className={`
                fixed top-[80px] h-[calc(100vh-80px-16px)] w-[400px] 
                bg-white dark:bg-dark-bg-secondary
                border border-powder-blue dark:border-dark-border
                transition-all duration-200
                shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(0,0,0,0.3)]
                rounded-2xl
                z-40
                ${isOpen ? 'right-4 opacity-100' : '-right-[420px] opacity-0 pointer-events-none'}
            `}
        >
            {/* Header */}
            <div className="h-16 px-6 border-b border-powder-blue dark:border-dark-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gunmetal dark:text-dark-text-primary">Thread</h2>
                <button
                    onClick={onClose}
                    className="p-2 text-rose-quartz hover:text-emerald hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-lg transition-colors duration-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content Area */}
            <div className="h-[calc(100%-4rem)] flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Placeholder for thread messages */}
                    <div className="text-rose-quartz dark:text-dark-text-secondary text-sm">
                        Thread messages will appear here
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-powder-blue dark:border-dark-border">
                    <div className="bg-alice-blue dark:bg-dark-bg-primary rounded-xl p-2 text-rose-quartz dark:text-dark-text-secondary text-sm">
                        Reply input will go here
                    </div>
                </div>
            </div>
        </div>
    );
}

ThreadSidebar.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default ThreadSidebar; 