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
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            ← Back to Blog
          </button>
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
            <h1 className="profile-name">My Blog</h1>
            <p className="profile-title">npm run dev && git commit -m "new post"</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="nav-section">
          <nav className="portfolio-nav">
            <button className="nav-item active">All work</button>
            {allTags.slice(0, 3).map((tag) => (
              <button key={tag} className="nav-item">{tag}</button>
            ))}
            <Link href="/quick-blog" className="nav-item">Quick Blog</Link>
            <button className="nav-item">Search</button>
          </nav>
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
              <h3 className="post-title">{post.title || 'Untitled'}</h3>
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
