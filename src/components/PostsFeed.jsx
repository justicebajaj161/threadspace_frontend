import React, { useState, useEffect, useCallback } from 'react';
import {
    Heart,
    MessageCircle,
    Share,
    MoreHorizontal,
    Globe,
    Users,
    Lock,
    Trash2,
    Edit,
    Trash2Icon,
    Crown,
    Search,
    X
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import apiService from '../services/api';

const PostsFeed = ({ refreshTrigger }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    const { user } = useAuthStore();

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Search effect
    useEffect(() => {
        if (debouncedSearchQuery.trim().length >= 2) {
            performSearch(debouncedSearchQuery);
        } else if (debouncedSearchQuery.trim().length === 0 && showSearch) {
            // Clear search results and show normal posts
            setSearchResults([]);
            setShowSearch(false);
            loadPosts(1, true); // Reset to first page
        }
    }, [debouncedSearchQuery]);

    // Perform search
    const performSearch = async (query) => {
        try {
            setIsSearching(true);
            setShowSearch(true);
            const response = await apiService.searchPosts(query, 1, 10);
            setSearchResults(response.data.posts || []);
        } catch (err) {
            console.error('Search error:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowSearch(false);
        loadPosts(1, true); // Reset to first page
    };

    // Privacy icons
    const privacyIcons = {
        public: Globe,
        friends: Users,
        private: Lock
    };

    // Load posts
    const loadPosts = async (pageNum = 1, append = false) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const response = await apiService.getPosts(pageNum, 10);

            if (response.success) {
                const newPosts = response.data.posts;

                if (append) {
                    setPosts(prev => [...prev, ...newPosts]);
                } else {
                    setPosts(newPosts);
                }

                setHasMore(response.data.pagination.hasNextPage);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Failed to load posts:', error);
            setError('Failed to load posts');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Load more posts
    const loadMore = () => {
        if (!loadingMore && hasMore) {
            loadPosts(page + 1, true);
        }
    };

    // Handle like/unlike
    const handleLike = async (postId) => {
        try {
            const response = await apiService.likePost(postId);

            if (response.success) {
                setPosts(prev => prev.map(post =>
                    post._id === postId
                        ? {
                            ...post,
                            isLiked: response.data.isLiked,
                            likesCount: response.data.likesCount
                        }
                        : post
                ));
            }
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    };

    // Handle comment submission
    const handleComment = async (postId, content) => {
        if (!content.trim()) return;

        try {
            const response = await apiService.addComment(postId, content);

            if (response.success) {
                setPosts(prev => prev.map(post =>
                    post._id === postId
                        ? {
                            ...post,
                            comments: [...(post.comments || []), response.data.comment],
                            commentsCount: response.data.commentsCount
                        }
                        : post
                ));
            }
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    // Handle delete post
    const handleDelete = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await apiService.deletePost(postId);

            if (response.success) {
                setPosts(prev => prev.filter(post => post._id !== postId));
            }
        } catch (error) {
            console.error('Failed to delete post:', error);
        }
    };

    // Format time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Load posts on mount and refresh trigger
    useEffect(() => {
        loadPosts();
    }, [refreshTrigger]);

    // Don't render if user is not loaded yet
    if (!user) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search posts..."
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={clearSearch}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>

                {/* Search Status */}
                {showSearch && (
                    <div className="mt-2 text-sm text-gray-600">
                        {isSearching ? (
                            <span>Searching...</span>
                        ) : (
                            <span>
                                {searchResults.length > 0
                                    ? `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${debouncedSearchQuery}"`
                                    : `No results found for "${debouncedSearchQuery}"`
                                }
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Posts */}
            {loading && !showSearch ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading posts...</p>
                </div>
            ) : error && !showSearch ? (
                <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => loadPosts(1, true)}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Display search results or normal posts */}
                    {(showSearch ? searchResults : posts).map((post) => (
                        <PostCard
                            key={post._id}
                            post={post}
                            currentUser={user}
                            onLike={handleLike}
                            onComment={handleComment}
                            onDelete={handleDelete}
                            formatTime={formatTime}
                            privacyIcons={privacyIcons}
                        />
                    ))}

                    {/* No results message */}
                    {showSearch && searchResults.length === 0 && !isSearching && (
                        <div className="text-center py-8">
                            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Found</h3>
                            <p className="text-gray-600">
                                No posts match your search for "{debouncedSearchQuery}"
                            </p>
                        </div>
                    )}

                    {/* Load more button for normal posts */}
                    {!showSearch && hasMore && posts.length > 0 && (
                        <div className="text-center">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Individual Post Card Component with Premium Badge Support
const PostCard = ({
    post,
    currentUser,
    onLike,
    onComment,
    onDelete,
    formatTime,
    privacyIcons
}) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showActions, setShowActions] = useState(false);

    // Safety check for post and currentUser
    if (!post || !post.author || !currentUser) {
        return null;
    }

    const PrivacyIcon = privacyIcons[post.privacy] || Globe;
    const isOwner = post.author._id === currentUser._id;

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (commentText.trim()) {
            onComment(post._id, commentText);
            setCommentText('');
        }
    };

    // Helper function to check if user is premium
    const isPremiumUser = (user) => {
        return user && (user.isPremium || user.subscriptionType === 'premium');
    };

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {/* Post Header */}
            <div className="p-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                            {post.author.profilePicture ? (
                                <img
                                    src={post.author.profilePicture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-white text-sm font-medium">
                                    {post.author.firstName?.[0]?.toUpperCase() || 'U'}
                                </span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-gray-900 flex items-center">
                                    {`${post.author.firstName || ''} ${post.author.lastName || ''}`}
                                    {isPremiumUser(post.author) && (
                                        <Crown className="w-4 h-4 text-yellow-500 ml-1" title="Premium Member" />
                                    )}
                                </h3>
                                <PrivacyIcon className="w-3 h-3 text-gray-500" />
                            </div>
                            <p className="text-sm text-gray-500">{formatTime(post.createdAt)}</p>
                        </div>
                    </div>

                    {isOwner && (
                        <div className="relative">
                            <button
                                onClick={() => setShowActions(!showActions)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <MoreHorizontal className="w-5 h-5 text-gray-500" />
                            </button>

                            {showActions && (
                                <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                                    <button
                                        onClick={() => {
                                            onDelete(post._id);
                                            setShowActions(false);
                                        }}
                                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2Icon className="w-4 h-4" />
                                        <span>Delete</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Post Content */}
                {post.content && (
                    <p className="mt-4 text-gray-700 whitespace-pre-wrap">{post.content}</p>
                )}

                {/* Post Location & Feeling */}
                {(post.location || post.feeling) && (
                    <div className="mt-2 text-sm text-gray-600">
                        {post.location && <span>📍 {post.location}</span>}
                        {post.location && post.feeling && <span className="mx-2">•</span>}
                        {post.feeling && <span>😊 {post.feeling}</span>}
                    </div>
                )}

                {/* Post Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {post.tags.map((tag, index) => (
                            <span key={index} className="text-blue-600 text-sm">#{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Post Images */}
            {post.images && post.images.length > 0 && (
                <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' :
                        post.images.length === 2 ? 'grid-cols-2' :
                            post.images.length === 3 ? 'grid-cols-2' : 'grid-cols-2'
                    }`}>
                    {post.images.map((image, index) => (
                        <div key={index} className={`relative ${post.images.length === 3 && index === 0 ? 'col-span-2' : ''
                            }`}>
                            <img
                                src={image.url}
                                alt={image.alt || 'Post image'}
                                className="w-full h-64 object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Post Actions */}
            <div className="px-6 py-4">
                {/* Like/Comment/Share counts */}
                {(post.likesCount > 0 || post.commentsCount > 0 || post.sharesCount > 0) && (
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3 pb-3 border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                            {post.likesCount > 0 && (
                                <span>{post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}</span>
                            )}
                            {post.commentsCount > 0 && (
                                <span>{post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}</span>
                            )}
                        </div>
                        {post.sharesCount > 0 && (
                            <span>{post.sharesCount} {post.sharesCount === 1 ? 'share' : 'shares'}</span>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={() => onLike(post._id)}
                            className={`flex items-center space-x-1 ${post.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                                }`}
                        >
                            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm">Like</span>
                        </button>

                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">Comment</span>
                        </button>

                        <button className="flex items-center space-x-1 text-gray-600 hover:text-green-600">
                            <Share className="w-5 h-5" />
                            <span className="text-sm">Share</span>
                        </button>
                    </div>
                </div>

                {/* Comments Section */}
                {showComments && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        {/* Existing Comments */}
                        {post.comments && post.comments.length > 0 && (
                            <div className="space-y-3 mb-4">
                                {post.comments.map((comment) => (
                                    <div key={comment._id} className="flex space-x-3">
                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {comment.user?.profilePicture ? (
                                                <img
                                                    src={comment.user.profilePicture}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-white text-xs font-medium">
                                                    {comment.user?.firstName?.[0]?.toUpperCase() || 'U'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-gray-100 rounded-lg px-3 py-2">
                                                <p className="font-medium text-sm text-gray-900 flex items-center">
                                                    {`${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`}
                                                    {isPremiumUser(comment.user) && (
                                                        <Crown className="w-3 h-3 text-yellow-500 ml-1" title="Premium Member" />
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-700">{comment.content}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatTime(comment.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Comment Form */}
                        <form onSubmit={handleCommentSubmit} className="flex space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {currentUser?.profilePicture ? (
                                    <img
                                        src={currentUser.profilePicture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white text-xs font-medium">
                                        {currentUser?.firstName?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostsFeed;