import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.messageHandlers = new Set();
        this.typingHandlers = new Set();
    }

    connect(token) {
        this.socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3000', {
            auth: { token }
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });

        this.socket.on('new_message', (message) => {
            this.messageHandlers.forEach(handler => handler(message));
        });

        this.socket.on('user_typing', (data) => {
            this.typingHandlers.forEach(handler => handler(data));
        });

        this.socket.on('user_stopped_typing', (data) => {
            this.typingHandlers.forEach(handler => handler(data));
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinChannel(channelId) {
        if (this.socket) {
            this.socket.emit('join_channel', channelId);
        }
    }

    leaveChannel(channelId) {
        if (this.socket) {
            this.socket.emit('leave_channel', channelId);
        }
    }

    sendMessage(message) {
        if (this.socket) {
            this.socket.emit('send_message', message);
        }
    }

    startTyping(channelId) {
        if (this.socket) {
            this.socket.emit('typing_start', channelId);
        }
    }

    stopTyping(channelId) {
        if (this.socket) {
            this.socket.emit('typing_stop', channelId);
        }
    }

    onMessage(handler) {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    onTyping(handler) {
        this.typingHandlers.add(handler);
        return () => this.typingHandlers.delete(handler);
    }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService; 