'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { githubAPI, authenticateUser, logoutUser, BlogPost, User, AuthCredentials } from '@/lib/github-api';
import GitHubGistEditor from '@/components/github-gist-editor';
import PostToolsDropdown from '@/components/post-tools-dropdown';
import EditPostModal from '@/components/edit-post-modal';
import DeleteConfirmationModal from '@/components/delete-confirmation-modal';
import { PostData } from '@/types/blog-editor';
import '@/styles/blog-editor.css';

export default function QuickBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostPrivacy, setNewPostPrivacy] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  
  // Read more functionality
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  
  // Login form state
  const [showLogin, setShowLogin] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<AuthCredentials>({
    username: '',
    password: '',
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Notification states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadPosts = useCallback(async () => {
    try {
      const blogPosts = await githubAPI.getBlogPosts();
      setPosts(blogPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      // Check if user is already authenticated
      if (githubAPI.isAuthenticated()) {
        // Get user info
        const userInfo = await githubAPI.getCurrentUser();
        setUser(userInfo);
      }
      
      // Load blog posts (always load, regardless of authentication)
      await loadPosts();
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadPosts]);

  // Load user and posts on component mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        () => {
          setCurrentLocation('Location unavailable');
        }
      );
    }
  }, []);

  const handleCreatePost = async (postData: PostData) => {
    try {
      await githubAPI.createBlogPost({
        title: newPostTitle || 'Untitled Post',
        content: postData.text,
        location: postData.location || currentLocation,
        tags: ['blog', 'quick-post'],
        privacy: newPostPrivacy,
        images: postData.images || [],
      });
      
      // Reload posts and clear form
      await loadPosts();
      setNewPostContent('');
      setNewPostTitle('');
      setNewPostPrivacy('public');
      setShowEditor(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const userData = await authenticateUser(loginCredentials);
      setUser(userData);
      setShowLogin(false);
      setLoginCredentials({ username: '', password: '' });
      
      // Reload posts after login
      await loadPosts();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    // Keep posts visible after logout - don't clear posts array
  };

  // Modal handlers
  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    setShowEditModal(true);
  };

  const handleDeletePost = (post: BlogPost) => {
    setSelectedPost(post);
    setShowDeleteModal(true);
  };

  const handleSavePost = async (updatedPost: BlogPost) => {
    // Update the post in the local state
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      )
    );
    
    setShowEditModal(false);
    setSelectedPost(null);
  };

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const handleConfirmDelete = async (postId: string) => {
    const deletedPost = selectedPost;
    
    // Remove the post from local state
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    
    // Show success message
    showSuccess(`Post "${deletedPost?.title || 'Untitled'}" has been deleted from GitHub and removed from your blog.`);
    
    // Refresh the posts list to ensure consistency
    setTimeout(() => {
      loadPosts();
    }, 1000);
    
    setShowDeleteModal(false);
    setSelectedPost(null);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setSelectedPost(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedPost(null);
  };

  // Read more functionality
  const CONTENT_PREVIEW_LENGTH = 300; // Characters
  
  const shouldShowReadMore = (content: string): boolean => {
    return content.length > CONTENT_PREVIEW_LENGTH;
  };
  
  const getPreviewContent = (content: string): string => {
    if (content.length <= CONTENT_PREVIEW_LENGTH) return content;
    
    // Find a good break point (end of sentence or word)
    const preview = content.substring(0, CONTENT_PREVIEW_LENGTH);
    const lastSentence = preview.lastIndexOf('.');
    const lastSpace = preview.lastIndexOf(' ');
    
    if (lastSentence > CONTENT_PREVIEW_LENGTH * 0.7) {
      return content.substring(0, lastSentence + 1);
    } else if (lastSpace > CONTENT_PREVIEW_LENGTH * 0.7) {
      return content.substring(0, lastSpace);
    }
    
    return preview + '...';
  };
  
  const togglePostExpanded = (postId: string) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Quick Blog</h1>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Logout
                  </button>
                </div>
               ) : (
                 <button
                   onClick={() => setShowLogin(true)}
                   className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                 >
                   Login
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login to Quick Blog</h2>
              <p className="text-gray-600">Enter your credentials</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={loginCredentials.username}
                  onChange={(e) => setLoginCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginCredentials.password}
                  onChange={(e) => setLoginCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter password"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {loginError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowLogin(false);
                    setLoginCredentials({ username: '', password: '' });
                    setLoginError('');
                  }}
                  className="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn || !loginCredentials.username.trim() || !loginCredentials.password.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoggingIn ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Create Post Section - Facebook Style */}
        {user && (
          <div className="bg-white rounded-xl shadow-sm border mb-6">
            {!showEditor ? (
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <button
                    onClick={() => setShowEditor(true)}
                    className="flex-1 text-left p-3 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    What&apos;s on your mind? Use BBCode, paste images, share links...
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3 mb-4">
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="Post title..."
                      className="w-full p-2 border rounded-lg font-medium text-gray-900 bg-white"
                    />
                    
                    {/* Privacy selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Privacy:</span>
                      <select
                        value={newPostPrivacy}
                        onChange={(e) => setNewPostPrivacy(e.target.value as 'public' | 'private')}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="public">🌍 Public - Anyone can see</option>
                        <option value="private">🔒 Private - Only you can see</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <GitHubGistEditor
                  initialValue={newPostContent}
                  onSave={handleCreatePost}
                  onCancel={() => {
                    setShowEditor(false);
                    setNewPostContent('');
                    setNewPostTitle('');
                    setNewPostPrivacy('public');
                    // The GitHubGistEditor component handles resetting uploaded images internally
                  }}
                  placeholder="What's happening? Use BBCode, paste images, share links..."
                  autoFocus={true}
                  config={{
                    enableLinkPreview: true,
                    enableImageUpload: true,
                    enableDragDrop: true,
                    enableClipboardPaste: true,
                    enableBBCode: true,
                    maxFileSize: 100 * 1024 * 1024, // 100MB
                    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div id="b_feed">
            {posts.map((post) => (
              <div key={post.id} className="b_post">
                {/* Post Tools (Edit/Delete) */}
                <PostToolsDropdown
                  post={post}
                  currentUser={user}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                />

                {/* Post Header */}
                <div className="b_header">
                  <Image
                    src={post.author.avatar_url}
                    alt={post.author.login}
                    width={40}
                    height={40}
                    className="b_profile"
                  />
                  <div className="b_desc">
                    <div className="b_name">
                      <a href={`https://github.com/${post.author.login}`} target="_blank" rel="noopener noreferrer">
                        {post.author.login}
                      </a>
                    </div>
                    <div className="b_options">
                      <Link href={`/quick-blog/${post.id}`} className="b_date" target="_blank" rel="noopener noreferrer">
                        {new Date(post.createdAt).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Link>
                      {post.location && (
                        <>
                          <span className="b_with"> — at </span>
                          <span className="b_location">{post.location}</span>
                        </>
                      )}
                      <i className={`${post.privacy === 'private' ? 'private' : 'public'} privacy_icon`} title={post.privacy === 'private' ? 'Private - Only you can see this' : 'Public - Anyone can see this'}>
                        {post.privacy === 'private' ? '🔒' : '🌍'}
                      </i>
                    </div>
                    {post.updatedAt !== post.createdAt && (
                      <div className="b_sharer">
                        <span className="b_options">
                          Edited {new Date(post.updatedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Title */}
                {post.title && post.title !== 'Untitled Post' && (
                  <div className="b_text">
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'var(--primary-text)' }}>
                      {post.title}
                    </h2>
                  </div>
                )}

                {/* Post Content with Read More */}
                <div className="b_text">
                  {shouldShowReadMore(post.content) ? (
                    <>
                      <div className={`b_text_preview ${expandedPosts.has(post.id) ? 'expanded' : 'collapsed'}`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            img: ({ src, alt, title }) => (
                              <div className="b_img">
                                <img 
                                  src={src} 
                                  alt={alt} 
                                  title={title}
                                  style={{
                                    maxWidth: '100%',
                                    height: 'auto',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    margin: '1rem 0'
                                  }}
                                />
                              </div>
                            )
                          }}
                        >
                          {expandedPosts.has(post.id) ? post.content : getPreviewContent(post.content)}
                        </ReactMarkdown>
                        {!expandedPosts.has(post.id) && <div className="b_text_fade" />}
                      </div>
                      <button
                        className={`read_more_btn ${expandedPosts.has(post.id) ? 'expanded' : ''}`}
                        onClick={() => togglePostExpanded(post.id)}
                      >
                        {expandedPosts.has(post.id) ? (
                          <>
                            Show less
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            Read more
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: ({ src, alt, title }) => (
                          <div className="b_img">
                            <img 
                              src={src} 
                              alt={alt} 
                              title={title}
                              style={{
                                maxWidth: '100%',
                                height: 'auto',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                margin: '1rem 0'
                              }}
                            />
                          </div>
                        )
                      }}
                    >
                      {post.content}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Post Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="b_text" style={{ paddingTop: '8px' }}>
                    {post.tags.map((tag, index) => (
                      <span key={tag}>
                        {index > 0 && ' '}
                        <span className="tag">#{tag}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Post Actions - KEEPING YOUR LIKE, COMMENT, VIEW GIST BUTTONS */}
                <div className="b_actions">
                  <div className="b_actions_left">
                    <button className="b_action_btn like">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Like
                    </button>
                    <button className="b_action_btn comment">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Comment
                    </button>
                    <a
                      href={`https://gist.github.com/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="b_action_btn gist"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      View Gist
                    </a>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Feed End Indicator */}
            <div id="eof_feed">
              End of posts
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
             <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts yet</h3>
             <p className="text-gray-600">
               {user ? "Create your first post above!" : "No posts available at the moment. Login to start posting!"}
             </p>
          </div>
        )}
      </div>

      {/* Edit Post Modal */}
      <EditPostModal
        post={selectedPost}
        isVisible={showEditModal}
        onSave={handleSavePost}
        onCancel={handleCancelEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        post={selectedPost}
        isVisible={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
