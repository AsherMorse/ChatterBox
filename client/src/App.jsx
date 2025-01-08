import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Chat from './components/chat/Chat';
import BrowseChannels from './pages/BrowseChannels';
import { getUser } from './services/api/auth';
import { initializeTheme } from './utils/theme';

function App() {
    const [user, setUser] = useState(getUser());

    useEffect(() => {
        // Initialize theme when app loads
        initializeTheme();
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
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
