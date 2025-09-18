import { allPosts } from 'contentlayer/generated';
import { MetadataRoute } from 'next';

const postsSitemap: MetadataRoute.Sitemap = allPosts.map((post) => ({
  url: `${process.env.HOST || 'https://myblog.com'}/blog/${post._raw.flattenedPath}`,
  lastModified: post.date,
}));

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: process.env.HOST || 'https://myblog.com',
      lastModified: new Date(),
    },
    ...postsSitemap,
  ];
}
