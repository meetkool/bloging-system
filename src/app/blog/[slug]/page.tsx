import { allPosts } from 'contentlayer/generated';
import { format, parseISO } from 'date-fns';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Metadata } from 'next';
import { Article, Graph, WithContext } from 'schema-dts';
import MDXContent from '@/components/mdx-content';

interface IProps {
  params: Promise<{ slug: string }>;
}

export const generateStaticParams = async () =>
  allPosts.map((post) => ({ slug: post._raw.flattenedPath }));

export async function generateMetadata({ params }: IProps): Promise<Metadata> {
  const { slug } = await params;
  const post = allPosts.find((post) => post._raw.flattenedPath === slug);

  if (!post) {
    return {};
  }

  const { excerpt, title, date } = post;

  const description = excerpt;

  const ogImage = {
    url: `${process.env.HOST}/blog/${slug}/og.png`,
  };

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      url: `${process.env.HOST}/blog/${slug}`,
      title,
      description,
      publishedTime: date,
      images: [ogImage],
    },
    twitter: {
      title,
      description,
      images: ogImage,
      card: 'summary_large_image',
    },
  };
}

export default async function Page({ params }: IProps) {
  const { slug } = await params;
  const post = allPosts.find((post) => post._raw.flattenedPath === slug);

  if (!post) notFound();

  const structuredData: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    url: `${process.env.HOST}/blog/${slug}/`,
    image: {
      '@type': 'ImageObject',
      url: `${process.env.HOST}${(post.cover || '/next.svg').trim()}/`,
    },
    description: post.excerpt,
    datePublished: post.date,
    publisher: {
      '@type': 'Person',
      name: 'My Blog',
      url: process.env.HOST,
      image: '/avatar.png',
    },
    author: {
      '@type': 'Person',
      name: 'My Blog',
      url: process.env.HOST,
      image: '/avatar.png',
    },
  };
  
  const jsonLd: Graph = {
    '@context': 'https://schema.org',
    '@graph': [structuredData],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8"
        >
          ← Back to Blog
        </Link>
        
        <article className="prose prose-lg dark:prose-invert max-w-none blog-bg rounded-lg p-8 shadow-md">
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <time
                dateTime={post?.date}
                className="uppercase font-bold text-blue-600 text-sm"
              >
                {format(parseISO(post?.date), 'MMM dd, yyyy')}
              </time>
              <span className="text-sm text-gray-500">
                {post.readTime} min read
              </span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
              {post.excerpt}
            </p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-8">
              <Image
                src={(post.cover || '/next.svg').trim()}
                width={800}
                height={400}
                priority={true}
                alt={post.title}
                className="object-cover w-full h-full"
              />
            </div>
          </header>
          
          <div className="prose-content">
            <MDXContent code={post.body.code} />
          </div>
        </article>
      </div>
    </>
  );
}
