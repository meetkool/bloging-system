import { allPosts } from 'contentlayer/generated';
import { compareDesc, format, parseISO } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  const sortedPosts = allPosts.sort((a, b) =>
    compareDesc(new Date(a.date), new Date(b.date)),
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Sorry, the page you are looking for doesn't exist. Here are some recent blog posts you might find interesting:
          </p>
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Recent Posts
          </h3>
          {sortedPosts.slice(0, 3).map((post) => (
            <article key={post._id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <Link href={post.url} className="block hover:opacity-80 transition-opacity">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Image
                      src={(post.cover || '/next.svg').trim()}
                      alt={post.title}
                      width={120}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <time 
                      dateTime={post.date}
                      className="text-sm text-blue-600 font-medium"
                    >
                      {format(parseISO(post.date), 'MMM dd, yyyy')}
                    </time>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mt-1 mb-2">
                      {post.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {post.excerpt}
                    </p>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
