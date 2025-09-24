'use client';
// you may notice Typescript error here but that's fine, the needed types will be generated after we run dev server
import { allPosts } from 'contentlayer/generated';
import { compareDesc, format, parseISO } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import MDXContent from '@/components/mdx-content';

// Function to get tag color based on tag name
const getTagColor = (tag: string) => {
  const tagColors: Record<string, string> = {
    'CSS': 'bg-orange-500',
    'HTML': 'bg-blue-500', 
    'JavaScript': 'bg-yellow-500',
    'React': 'bg-cyan-500',
    'Next.js': 'bg-purple-500',
    'Tutorial': 'bg-green-500',
    'Web Development': 'bg-pink-500',
    'Programming': 'bg-indigo-500',
  };
  return tagColors[tag] || 'bg-gray-500';
};

// Modal Component
function BlogModal({ post, onClose }: { post: any, onClose: () => void }) {
  if (!post) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="modal-close" onClick={onClose}>
            ← Back to Blog
          </button>
          <Link
            href={`/blog/${post._raw.flattenedPath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="open-new-tab-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
              border: 'none'
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in New Tab
          </Link>
        </div>
        
        <article className="modal-article">
          <header className="modal-article-header">
            <div className="modal-article-meta">
              {post.tags && post.tags.length > 0 && (
                <span className={`modal-tag ${getTagColor(post.tags[0])}`}>
                  {post.tags[0]}
                </span>
              )}
              <time className="modal-date">
                {post.date ? format(parseISO(post.date), 'MMMM d') : 'No date'}
              </time>
            </div>
            
            <h1 className="modal-title">{post.title || 'Untitled'}</h1>
          </header>
          
          <div className="modal-content-body">
            <MDXContent code={post.body.code} />
          </div>
        </article>
      </div>
    </div>
  );
}

export default function Blog() {
  const [selectedPost, setSelectedPost] = useState<any>(null);
  
  const sortedPosts = allPosts.sort((a, b) => {
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    return compareDesc(dateA, dateB);
  });

  // Get unique tags for navigation (filter out undefined/null tags)
  const allTags = [...new Set(sortedPosts.flatMap(post => post.tags || []).filter(Boolean))];

  return (
    <div className="portfolio-container">
      {/* Main Content Container */}
      <div className="portfolio-content">
        
        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-image">
            <Image
              src="/next.svg"
              alt="Profile"
              width={200}
              height={200}
              className="profile-img"
            />
          </div>
          <div className="profile-info">
            <h1 className="profile-name">Nardcart Blog</h1>
            <p className="profile-title">Personal thoughts, tutorials, and tech insights</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="nav-section">
          <nav className="portfolio-nav">
            <button className="nav-item active">All Posts</button>
            {allTags.slice(0, 3).map((tag) => (
              <button key={tag} className="nav-item">{tag}</button>
            ))}
            <Link href="/quick-blog" className="nav-item">Quick Blog</Link>
            <button className="nav-item">Search</button>
          </nav>
        </div>

        {/* Blog Posts Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            color: '#ffffff', 
            fontSize: '1.5rem', 
            fontWeight: '600', 
            marginBottom: '1.5rem',
            borderBottom: '2px solid #4f46e5',
            paddingBottom: '0.5rem',
            display: 'inline-block'
          }}>
            Latest Blog Posts
          </h2>
        </div>

        {/* Blog Posts Grid */}
        <div className="posts-grid">
          {sortedPosts.map((post) => (
            <button 
              key={post._id} 
              className="post-card"
              onClick={() => setSelectedPost(post)}
            >
              <div className="post-tag-section">
                {post.tags && post.tags.length > 0 && (
                  <span className={`post-tag ${getTagColor(post.tags[0])}`}>
                    {post.tags[0]}
                  </span>
                )}
                <time className="post-date">
                  {post.date ? format(parseISO(post.date), 'MMM d') : 'No date'}
                </time>
              </div>
              <h3 className="post-title" style={{ fontSize: '1.2rem', lineHeight: '1.4' }}>
                {post.title || 'Untitled'}
              </h3>
              <p className="post-read-time">{post.readTime ? `${post.readTime} min read` : 'Quick read'}</p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Blog Modal */}
      {selectedPost && (
        <BlogModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}
    </div>
  );
}
