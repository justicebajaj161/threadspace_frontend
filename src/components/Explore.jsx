import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  UserPlus, 
  UserMinus, 
  Search,
  Filter,
  Users,
  Loader2,
  AlertCircle,
  RefreshCw,
  Mail,
  Calendar,
  MapPin
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import apiService from '../services/api';

const Explore = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'not-following', 'following'
  const [followingUsers, setFollowingUsers] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const { user: currentUser } = useAuthStore();

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchUsers(query);
      } else {
        fetchUsers(1, true);
      }
    }, 500); // 500ms debounce delay
    
    setDebounceTimer(timer);
    
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Fetch all users
  const fetchUsers = async (page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      }
      
      const response = await apiService.getExploreUsers(page, 20);
      
      if (response.success) {
        const newUsers = response.data.users;
        
        if (reset) {
          setUsers(newUsers);
        } else {
          setUsers(prev => [...prev, ...newUsers]);
        }
        
        // Create a Set of user IDs that current user is following
        const followingSet = new Set();
        newUsers.forEach(user => {
          if (user.isFollowing) {
            followingSet.add(user._id);
          }
        });
        
        if (reset) {
          setFollowingUsers(followingSet);
        } else {
          setFollowingUsers(prev => new Set([...prev, ...followingSet]));
        }
        
        setHasMore(response.data.hasMore);
        setCurrentPage(page);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const searchUsers = async (query) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.searchUsers(query, 1, 20);
      
      if (response.success) {
        setUsers(response.data.users);
        
        // Update following status
        const followingSet = new Set();
        response.data.users.forEach(user => {
          if (user.isFollowing) {
            followingSet.add(user._id);
          }
        });
        setFollowingUsers(followingSet);
        
        setHasMore(response.data.hasMore);
        setCurrentPage(1);
      } else {
        throw new Error(response.message || 'Failed to search users');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error searching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Follow/Unfollow user
  const handleFollowToggle = async (userId, isCurrentlyFollowing) => {
    try {
      setActionLoading(prev => new Set(prev).add(userId));
      
      let response;
      if (isCurrentlyFollowing) {
        response = await apiService.unfollowUser(userId);
      } else {
        response = await apiService.followUser(userId);
      }
      
      if (response.success) {
        // Update local state
        setFollowingUsers(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyFollowing) {
            newSet.delete(userId);
          } else {
            newSet.add(userId);
          }
          return newSet;
        });

        // Update users array
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId 
              ? { 
                  ...user, 
                  isFollowing: !isCurrentlyFollowing,
                  followersCount: isCurrentlyFollowing 
                    ? user.followersCount - 1 
                    : user.followersCount + 1
                }
              : user
          )
        );
      } else {
        throw new Error(response.message || `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user`);
      }
    } catch (err) {
      setError(err.message);
      console.error(`Error ${isCurrentlyFollowing ? 'unfollowing' : 'following'} user:`, err);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Filter users based on search and filter criteria
  useEffect(() => {
    let filtered = users.filter(user => {
      // Don't show current user
      if (user._id === currentUser?._id) return false;
      
      // Follow status filter
      let matchesFilter = true;
      if (filter === 'not-following') {
        matchesFilter = !followingUsers.has(user._id);
      } else if (filter === 'following') {
        matchesFilter = followingUsers.has(user._id);
      }
      
      return matchesFilter;
    });
    
    setFilteredUsers(filtered);
  }, [users, filter, followingUsers, currentUser]);

  // Load users on component mount
  useEffect(() => {
    fetchUsers(1, true);
    
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, []);

  const getFilterStats = () => {
    const totalUsers = users.filter(user => user._id !== currentUser?._id).length;
    const followingCount = users.filter(user => 
      user._id !== currentUser?._id && followingUsers.has(user._id)
    ).length;
    const notFollowingCount = totalUsers - followingCount;

    return { totalUsers, followingCount, notFollowingCount };
  };

  const { totalUsers, followingCount, notFollowingCount } = getFilterStats();

  // Load more users
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchUsers(currentPage + 1, false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Users</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => fetchUsers(1, true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Users</h1>
        <p className="text-gray-600">
          Discover and connect with other users in the community
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <UserPlus className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Following</p>
              <p className="text-2xl font-semibold text-gray-900">{followingCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <User className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Not Following</p>
              <p className="text-2xl font-semibold text-gray-900">{notFollowingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Users</option>
              <option value="not-following">Not Following</option>
              <option value="following">Following</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <div key={user._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* User Avatar */}
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4 overflow-hidden">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-lg font-medium">
                    {user.firstName?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {user.fullName || `${user.firstName} ${user.lastName}`}
                </h3>
                <p className="text-sm text-gray-600 flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {user.email}
                </p>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-2 mb-4">
              {user.bio && (
                <p className="text-sm text-gray-600 line-clamp-2">{user.bio}</p>
              )}
              
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-1" />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{user.followersCount || 0} followers</span>
                <span>{user.followingCount || 0} following</span>
                <span>{user.postsCount || 0} posts</span>
              </div>
            </div>

            {/* Follow Button */}
            <button
              onClick={() => handleFollowToggle(user._id, followingUsers.has(user._id))}
              disabled={actionLoading.has(user._id)}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                followingUsers.has(user._id)
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${actionLoading.has(user._id) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {actionLoading.has(user._id) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : followingUsers.has(user._id) ? (
                <UserMinus className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>
                {actionLoading.has(user._id) 
                  ? 'Processing...' 
                  : followingUsers.has(user._id) 
                    ? 'Unfollow' 
                    : 'Follow'
                }
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* No Users Found */}
      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `No users found matching "${searchTerm}"`
              : filter === 'following' 
                ? "You're not following anyone yet"
                : "No users available to follow"
            }
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && filteredUsers.length > 0 && !searchTerm && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 mx-auto"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{loading ? 'Loading...' : 'Load More'}</span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;