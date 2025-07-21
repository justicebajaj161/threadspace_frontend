import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fix: Get token directly from the store, not getAuthToken function
  const { user, isAuthenticated, token } = useAuthStore();

  // Get server URL - handle different environments
  const getServerUrl = () => {
    // For Create React App
    if (typeof process !== 'undefined' && process.env?.REACT_APP_SERVER_URL) {
      return process.env.REACT_APP_SERVER_URL;
    }
    
    // For Vite
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL) {
      return import.meta.env.VITE_SERVER_URL;
    }
    
    // Fallback to localhost
    // return 'http://localhost:5000';
    return 'https://threadspace-backend.onrender.com/';
  };

  useEffect(() => {
    if (isAuthenticated && user && token) {
      console.log('🔌 Initializing socket connection...');
      
      const serverUrl = getServerUrl();
      console.log('🌐 Connecting to:', serverUrl);
      
      const newSocket = io(serverUrl, {
        auth: {
          token // Use the token from the store
        },
        transports: ['websocket', 'polling']
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to server via Socket.IO');
        setConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason);
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error);
        setConnected(false);
      });

      // Listen for new notifications
      newSocket.on('new_notification', (data) => {
        console.log('🔔 New notification received:', data);
        
        if (data.type === 'notification' && data.data) {
          // Add to notifications list
          setNotifications(prev => [data.data, ...prev]);
          
          // Update unread count
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          showToastNotification(data.data);
        }
      });

      // Listen for real-time updates
      newSocket.on('post_liked', (data) => {
        console.log('❤️ Post liked:', data);
        // Handle real-time post like updates
      });

      newSocket.on('post_commented', (data) => {
        console.log('💬 Post commented:', data);
        // Handle real-time comment updates
      });

      newSocket.on('user_followed', (data) => {
        console.log('👥 User followed:', data);
        // Handle real-time follow updates
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Cleaning up socket connection');
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    } else {
      // Clean up socket when user logs out or no token
      if (socket) {
        console.log('🔌 Cleaning up socket - user logged out or no token');
        socket.close();
        setSocket(null);
        setConnected(false);
        setNotifications([]);
        setUnreadCount(0);
      }
    }
  }, [isAuthenticated, user, token]); // Add token to dependencies

  // Function to show toast notifications
  const showToastNotification = (notification) => {
    if (!notification?.from) return;
    
    const message = `${notification.from.firstName} ${notification.from.lastName} ${getNotificationMessage(notification.type)}`;
    
    // Use browser notifications if permission is granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('SocialDash', {
        body: message,
        icon: '/favicon.ico',
        tag: notification._id
      });
    }
    
    // Optional: You can also add a toast library here
    // For example, if using react-hot-toast:
    // toast.success(message);
  };

  const getNotificationMessage = (type) => {
    switch (type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'share':
        return 'shared your post';
      default:
        return 'interacted with your content';
    }
  };

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  const value = {
    socket,
    connected,
    notifications,
    unreadCount,
    setNotifications,
    setUnreadCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};