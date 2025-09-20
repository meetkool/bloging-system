import { allPosts } from 'contentlayer/generated';
import { format, parseISO } from 'date-fns';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
// Removed MDXContent import to fix hydration issues

// Function to get tag color based on tag name
const getTagColor = (tag: string) => {
  const tagColors: Record<string, string> = {
    'CSS': 'css-tag',
    'HTML': 'html-tag', 
    'JavaScript': 'js-tag',
    'React': 'react-tag',
    'Next.js': 'nextjs-tag',
    'Tutorial': 'tutorial-tag',
    'Web Development': 'webdev-tag',
    'Programming': 'programming-tag',
    'javascript': 'js-tag',
    'react': 'react-tag',
    'python': 'python-tag',
    'syntax-highlighting': 'code-tag',
  };
  return tagColors[tag] || 'default-tag';
};

interface IProps {
  params: Promise<{ slug: string }>;
}

// generateStaticParams is required for static export
export const generateStaticParams = () =>
  allPosts.map((post) => ({ slug: post._raw.flattenedPath }));

export async function generateMetadata({ params }: IProps): Promise<Metadata> {
  const { slug } = await params;
  const post = allPosts.find((post) => post._raw.flattenedPath === slug);

  if (!post) {
    return {
      title: '404 - Post not found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function Page({ params }: IProps) {
  const { slug } = await params;
  const post = allPosts.find((post) => post._raw.flattenedPath === slug);

  if (!post) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <article className="prose prose-lg max-w-none">
        {/* Back link */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blog
          </Link>
        </div>

        {/* Post header */}
        <header className="mb-8">
          <div className="mb-4">
            <time className="text-sm text-gray-500">
              {format(parseISO(post.date), 'MMMM dd, yyyy')}
            </time>
          </div>
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>
        
        {/* Post content */}
        <div className="mb-8">
          <div className="prose prose-lg max-w-none">
            {post.body.raw ? (
              <div dangerouslySetInnerHTML={{ __html: post.body.raw }} />
            ) : (
              <p>Content will be rendered here...</p>
            )}
          </div>
        </div>
        
        {/* Simple share section */}
        <footer className="border-t pt-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Share this article</p>
            <div className="flex justify-center space-x-4">
              <a 
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 transition-colors"
              >
                Twitter
              </a>
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </footer>
      </article>
    </div>
  );
}