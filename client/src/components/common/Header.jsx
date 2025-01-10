import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toggleTheme } from '../../utils/theme';

const Header = ({ onLogout, isSidebarOpen, onToggleSidebar }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        setIsDark(isDarkMode);
    }, []);

    const handleToggleTheme = () => {
        toggleTheme(isDark, setIsDark);
    };

    return (
        <header className="bg-white dark:bg-dark-bg-secondary border-b border-powder-blue dark:border-dark-border transition-colors duration-200">
            <div className="h-16 px-6 flex items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggleSidebar}
                        className="lg:hidden -ml-2 p-2 rounded-xl text-gunmetal dark:text-dark-text-primary hover:bg-alice-blue dark:hover:bg-dark-bg-primary transition-colors duration-200"
                        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-gunmetal dark:text-dark-text-primary">ChatterBox</h1>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={handleToggleTheme}
                        className="p-2 text-rose-quartz dark:text-dark-text-secondary hover:text-emerald dark:hover:text-emerald rounded-lg transition-colors duration-200"
                        aria-label="Toggle theme"
                    >
                        {isDark ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

Header.propTypes = {
    onLogout: PropTypes.func.isRequired,
    isSidebarOpen: PropTypes.bool.isRequired,
    onToggleSidebar: PropTypes.func.isRequired
};

export default Header; 