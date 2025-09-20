'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { githubAPI, authenticateUser, logoutUser, BlogPost, User, AuthCredentials } from '@/lib/github-api';
import MarkdownEditor from '@/components/markdown-editor';

export default function QuickBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  
  // Login form state
  const [showLogin, setShowLogin] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<AuthCredentials>({
    username: '',
    password: '',
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Load user and posts on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Check if user is already authenticated
      if (githubAPI.isAuthenticated()) {
        // Get user info
        const userInfo = await githubAPI.getCurrentUser();
        setUser(userInfo);
      }
      
      // Load blog posts
      await loadPosts();
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const blogPosts = await githubAPI.getBlogPosts();
      setPosts(blogPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setPosts([]);
    }
  };

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

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !newPostTitle.trim()) return;
    
    setIsCreatingPost(true);
    
    try {
      await githubAPI.createBlogPost({
        title: newPostTitle,
        content: newPostContent,
        location: currentLocation,
        tags: ['blog', 'quick-post'],
      });
      
      // Reload posts and clear form
      await loadPosts();
      setNewPostContent('');
      setNewPostTitle('');
      setShowEditor(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsCreatingPost(false);
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
    setPosts([]);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await githubAPI.deleteBlogPost(postId);
      await loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
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
                    What&apos;s on your mind? Write in Markdown...
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      placeholder="Post title..."
                      className="w-full p-2 border rounded-lg mb-3 font-medium text-gray-900 bg-white"
                    />
                  </div>
                </div>
                
                <MarkdownEditor
                  value={newPostContent}
                  onChange={setNewPostContent}
                  placeholder="Write your post in Markdown..."
                  minHeight="200px"
                />
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {currentLocation && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        {currentLocation}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowEditor(false);
                        setNewPostContent('');
                        setNewPostTitle('');
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={isCreatingPost || !newPostContent.trim() || !newPostTitle.trim()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isCreatingPost ? 'Publishing...' : 'Publish Post'}
                    </button>
                  </div>
                </div>
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
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border">
                <div className="p-6">
                  {/* Post Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={post.author.avatar_url}
                        alt={post.author.login}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{post.author.login}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          {post.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                </svg>
                                {post.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {user && user.github_username === post.author.login && (
                      <div className="relative">
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Post Title */}
                  <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>

                  {/* Post Content */}
                  <div className="prose prose-sm max-w-none mb-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {post.content}
                    </ReactMarkdown>
                  </div>

                  {/* Post Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Like
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Comment
                      </button>
                      <a
                        href={`https://gist.github.com/${post.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        View Gist
                      </a>
                    </div>
                    <div className="text-sm text-gray-400">
                      {post.updatedAt !== post.createdAt && (
                        <span>Edited {new Date(post.updatedAt).toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
               {user ? "Create your first post above!" : "Login to start posting!"}
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
