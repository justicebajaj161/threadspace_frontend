import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Users, 
  Hash, 
  Calendar,
  MapPin,
  Mail,
  Edit,
  UserPlus,
  UserMinus,
  Settings,
  Heart,
  MessageCircle,
  Share,
  Loader2,
  AlertCircle,
  Camera,
  Save,
  X
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import apiService from '../services/api';

const Profile = ({ userId: propUserId }) => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: ''
  });
  const [followLoading, setFollowLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const fileInputRef = useRef(null);

  const { user: currentUser } = useAuthStore();
  
  // Determine which user profile to show
  const userId = propUserId || currentUser?._id;
  const isOwnProfile = userId === currentUser?._id;

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (isOwnProfile) {
        response = await apiService.getProfile();
        setProfile(response.data.user);
      } else {
        response = await apiService.getUserProfile(userId);
        setProfile(response.data.user);
      }
      
      // Initialize edit form with current data
      if (isOwnProfile) {
        setEditForm({
          firstName: response.data.user.firstName || '',
          lastName: response.data.user.lastName || '',
          bio: response.data.user.bio || ''
        });
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user posts
  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      // Note: You'll need to create this endpoint to get posts by user
      const response = await apiService.getUserPosts(userId);
      setPosts(response.data.posts || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch followers
  const fetchFollowers = async () => {
    try {
      setFollowersLoading(true);
      const response = await apiService.getFollowers(userId, 1, 50);
      setFollowers(response.data.followers || []);
    } catch (err) {
      console.error('Error fetching followers:', err);
      setFollowers([]);
    } finally {
      setFollowersLoading(false);
    }
  };

  // Fetch following
  const fetchFollowing = async () => {
    try {
      setFollowingLoading(true);
      const response = await apiService.getFollowing(userId, 1, 50);
      setFollowing(response.data.following || []);
    } catch (err) {
      console.error('Error fetching following:', err);
      setFollowing([]);
    } finally {
      setFollowingLoading(false);
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!profile || isOwnProfile) return;
    
    try {
      setFollowLoading(true);
      
      if (profile.isFollowing) {
        await apiService.unfollowUser(userId);
        setProfile(prev => ({
          ...prev,
          isFollowing: false,
          followersCount: prev.followersCount - 1
        }));
      } else {
        await apiService.followUser(userId);
        setProfile(prev => ({
          ...prev,
          isFollowing: true,
          followersCount: prev.followersCount + 1
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await apiService.updateProfile(editForm);
      setProfile(response.data.user);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    try {
      setImageUploadLoading(true);
      setError(null);
      
      // Use the auth store method to upload and update user data
      const { updateProfileImage } = useAuthStore.getState();
      const result = await updateProfileImage(file);
      
      if (result.success) {
        // Update local profile state
        setProfile(result.user);
        console.log('Profile image uploaded successfully:', result.user.profilePicture);
      } else {
        setError(result.error || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Profile image upload error:', err);
      setError(err.message || 'Failed to upload image');
    } finally {
      setImageUploadLoading(false);
    }
  };

  // Load data on component mount or when userId changes
  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Load tab-specific data
  useEffect(() => {
    if (!profile) return;
    
    switch (activeTab) {
      case 'posts':
        fetchPosts();
        break;
      case 'followers':
        fetchFollowers();
        break;
      case 'following':
        fetchFollowing();
        break;
      default:
        break;
    }
  }, [activeTab, profile]);

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchProfile}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">User Not Found</h3>
        <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg relative">
          {isOwnProfile && (
            <button className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70">
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="px-6 pb-6">
          {/* Profile Image */}
          <div className="flex items-end justify-between -mt-16 mb-4">
            <div className="relative">
              <div className="w-32 h-32 bg-blue-600 rounded-full border-4 border-white flex items-center justify-center overflow-hidden">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-4xl font-medium">
                    {profile.firstName?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              {isOwnProfile && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploadLoading}
                  className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {imageUploadLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              )}
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 mt-16">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 ${
                    profile.isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : profile.isFollowing ? (
                    <UserMinus className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>
                    {followLoading 
                      ? 'Processing...'
                      : profile.isFollowing 
                        ? 'Unfollow' 
                        : 'Follow'
                    }
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  {editForm.bio.length}/500 characters
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.fullName || `${profile.firstName} ${profile.lastName}`}
              </h1>
              
              <div className="flex items-center text-gray-600 mb-3">
                <Mail className="w-4 h-4 mr-2" />
                <span>{profile.email}</span>
              </div>

              {profile.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}

              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">{profile.postsCount || 0}</span>
                  <span className="text-gray-600 ml-1">Posts</span>
                </div>
                <button
                  onClick={() => setActiveTab('followers')}
                  className="hover:underline"
                >
                  <span className="font-semibold text-gray-900">{profile.followersCount || 0}</span>
                  <span className="text-gray-600 ml-1">Followers</span>
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className="hover:underline"
                >
                  <span className="font-semibold text-gray-900">{profile.followingCount || 0}</span>
                  <span className="text-gray-600 ml-1">Following</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'posts', label: 'Posts', icon: Hash },
              { key: 'followers', label: 'Followers', icon: Users },
              { key: 'following', label: 'Following', icon: Users }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'posts' && (
            <div>
              {postsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading posts...</p>
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                          {profile.profilePicture ? (
                            <img
                              src={profile.profilePicture}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm font-medium">
                              {profile.firstName?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{profile.fullName}</h4>
                            <span className="text-gray-500 text-sm">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-3">{post.content}</p>
                          {post.image && (
                            <img
                              src={post.image}
                              alt="Post"
                              className="rounded-lg mb-3 max-w-full h-auto"
                            />
                          )}
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <button className="flex items-center space-x-1 hover:text-red-500">
                              <Heart className="w-4 h-4" />
                              <span>{post.likesCount || 0}</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-blue-500">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.commentsCount || 0}</span>
                            </button>
                            <button className="flex items-center space-x-1 hover:text-green-500">
                              <Share className="w-4 h-4" />
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Hash className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                  <p className="text-gray-600">
                    {isOwnProfile 
                      ? "You haven't posted anything yet. Share your first post!" 
                      : "This user hasn't posted anything yet."
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'followers' && (
            <div>
              {followersLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading followers...</p>
                </div>
              ) : followers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {followers.map((follower) => (
                    <div key={follower._id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                        {follower.profilePicture ? (
                          <img
                            src={follower.profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-medium">
                            {follower.firstName?.[0]?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{follower.fullName}</h4>
                        <p className="text-sm text-gray-600">{follower.email}</p>
                      </div>
                      {!isOwnProfile && follower._id !== currentUser?._id && (
                        <button
                          className={`px-3 py-1 rounded text-sm ${
                            follower.isFollowing
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {follower.isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Followers</h3>
                  <p className="text-gray-600">
                    {isOwnProfile 
                      ? "You don't have any followers yet." 
                      : "This user doesn't have any followers yet."
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'following' && (
            <div>
              {followingLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading following...</p>
                </div>
              ) : following.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {following.map((followedUser) => (
                    <div key={followedUser._id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                        {followedUser.profilePicture ? (
                          <img
                            src={followedUser.profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-medium">
                            {followedUser.firstName?.[0]?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{followedUser.fullName}</h4>
                        <p className="text-sm text-gray-600">{followedUser.email}</p>
                      </div>
                      {!isOwnProfile && followedUser._id !== currentUser?._id && (
                        <button
                          className={`px-3 py-1 rounded text-sm ${
                            followedUser.isFollowing
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {followedUser.isFollowing ? 'Unfollow' : 'Follow'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Not Following Anyone</h3>
                  <p className="text-gray-600">
                    {isOwnProfile 
                      ? "You're not following anyone yet. Explore users to start following!" 
                      : "This user isn't following anyone yet."
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;