import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { login, register } from '../services/api/auth';
import { toggleTheme } from '../utils/theme';

const Auth = ({ onLogin }) => {
    const [isSignIn, setIsSignIn] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isDark, setIsDark] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const isDarkMode = document.documentElement.classList.contains('dark');
        setIsDark(isDarkMode);
    }, []);

    // Handle background color during transition
    useEffect(() => {
        if (isLoggingIn) {
            document.body.style.backgroundColor = isDark ? '#1A1D1D' : '#F8FAFD';
        } else {
            document.body.style.backgroundColor = '';
        }
        return () => {
            document.body.style.backgroundColor = '';
        };
    }, [isLoggingIn, isDark]);

    const handleToggleTheme = () => {
        toggleTheme(isDark, setIsDark);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            setIsLoggingIn(true);
            let result;
            if (isSignIn) {
                result = await login(email, password);
            } else {
                result = await register(email, password, username);
            }

            // Wait for animation
            setTimeout(() => {
                onLogin(result.user);
            }, 300);
        } catch (err) {
            setIsLoggingIn(false);
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    const toggleMode = () => {
        setIsSignIn(!isSignIn);
        setError('');
        setEmail('');
        setPassword('');
        setUsername('');
    };

    return (
        <div className={`min-h-screen flex transform transition-all duration-300 ${isLoggingIn ? 'scale-105 opacity-0' : 'scale-100 opacity-100'}`}>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white dark:bg-dark-bg-secondary text-gunmetal dark:text-dark-text-primary border border-powder-blue dark:border-dark-border hover:bg-alice-blue dark:hover:bg-dark-bg-primary transition-colors duration-200"
                aria-label="Open menu"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Mobile Menu Overlay */}
            <div 
                className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
                    isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu Content */}
            <div 
                className={`lg:hidden fixed inset-y-0 left-0 w-80 bg-gunmetal dark:bg-dark-bg-secondary z-50 transform transition-transform duration-300 ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full p-8">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 text-powder-blue hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200"
                            aria-label="Close menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-8">
                        <div className="animate-fadeIn">
                            <h1 className="text-4xl font-bold text-alice-blue dark:text-dark-text-primary mb-4">ChatterBox</h1>
                            <p className="text-lg text-powder-blue dark:text-dark-text-secondary mb-8">Connect, collaborate, and communicate seamlessly with ChatterBox</p>
                        </div>

                        <div className="space-y-6 animate-slideUp">
                            <div className="flex items-center space-x-4">
                                <div className="w-1 h-8 bg-emerald"></div>
                                <p className="text-powder-blue dark:text-dark-text-primary text-lg">Real-time messaging</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="w-1 h-8 bg-emerald"></div>
                                <p className="text-powder-blue dark:text-dark-text-primary text-lg">Secure communications</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="w-1 h-8 bg-emerald"></div>
                                <p className="text-powder-blue dark:text-dark-text-primary text-lg">Team collaboration</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <a
                                href="https://github.com/AsherMorse/ChatterBox"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-powder-blue hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                                </svg>
                                <span>View on GitHub</span>
                            </a>
                            <div className="flex items-center justify-between text-powder-blue dark:text-dark-text-secondary">
                                <span>© 2024 ChatterBox. All rights reserved.</span>
                                <button
                                    onClick={handleToggleTheme}
                                    className="opacity-50 hover:opacity-100 transition-opacity duration-200"
                                    aria-label="Toggle theme"
                                >
                                    {isDark ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Left side - Brand/Image (desktop) */}
            <div className="hidden lg:flex lg:w-2/5 bg-gunmetal dark:bg-dark-bg-secondary flex-col justify-between p-12">
                <div className="animate-fadeIn">
                    <h1 className="text-4xl font-bold text-alice-blue dark:text-dark-text-primary mb-4">ChatterBox</h1>
                    <p className="text-lg text-powder-blue dark:text-dark-text-secondary mb-8">Connect, collaborate, and communicate seamlessly with ChatterBox</p>
                </div>
                <div className="space-y-6 animate-slideUp">
                    <div className="flex items-center space-x-4">
                        <div className="w-1 h-8 bg-emerald"></div>
                        <p className="text-powder-blue dark:text-dark-text-primary text-lg">Real-time messaging</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="w-1 h-8 bg-emerald"></div>
                        <p className="text-powder-blue dark:text-dark-text-primary text-lg">Secure communications</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="w-1 h-8 bg-emerald"></div>
                        <p className="text-powder-blue dark:text-dark-text-primary text-lg">Team collaboration</p>
                    </div>
                </div>
                <div className="space-y-4">
                    <a
                        href="https://github.com/AsherMorse/ChatterBox"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-powder-blue hover:text-emerald dark:text-dark-text-secondary dark:hover:text-emerald transition-colors duration-200"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                        </svg>
                        <span>View on GitHub</span>
                    </a>
                    <div className="flex items-center justify-between text-powder-blue dark:text-dark-text-secondary">
                        <span>© 2024 ChatterBox. All rights reserved.</span>
                        <button
                            onClick={handleToggleTheme}
                            className="opacity-50 hover:opacity-100 transition-opacity duration-200"
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right side - Auth Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-[#F8FAFD] dark:bg-dark-bg-primary transition-colors duration-200">
                <div className="w-full max-w-md space-y-8 animate-scale">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gunmetal dark:text-dark-text-primary mb-2">
                            {isSignIn ? 'Welcome back!' : 'Create an account'}
                        </h2>
                        <p className="text-rose-quartz dark:text-dark-text-secondary">
                            {isSignIn ? 'Sign in to continue to ChatterBox' : 'Get started with ChatterBox'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isSignIn && (
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gunmetal dark:text-dark-text-primary mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2 border border-powder-blue dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald bg-white dark:bg-dark-bg-primary placeholder-rose-quartz dark:placeholder-dark-text-secondary text-gunmetal dark:text-dark-text-primary transition-colors duration-200"
                                    placeholder="Choose a username"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gunmetal dark:text-dark-text-primary mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-powder-blue dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald bg-white dark:bg-dark-bg-primary placeholder-rose-quartz dark:placeholder-dark-text-secondary text-gunmetal dark:text-dark-text-primary transition-colors duration-200"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gunmetal dark:text-dark-text-primary mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-powder-blue dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald bg-white dark:bg-dark-bg-primary placeholder-rose-quartz dark:placeholder-dark-text-secondary text-gunmetal dark:text-dark-text-primary transition-colors duration-200"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full py-3 bg-emerald text-white rounded-lg hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald transition-all duration-200"
                        >
                            {isSignIn ? 'Sign In' : 'Create Account'}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="text-emerald hover:text-opacity-90 font-medium dark:text-emerald/90"
                            >
                                {isSignIn ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

Auth.propTypes = {
    onLogin: PropTypes.func.isRequired
};

export default Auth; 