import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Chat from './components/chat/core/Chat';
import BrowseChannels from './pages/BrowseChannels';
import { getUser } from './services/api/auth';
import { initializeTheme } from './utils/theme';
import realtimeService from './services/realtime/realtimeService';

function App() {
    const [user, setUser] = useState(getUser());
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Initialize theme when app loads
        initializeTheme();

        // Initialize realtime service
        const initializeApp = async () => {
            try {
                // Initialize realtime service
                await realtimeService.initialize();
                
                // Set initial authentication state
                realtimeService.setAuthenticated(!!user);
                setIsInitialized(true);
            } catch (error) {
                console.error('Error initializing app:', error);
                setIsInitialized(true);
            }
        };

        initializeApp();

        // Clean up on unmount
        return () => {
            realtimeService.setAuthenticated(false);
        };
    }, [user]);

    const handleLogin = (userData) => {
        setUser(userData);
        if (realtimeService.setAuthenticated) {
            realtimeService.setAuthenticated(true);
        }
    };

    const handleLogout = async () => {
        try {
            // Set offline presence before logging out
            if (realtimeService.setPresence) {
                await realtimeService.setPresence('offline');
            }
            if (realtimeService.setAuthenticated) {
                realtimeService.setAuthenticated(false);
            }
        } catch (error) {
            console.error('Error during logout:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    // Show loading state while initializing
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-alice-blue dark:bg-dark-bg-primary">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald"></div>
            </div>
        );
    }

    if (!user) {
        return <Auth onLogin={handleLogin} />;
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Chat onLogout={handleLogout} />} />
                <Route path="/browse-channels" element={<BrowseChannels />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
