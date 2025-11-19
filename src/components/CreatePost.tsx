import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { createPost } from '../lib/firestore';
import { X, MessageSquare, Megaphone, Heart } from 'lucide-react';

interface CreatePostProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePost({ isOpen, onClose, onPostCreated }: CreatePostProps) {
  const { userData } = useAuth();
  const { isDarkMode } = useTheme();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<'announcement' | 'discussion' | 'prayer-request'>('discussion');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !userData) return;

    setLoading(true);
    try {
      await createPost({
        familyId: userData.familyId!,
        authorId: userData.id,
        authorName: userData.displayName,
        content: content.trim(),
        type: postType
      });
      
      setContent('');
      onPostCreated();
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-4 h-4" />;
      case 'prayer-request':
        return <Heart className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'from-blue-600 to-blue-700';
      case 'prayer-request':
        return 'from-red-600 to-red-700';
      default:
        return 'from-purple-600 to-purple-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`absolute inset-x-4 top-1/2 transform -translate-y-1/2 max-w-2xl mx-auto ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-3xl shadow-2xl`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className={`text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Create New Post
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Post Type Selection */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-3 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Post Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'discussion', label: 'Discussion', icon: MessageSquare },
                { type: 'announcement', label: 'Announcement', icon: Megaphone },
                { type: 'prayer-request', label: 'Prayer Request', icon: Heart }
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPostType(type as any)}
                  className={`flex items-center justify-center space-x-2 p-3 rounded-xl border-2 transition-all ${
                    postType === type
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : isDarkMode
                        ? 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${
                    postType === type ? 'text-purple-600' : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    postType === type ? 'text-purple-600' : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              What's on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                postType === 'prayer-request' 
                  ? 'Share your prayer request with the family...'
                  : postType === 'announcement'
                    ? 'Share an important announcement...'
                    : 'Start a discussion with your family...'
              }
              rows={6}
              className={`w-full px-4 py-3 rounded-xl border resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              required
            />
            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {content.length}/500 characters
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || loading}
              className={`flex items-center space-x-2 px-6 py-2 bg-gradient-to-r ${getPostTypeColor(postType)} text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  {getPostTypeIcon(postType)}
                  <span>Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}