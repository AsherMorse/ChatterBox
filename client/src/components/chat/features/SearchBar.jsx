import PropTypes from 'prop-types';
import { useState, useRef, useEffect } from 'react';

function SearchBar({ onSearch, searchResults, onMessageClick }) {
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchValue(value);
        onSearch(value);
        setIsDropdownVisible(!!value);
    };

    const handleMessageClick = (message) => {
        onMessageClick(message);
        setIsDropdownVisible(false);
        setSearchValue('');
        onSearch('');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-quartz dark:text-dark-text-secondary" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
            </svg>
            <input
                type="text"
                placeholder="Search messages..."
                value={searchValue}
                onChange={handleSearch}
                onFocus={() => setIsDropdownVisible(!!searchValue)}
                className="w-64 pl-10 pr-3 py-1.5 rounded-lg bg-white dark:bg-dark-bg-primary border border-powder-blue dark:border-dark-border hover:border-emerald dark:hover:border-emerald focus:outline-none focus:border-powder-blue dark:focus:border-dark-border text-sm text-gunmetal dark:text-dark-text-primary placeholder-rose-quartz dark:placeholder-dark-text-secondary transition-colors duration-200"
            />
            
            {/* Search Results Dropdown */}
            {isDropdownVisible && searchResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-96 mt-2 right-0 bg-white dark:bg-dark-bg-secondary border border-powder-blue dark:border-dark-border rounded-xl shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        {searchResults.map((message) => (
                            <div 
                                key={message.id}
                                onClick={() => handleMessageClick(message)}
                                className="p-2 hover:bg-alice-blue dark:hover:bg-dark-bg-primary rounded-lg cursor-pointer transition-colors duration-200"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-powder-blue dark:bg-dark-border overflow-hidden flex-shrink-0">
                                        {message.sender?.avatar_url ? (
                                            <img
                                                src={message.sender.avatar_url}
                                                alt={message.sender.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-sm text-gunmetal dark:text-dark-text-primary">
                                                {message.sender?.username?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="font-medium text-sm text-gunmetal dark:text-dark-text-primary">
                                                {message.sender?.username || 'Unknown User'}
                                            </span>
                                            <span className="text-xs text-rose-quartz dark:text-dark-text-secondary">
                                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gunmetal dark:text-dark-text-primary truncate">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

SearchBar.propTypes = {
    onSearch: PropTypes.func.isRequired,
    onMessageClick: PropTypes.func.isRequired,
    searchResults: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        content: PropTypes.string,
        created_at: PropTypes.string.isRequired,
        sender: PropTypes.shape({
            id: PropTypes.string,
            username: PropTypes.string,
            avatar_url: PropTypes.string
        })
    }))
};

export default SearchBar; 