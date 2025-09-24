'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { githubAPI, BlogPost } from '@/lib/github-api';
import { notFound } from 'next/navigation';
import '@/styles/blog-editor.css';

interface PageProps {
  params: {
    id: string;
  };
}

export default function QuickBlogPost({ params }: PageProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First get all blog posts
        const allPosts = await githubAPI.getBlogPosts();
        
        // Find the specific post by ID
        const foundPost = allPosts.find(p => p.id === params.id);
        
        if (!foundPost) {
          setError('Post not found');
          return;
        }
        
        setPost(foundPost);
      } catch (err) {
        console.error('Error loading post:', err);
        setError('Failed to load post. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadPost();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="portfolio-container">
        <div className="portfolio-content">
          {/* Header Navigation */}
          <div className="nav-section">
            <nav className="portfolio-nav">
              <Link href="/quick-blog" className="nav-item active">
                ← Back to Quick Blog
              </Link>
              <span className="nav-item">Loading...</span>
            </nav>
          </div>

          {/* Loading Content */}
          <div id="b_feed">
            <div className="b_post">
              <div className="animate-pulse">
                <div className="b_header">
                  <div className="w-10 h-10 bg-gray-200 rounded-full b_profile"></div>
                  <div className="b_desc">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
                <div className="b_text">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="portfolio-container">
        <div className="portfolio-content">
          {/* Header Navigation */}
          <div className="nav-section">
            <nav className="portfolio-nav">
              <Link href="/quick-blog" className="nav-item active">
                ← Back to Quick Blog
              </Link>
              <span className="nav-item">Error</span>
            </nav>
          </div>

          {/* Error Content */}
          <div id="b_feed">
            <div className="b_post" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="text-red-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.856-.833-2.598 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="b_text">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 1rem 0', color: 'var(--primary-text)' }}>
                  {error || 'Post not found'}
                </h3>
                <p style={{ color: 'var(--secondary-text)', marginBottom: '1.5rem' }}>
                  The post you're looking for doesn't exist or couldn't be loaded.
                </p>
                <Link 
                  href="/quick-blog"
                  className="button button-primary"
                >
                  Back to Quick Blog
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-container">
      <div className="portfolio-content">
        {/* Header Navigation */}
        <div className="nav-section">
          <nav className="portfolio-nav">
            <Link href="/quick-blog" className="nav-item active">
              ← Back to Quick Blog
            </Link>
            <Link href="/" className="nav-item">All Posts</Link>
          </nav>
        </div>

        {/* Individual Post */}
        <div id="b_feed">
          <div className="b_post">
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
                  <span className="b_date">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
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
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 16px 0', color: 'var(--primary-text)' }}>
                  {post.title}
                </h2>
              </div>
            )}

            {/* Post Content */}
            <div className="b_text">
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

            {/* Post Actions */}
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
        </div>
      </div>
    </div>
  );
}
