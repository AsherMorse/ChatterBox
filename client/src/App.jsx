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

    useEffect(() => {
        // Initialize theme when app loads
        initializeTheme();

        // Set initial authentication state
        realtimeService.setAuthenticated(!!user);

        // Clean up on unmount
        return () => {
            realtimeService.setAuthenticated(false);
        };
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
        realtimeService.setAuthenticated(true);
    };

    const handleLogout = () => {
        // Set offline presence before logging out
        realtimeService.setPresence('offline').finally(() => {
            realtimeService.setAuthenticated(false);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setUser(null);
        });
    };

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
