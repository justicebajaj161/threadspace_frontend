import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Image, 
  Video, 
  Smile, 
  MapPin, 
  Users, 
  Globe, 
  Lock,
  ChevronDown,
  Calendar,
  Hash,
  AtSign,
  Upload,
  Trash2,
  Plus,
  Loader2,
  Navigation,
  AlertCircle,
  Check
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import apiService from '../services/api';

const AddNewPost = ({ isOpen, onClose, onPostCreated }) => {
  const [postData, setPostData] = useState({
    content: '',
    privacy: 'public',
    images: [],
    location: '',
    feeling: '',
    tags: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const tagInputRef = useRef(null);
  
  const { user, isAuthenticated } = useAuthStore();

  // Privacy options
  const privacyOptions = [
    { 
      value: 'public', 
      label: 'Public', 
      icon: Globe, 
      description: 'Anyone can see this post' 
    },
    { 
      value: 'friends', 
      label: 'Friends', 
      icon: Users, 
      description: 'Only friends can see this post' 
    },
    { 
      value: 'private', 
      label: 'Only me', 
      icon: Lock, 
      description: 'Only you can see this post' 
    }
  ];

  // Expanded emoji categories
  const emojiCategories = {
    smileys: {
      name: 'Smileys & People',
      emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐']
    },
    nature: {
      name: 'Animals & Nature',
      emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔']
    },
    food: {
      name: 'Food & Drink',
      emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯']
    },
    activities: {
      name: 'Activities',
      emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️‍♀️', '🏋️', '🏋️‍♂️', '🤼‍♀️', '🤼', '🤼‍♂️', '🤸‍♀️', '🤸', '🤸‍♂️', '⛹️‍♀️', '⛹️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾', '🤾‍♂️', '🏌️‍♀️', '🏌️', '🏌️‍♂️', '🧘‍♀️', '🧘', '🧘‍♂️', '🏄‍♀️', '🏄', '🏄‍♂️', '🏊‍♀️', '🏊', '🏊‍♂️', '🤽‍♀️', '🤽', '🤽‍♂️', '🚣‍♀️', '🚣', '🚣‍♂️', '🧗‍♀️', '🧗', '🧗‍♂️', '🚵‍♀️', '🚵', '🚵‍♂️', '🚴‍♀️', '🚴', '🚴‍♂️', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹‍♀️', '🤹', '🤹‍♂️', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🪘', '🥁', '🪗', '🎷', '🎺', '🪕', '🎸', '🪈', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩']
    },
    objects: {
      name: 'Objects',
      emojis: ['⌚', '📱', '📲', '💻', '⌨', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖', '🪜', '🧰', '🔧', '🔨', '⚒', '🛠', '⛏', '🪚', '🔩', '⚙', '🪤', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔', '🛡', '🚬', '⚰', '🪦', '⚱', '🏺', '🔮', '📿', '🧿', '💈', '⚗', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🪠', '🧽', '🧴', '🛎', '🔑', '🗝', '🚪', '🪑', '🛋', '🛏', '🛌', '🧸', '🪆', '🖼', '🪞', '🪟', '🛍', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🪅', '🎊', '🎉', '🪩', '🎎', '🏮', '🎐', '🧧', '✉', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷', '🪧', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒', '🗓', '📆', '📅', '🗑', '📇', '🗃', '🗳', '🗄', '📋', '📁', '📂', '🗂', '🗞', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇', '📐', '📏', '🧮', '📌', '📍', '✂', '🖊', '🖋', '✒', '🖌', '🖍', '📝', '✏', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓']
    }
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  // Focus tag input when shown
  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagInput]);

  const handleContentChange = (e) => {
    setPostData(prev => ({ ...prev, content: e.target.value }));
    adjustTextareaHeight();
    
    // Clear content error
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }));
    }
  };

  const handleImageUpload = (files) => {
    const newImages = Array.from(files).filter(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, images: 'Please select only image files' }));
        return false;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, images: 'Images must be smaller than 5MB' }));
        return false;
      }
      
      return true;
    });

    if (newImages.length > 0) {
      // Create preview URLs
      const imagePromises = newImages.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              file,
              preview: e.target.result,
              id: Math.random().toString(36).substr(2, 9)
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(imagePromises).then(images => {
        setPostData(prev => ({
          ...prev,
          images: [...prev.images, ...images].slice(0, 4) // Max 4 images
        }));
        setErrors(prev => ({ ...prev, images: '' }));
      });
    }
  };

  const removeImage = (imageId) => {
    setPostData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  const addEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = postData.content;
    
    const newContent = content.substring(0, start) + emoji + content.substring(end);
    setPostData(prev => ({ ...prev, content: newContent }));
    
    // Set cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
      adjustTextareaHeight();
    }, 0);
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors(prev => ({ ...prev, location: 'Geolocation is not supported by this browser' }));
      return;
    }

    setGettingLocation(true);
    setErrors(prev => ({ ...prev, location: '' }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get address (you can use any geocoding service)
          // For demo purposes, I'll use a simple format
          const locationString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          // You can replace this with actual reverse geocoding
          setPostData(prev => ({ ...prev, location: locationString }));
          setShowLocationPicker(false);
        } catch (error) {
          setErrors(prev => ({ ...prev, location: 'Failed to get location details' }));
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setErrors(prev => ({ ...prev, location: errorMessage }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Handle tag input
  const handleTagInput = (e) => {
    const value = e.target.value;
    setTagInput(value);

    // Add tag on Enter or comma
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(value.trim());
    }
  };

  const addTag = (tag) => {
    if (!tag || postData.tags.length >= 10) return;
    
    // Clean tag (remove special characters, limit length)
    const cleanTag = tag.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 30);
    
    if (cleanTag && !postData.tags.includes(cleanTag)) {
      setPostData(prev => ({
        ...prev,
        tags: [...prev.tags, cleanTag]
      }));
    }
    
    setTagInput('');
  };

  const removeTag = (tagToRemove) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validatePost = () => {
    const newErrors = {};
    
    if (!postData.content.trim() && postData.images.length === 0) {
      newErrors.content = 'Please add some content or images to your post';
    }
    
    if (postData.content.length > 500) {
      newErrors.content = 'Post content cannot exceed 500 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validatePost();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('content', postData.content);
      formData.append('privacy', postData.privacy);
      formData.append('location', postData.location);
      formData.append('feeling', postData.feeling);
      
      // Add images
      postData.images.forEach((image) => {
        formData.append('images', image.file);
      });
      
      // Add tags
      if (postData.tags.length > 0) {
        formData.append('tags', JSON.stringify(postData.tags));
      }
      
      // Call the API
      const response = await apiService.createPost(formData);
      
      if (response.success) {
        console.log('Post created:', response.data.post);
        
        // Reset form
        setPostData({
          content: '',
          privacy: 'public',
          images: [],
          location: '',
          feeling: '',
          tags: []
        });
        
        // Call success callback
        if (onPostCreated) {
          onPostCreated(response.data.post);
        }
        
        // Close modal
        onClose();
      }
      
    } catch (error) {
      console.error('Failed to create post:', error);
      setErrors({ general: error.message || 'Failed to create post. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPostData({
        content: '',
        privacy: 'public',
        images: [],
        location: '',
        feeling: '',
        tags: []
      });
      setErrors({});
      setShowPrivacyMenu(false);
      setShowEmojiPicker(false);
      setShowLocationPicker(false);
      setShowTagInput(false);
      setTagInput('');
      onClose();
    }
  };

  if (!isOpen || !isAuthenticated) return null;

  const selectedPrivacy = privacyOptions.find(option => option.value === postData.privacy);
  const charCount = postData.content.length;
  const charLimit = 500;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-140px)]">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* User Info */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {user?.fullName || `${user?.firstName} ${user?.lastName}`}
                </p>
                
                {/* Privacy Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <selectedPrivacy.icon className="w-3 h-3" />
                    <span>{selectedPrivacy.label}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {showPrivacyMenu && (
                    <div className="absolute top-6 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-48">
                      {privacyOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setPostData(prev => ({ ...prev, privacy: option.value }));
                            setShowPrivacyMenu(false);
                          }}
                          className="flex items-start space-x-3 w-full p-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <option.icon className="w-4 h-4 mt-0.5 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{option.label}</p>
                            <p className="text-xs text-gray-600">{option.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              </div>
            )}

            {/* Content Textarea */}
            <div>
              <textarea
                ref={textareaRef}
                value={postData.content}
                onChange={handleContentChange}
                placeholder="What's on your mind?"
                disabled={isLoading}
                className="w-full min-h-[120px] max-h-[200px] p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 transition-colors"
              />
              
              <div className="flex justify-between items-center mt-2">
                <div>
                  {errors.content && (
                    <p className="text-sm text-red-600">{errors.content}</p>
                  )}
                </div>
                <p className={`text-sm ${charCount > charLimit ? 'text-red-600' : 'text-gray-500'}`}>
                  {charCount}/{charLimit}
                </p>
              </div>
            </div>

            {/* Tags Display */}
            {postData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {postData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag Input */}
            {showTagInput && (
              <div className="border border-gray-300 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInput}
                    onBlur={() => {
                      if (tagInput.trim()) {
                        addTag(tagInput.trim());
                      }
                      setShowTagInput(false);
                    }}
                    placeholder="Add a tag and press Enter"
                    className="flex-1 outline-none text-sm"
                    maxLength={30}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter or comma to add tag. Max 10 tags.
                </p>
              </div>
            )}

            {/* Location Display */}
            {postData.location && (
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">{postData.location}</span>
                <button
                  type="button"
                  onClick={() => setPostData(prev => ({ ...prev, location: '' }))}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Location Error */}
            {errors.location && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <p className="text-sm text-red-600">{errors.location}</p>
              </div>
            </div>
          )}

          {/* Image Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {postData.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {postData.images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt="Upload preview"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {postData.images.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-gray-400" />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Drag photos here or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Up to 4 images, 5MB each
                </p>
              </div>
            )}
            
            {errors.images && (
              <p className="text-sm text-red-600 mt-2">{errors.images}</p>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files)}
            className="hidden"
          />

          {/* Additional Options */}
          <div className="flex items-center justify-between py-2 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {/* Emoji Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPicker(!showEmojiPicker);
                    setShowLocationPicker(false);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                {/* Improved Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 w-80 max-h-64 overflow-hidden">
                    <div className="p-3 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">Choose an emoji</h4>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      {Object.entries(emojiCategories).map(([categoryKey, category]) => (
                        <div key={categoryKey} className="p-2">
                          <h5 className="text-xs font-medium text-gray-600 mb-2">{category.name}</h5>
                          <div className="grid grid-cols-8 gap-1">
                            {category.emojis.slice(0, 16).map((emoji, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => addEmoji(emoji)}
                                className="w-8 h-8 text-lg hover:bg-gray-100 rounded flex items-center justify-center transition-colors"
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationPicker(!showLocationPicker);
                    setShowEmojiPicker(false);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  title="Add location"
                >
                  <MapPin className="w-5 h-5" />
                </button>

                {/* Location Options */}
                {showLocationPicker && (
                  <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 w-64 p-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Add Location</h4>
                    
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                        className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {gettingLocation ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        ) : (
                          <Navigation className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="text-sm">
                          {gettingLocation ? 'Getting location...' : 'Use current location'}
                        </span>
                      </button>
                      
                      <div className="border-t border-gray-200 pt-2">
                        <input
                          type="text"
                          placeholder="Enter location manually"
                          value={postData.location}
                          onChange={(e) => setPostData(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          maxLength={100}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Tag Button */}
              <button
                type="button"
                onClick={() => {
                  setShowTagInput(!showTagInput);
                  setShowEmojiPicker(false);
                  setShowLocationPicker(false);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                title="Add tags"
              >
                <Hash className="w-5 h-5" />
              </button>

              {/* People Tagging (for future implementation) */}
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors opacity-50 cursor-not-allowed"
                title="Tag people (coming soon)"
                disabled
              >
                <AtSign className="w-5 h-5" />
              </button>
            </div>

            {/* Post Stats */}
            <div className="text-xs text-gray-500">
              {postData.images.length > 0 && (
                <span>{postData.images.length} image{postData.images.length !== 1 ? 's' : ''}</span>
              )}
              {postData.tags.length > 0 && (
                <span className="ml-2">{postData.tags.length} tag{postData.tags.length !== 1 ? 's' : ''}</span>
              )}
              {postData.location && (
                <span className="ml-2">📍 Location added</span>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || (!postData.content.trim() && postData.images.length === 0)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Posting...</span>
            </>
          ) : (
            <span>Post</span>
          )}
        </button>
      </div>
    </div>

    {/* Click outside handlers */}
    {(showPrivacyMenu || showEmojiPicker || showLocationPicker) && (
      <div 
        className="fixed inset-0 z-10"
        onClick={() => {
          setShowPrivacyMenu(false);
          setShowEmojiPicker(false);
          setShowLocationPicker(false);
        }}
      />
    )}
  </div>
);
};

export default AddNewPost;