import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Auth from './pages/Auth';
import BrowseChannels from './pages/BrowseChannels';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Chat from './components/chat/Chat';
import { getToken, logout } from './services/api/auth';
import './styles/App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(!!token);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/chat" replace />
            ) : (
              <Auth onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/chat"
          element={
            isAuthenticated ? (
              <Chat onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/browse-channels"
          element={
            isAuthenticated ? (
              <BrowseChannels />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
