import React, { useState, useEffect } from 'react';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Share,
  X,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Crown
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import apiService from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../contexts/SocketContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'like', 'comment', 'follow'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { user } = useAuthStore();

  const { notifications: realtimeNotifications, setNotifications: setRealtimeNotifications, setUnreadCount } = useSocket();

  // Notification type icons and colors
  const notificationConfig = {
    like: {
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      message: 'liked your post'
    },
    comment: {
      icon: MessageCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      message: 'commented on your post'
    },
    follow: {
      icon: UserPlus,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      message: 'started following you'
    },
    share: {
      icon: Share,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      message: 'shared your post'
    }
  };

  // Helper function to check if user is premium
  const isPremiumUser = (user) => {
    return user && (user.isPremium || user.subscriptionType === 'premium');
  };

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1 && !append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // Fix: Only pass type to API if it's a valid notification type, not 'unread'
      const typeParam = (filter !== 'all' && filter !== 'unread') ? filter : undefined;
      const response = await apiService.getNotifications(pageNum, 20, typeParam);
      
      if (response.success) {
        let newNotifications = response.data.notifications;
        
        // Handle client-side filtering for 'unread'
        if (filter === 'unread') {
          newNotifications = newNotifications.filter(n => !n.isRead);
        }
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications]);
        } else {
          setNotifications(newNotifications);
          // Also update the socket context notifications
          setRealtimeNotifications(newNotifications);
        }
        
        // Update unread count in socket context
        const unreadCount = newNotifications.filter(n => !n.isRead).length;
        setUnreadCount(unreadCount);
        
        setHasMore(response.data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      
      // Update unread count
      const unreadCount = notifications.filter(n => !n.isRead && n._id !== notificationId).length;
      setUnreadCount(unreadCount);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await apiService.deleteNotification(notificationId);
      setNotifications(prev =>
        prev.filter(notif => notif._id !== notificationId)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Handle bulk actions
  const handleBulkMarkAsRead = async () => {
    try {
      const notificationIds = Array.from(selectedNotifications);
      await apiService.bulkMarkNotificationsAsRead(notificationIds);
      
      setNotifications(prev =>
        prev.map(notif =>
          selectedNotifications.has(notif._id) ? { ...notif, isRead: true } : notif
        )
      );
      
      setSelectedNotifications(new Set());
      setShowBulkActions(false);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm('Are you sure you want to delete selected notifications?')) return;
    
    try {
      const notificationIds = Array.from(selectedNotifications);
      await apiService.bulkDeleteNotifications(notificationIds);
      
      setNotifications(prev =>
        prev.filter(notif => !selectedNotifications.has(notif._id))
      );
      
      setSelectedNotifications(new Set());
      setShowBulkActions(false);
    } catch (err) {
      console.error('Error deleting notifications:', err);
    }
  };

  // Handle notification selection
  const toggleNotificationSelection = (notificationId) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedNotifications(new Set(filteredNotifications.map(n => n._id)));
  };

  const deselectAll = () => {
    setSelectedNotifications(new Set());
  };

  // Load more notifications
  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchNotifications(page + 1, true);
    }
  };

  // Filter change handler
  useEffect(() => {
    setPage(1);
    setSelectedNotifications(new Set());
    fetchNotifications(1, false);
  }, [filter]);

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedNotifications.size > 0);
  }, [selectedNotifications]);

  // Filter notifications on the client side
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading && notifications.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Notifications</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchNotifications()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Bell className="w-8 h-8 mr-3" />
              Notifications
              {unreadCount > 0 && (
                <span className="ml-3 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              Stay updated with your latest interactions
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Filter className="w-4 h-4 text-gray-500 mr-2" />
              {['all', 'unread', 'like', 'comment', 'follow'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    filter === filterOption
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filterOption === 'like' ? 'Likes' : 
                   filterOption === 'comment' ? 'Comments' :
                   filterOption === 'follow' ? 'Follows' :
                   filterOption === 'unread' ? 'Unread' : 'All'}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              {selectedNotifications.size === 0 ? (
                <button
                  onClick={selectAll}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Select All
                </button>
              ) : (
                <button
                  onClick={deselectAll}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Deselect All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="p-4 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {selectedNotifications.size} notification{selectedNotifications.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkMarkAsRead}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Mark as Read
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              config={notificationConfig[notification.type]}
              isSelected={selectedNotifications.has(notification._id)}
              onSelect={() => toggleNotificationSelection(notification._id)}
              onMarkAsRead={() => markAsRead(notification._id)}
              onDelete={() => deleteNotification(notification._id)}
              isPremiumUser={isPremiumUser}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && filteredNotifications.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-2 mx-auto"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            <span>{loadingMore ? 'Loading...' : 'Load More'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Individual Notification Card Component
const NotificationCard = ({
  notification,
  config,
  isSelected,
  onSelect,
  onMarkAsRead,
  onDelete,
  isPremiumUser
}) => {
  const [showActions, setShowActions] = useState(false);
  
  const Icon = config?.icon || Bell;
  
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead();
    }
  };

  const getNotificationContent = () => {
    switch (notification.type) {
      case 'like':
        return (
          <div>
            <span className="font-medium flex items-center">
              {notification.from.firstName} {notification.from.lastName}
              {isPremiumUser(notification.from) && (
                <Crown className="w-3 h-3 text-yellow-500 ml-1" title="Premium Member" />
              )}
            </span>
            <span className="text-gray-600"> liked your post</span>
            {notification.data?.postContent && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                "{notification.data.postContent}"
              </p>
            )}
          </div>
        );
      case 'comment':
        return (
          <div>
            <span className="font-medium flex items-center">
              {notification.from.firstName} {notification.from.lastName}
              {isPremiumUser(notification.from) && (
                <Crown className="w-3 h-3 text-yellow-500 ml-1" title="Premium Member" />
              )}
            </span>
            <span className="text-gray-600"> commented on your post</span>
            {notification.data?.commentContent && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                "{notification.data.commentContent}"
              </p>
            )}
          </div>
        );
      case 'follow':
        return (
          <div>
            <span className="font-medium flex items-center">
              {notification.from.firstName} {notification.from.lastName}
              {isPremiumUser(notification.from) && (
                <Crown className="w-3 h-3 text-yellow-500 ml-1" title="Premium Member" />
              )}
            </span>
            <span className="text-gray-600"> started following you</span>
          </div>
        );
      default:
        return (
          <div>
            <span className="font-medium flex items-center">
              {notification.from.firstName} {notification.from.lastName}
              {isPremiumUser(notification.from) && (
                <Crown className="w-3 h-3 text-yellow-500 ml-1" title="Premium Member" />
              )}
            </span>
            <span className="text-gray-600"> {notification.message}</span>
          </div>
        );
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer ${
        !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Selection Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>

        {/* Notification Icon */}
        <div className={`p-2 rounded-full ${config?.bgColor || 'bg-gray-50'}`}>
          <Icon className={`w-4 h-4 ${config?.color || 'text-gray-500'}`} />
        </div>

        {/* User Avatar */}
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
          {notification.from.profilePicture ? (
            <img
              src={notification.from.profilePicture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-sm font-medium">
              {notification.from.firstName?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          {getNotificationContent()}
          <p className="text-xs text-gray-500 mt-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Actions */}
        <div className="relative flex items-center space-x-2">
          {!notification.isRead && (
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>

          {showActions && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead();
                    setShowActions(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark as Read</span>
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowActions(false);
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;