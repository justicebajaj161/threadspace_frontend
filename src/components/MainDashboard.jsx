import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  TrendingUp, 
  Users, 
  Eye,
  Plus,
  Search,
  Bell,
  Settings,
  Home,
  User,
  Hash,
  Bookmark,
  LogOut,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import AddNewPost from './AddNewPost';
import PostsFeed from './PostsFeed';
import Explore from './Explore';
import Profile from './Profile';
import Notifications from './Notifications';
import { useSocket } from '../contexts/SocketContext';
import SubscriptionDetails from './SubscriptionDetails';

const MainDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);
  const [refreshPosts, setRefreshPosts] = useState(0);

  // Socket context
  const { connected, notifications, unreadCount, setUnreadCount } = useSocket();

  // Zustand store
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    logout, 
    getProfile, 
    clearError,
    checkAuth,
    initializeAuth 
  } = useAuthStore();

  const navigate = useNavigate();

  // Initialize auth on component mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !checkAuth()) {
      navigate('/login');
    }
  }, [isLoading, checkAuth, navigate]);

  // Fetch user profile if not available
  useEffect(() => {
    if (isAuthenticated && !user && !isLoading) {
      getProfile();
    }
  }, [isAuthenticated, user, isLoading, getProfile]);

  // Refresh user profile data periodically to ensure profile picture is up to date
  useEffect(() => {
    if (isAuthenticated && user) {
      const refreshProfile = async () => {
        try {
          await getProfile();
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        }
      };
      
      // Refresh profile every 30 seconds to catch profile picture updates
      const interval = setInterval(refreshProfile, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, getProfile]);

  // Debug: Log user data to see if profilePicture exists
  useEffect(() => {
    if (user) {
      console.log('User data in MainDashboard:', user);
      console.log('Profile picture URL:', user.profilePicture);
      console.log('User ID:', user._id);
      console.log('User name:', user.firstName, user.lastName);
      
      // Check if profilePicture is a valid URL
      if (user.profilePicture) {
        console.log('Profile picture URL is valid:', user.profilePicture);
        // Test if the image loads
        const img = new Image();
        img.onload = () => console.log('Profile picture loads successfully');
        img.onerror = () => console.log('Profile picture failed to load');
        img.src = user.profilePicture;
      } else {
        console.log('No profile picture URL found');
      }
    }
  }, [user]);

  // Sample data for stats cards
  const stats = [
    { label: 'Total Followers', value: user?.followersCount || '0', change: '+12%', icon: Users },
    { label: 'Total Posts', value: user?.postsCount || '0', change: '+8%', icon: Hash },
    { label: 'Engagement Rate', value: '4.2%', change: '+2.1%', icon: TrendingUp },
    { label: 'Profile Views', value: '12.8K', change: '+15%', icon: Eye },
  ];

  const sidebarItems = [
    { icon: Home, label: 'Home', key: 'home' },
    { icon: User, label: 'Profile', key: 'profile' },
    { icon: Hash, label: 'Explore', key: 'explore' },
    { icon: Bell, label: 'Notifications', key: 'notifications' },
    { icon: Bookmark, label: 'Saved', key: 'saved' },
    { icon: Settings, label: 'Settings', key: 'settings' },
    { icon: Settings, label: 'Subscription Details', key: 'subscription-details' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to login
      window.location.href = '/login';
    }
  };

  // Handle notification dropdown item click
  const handleNotificationClick = (notification) => {
    // Mark as read if unread and navigate to relevant content
    if (!notification.isRead) {
      // You can call mark as read API here
    }
    setShowNotifications(false);
    
    // Navigate based on notification type
    if (notification.type === 'like' || notification.type === 'comment') {
      // Navigate to post or stay on home
      setActiveTab('home');
    } else if (notification.type === 'follow') {
      // Navigate to profile or explore
      setActiveTab('profile');
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error if authentication fails
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              clearError();
              window.location.href = '/login';
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and connection status */}
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">ThreadSpace</h1>
              <div 
                className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} 
                title={connected ? 'Real-time connected' : 'Disconnected'}
              />
              {connected && (
                <span className="text-xs text-green-600 hidden sm:inline">Live</span>
              )}
            </div>
            
            {/* Center - Search Bar */}
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search posts, users..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  className="p-2 text-gray-400 hover:text-gray-600 relative transition-colors"
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                  }}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        {connected && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            🟢 Live
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {notifications && notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notification) => (
                          <div 
                            key={notification._id} 
                            className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {notification.from?.profilePicture ? (
                                  <img
                                    src={notification.from.profilePicture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white text-xs font-medium">
                                    {notification.from?.firstName?.[0]?.toUpperCase() || 'U'}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800">
                                  <span className="font-medium">
                                    {notification.from?.firstName} {notification.from?.lastName}
                                  </span>
                                  <span className="text-gray-600"> {notification.message}</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      )}
                    </div>

                    {notifications && notifications.length > 5 && (
                      <div className="p-3 border-t border-gray-200 bg-gray-50">
                        <button
                          onClick={() => {
                            setActiveTab('notifications');
                            setShowNotifications(false);
                          }}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* New Post Button */}
              <button 
                onClick={() => setShowAddPost(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Post</span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button 
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setShowUserMenu(!showUserMenu);
                    setShowNotifications(false);
                  }}
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Navbar profile picture failed to load:', user.profilePicture);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span 
                      className={`text-white text-sm font-medium ${user?.profilePicture ? 'hidden' : 'flex items-center justify-center w-full h-full'}`}
                    >
                      {user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Your Profile
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('subscription-details');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Subscription Details
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              {/* User Info */}
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Profile picture failed to load:', user.profilePicture);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span 
                    className={`text-white text-xl font-medium ${user?.profilePicture ? 'hidden' : 'flex items-center justify-center w-full h-full'}`}
                  >
                    {user?.firstName?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900">
                  {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                </h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
                {user?.bio && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{user.bio}</p>
                )}
                {/* Debug info - remove this later */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-400">
                      Profile Pic: {user?.profilePicture ? 'Yes' : 'No'}
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          await getProfile();
                          console.log('Profile refreshed manually');
                        } catch (error) {
                          console.error('Manual refresh failed:', error);
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      Refresh Profile
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === item.key
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                    {item.key === 'notifications' && unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === 'home' && (
              <>
                {/* Welcome Message */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.firstName || 'User'}!
                  </h2>
                  <p className="text-gray-600">
                    Here's what's happening in your social network today.
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{stat.label}</p>
                          <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                          <p className="text-sm text-green-600">{stat.change}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full">
                          <stat.icon className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Posts Feed */}
                <PostsFeed refreshTrigger={refreshPosts} />
              </>
            )}

            {activeTab === 'explore' && <Explore />}
            {activeTab === 'profile' && <Profile />}
            {activeTab === 'notifications' && <Notifications />}
            {activeTab === 'subscription-details' && <SubscriptionDetails />}
            
            {activeTab === 'saved' && (
              <div className="text-center py-12">
                <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Saved Posts</h2>
                <p className="text-gray-600">Your saved posts will appear here.</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="text-center py-12">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
                <p className="text-gray-600">Account settings and preferences.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add New Post Modal */}
      <AddNewPost 
        isOpen={showAddPost}
        onClose={() => setShowAddPost(false)}
        onPostCreated={(newPost) => {
          console.log('Post created successfully!', newPost);
          setRefreshPosts(prev => prev + 1);
          setShowAddPost(false);
        }}
      />

      {/* Click outside handlers */}
      {(showUserMenu || showNotifications) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </div>
  );
};

export default MainDashboard;