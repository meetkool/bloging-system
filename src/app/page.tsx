// you may notice Typescript error here but that's fine, the needed types will be generated after we run dev server
import { allPosts } from 'contentlayer/generated';
import { compareDesc, format, parseISO } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

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

export default async function Blog() {
  const sortedPosts = allPosts.sort((a, b) =>
    compareDesc(new Date(a.date), new Date(b.date)),
  );

  // Get unique tags for navigation
  const allTags = [...new Set(sortedPosts.flatMap(post => post.tags))];

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
            {allTags.slice(0, 4).map((tag) => (
              <button key={tag} className="nav-item">{tag}</button>
            ))}
            <button className="nav-item">Search</button>
          </nav>
        </div>

        {/* Blog Posts Grid */}
        <div className="posts-grid">
          {sortedPosts.map((post) => (
            <Link key={post._id} href={post.url} className="post-card">
              <div className="post-tag-section">
                {post.tags[0] && (
                  <span className={`post-tag ${getTagColor(post.tags[0])}`}>
                    {post.tags[0]}
                  </span>
                )}
                <time className="post-date">
                  {format(parseISO(post.date), 'MMM d')}
                </time>
              </div>
              <h3 className="post-title">{post.title}</h3>
              <p className="post-read-time">{post.readTime} min read</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
