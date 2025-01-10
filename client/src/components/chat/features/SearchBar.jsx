import PropTypes from 'prop-types';

function SearchBar({ onSearch }) {
    const handleSearch = (e) => {
        onSearch(e.target.value);
    };

    return (
        <div className="relative">
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
                onChange={handleSearch}
                className="w-64 pl-10 pr-3 py-1.5 rounded-lg bg-white dark:bg-dark-bg-primary border border-powder-blue dark:border-dark-border hover:border-emerald dark:hover:border-emerald focus:outline-none focus:border-powder-blue dark:focus:border-dark-border text-sm text-gunmetal dark:text-dark-text-primary placeholder-rose-quartz dark:placeholder-dark-text-secondary transition-colors duration-200"
            />
        </div>
    );
}

SearchBar.propTypes = {
    onSearch: PropTypes.func.isRequired
};

export default SearchBar; 