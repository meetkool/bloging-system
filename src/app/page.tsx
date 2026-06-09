'use client';

import { allPosts, type Post } from 'contentlayer/generated';
import { compareDesc, format, parseISO } from 'date-fns';
import Link from 'next/link';
import type React from 'react';
import { useMemo, useState } from 'react';

type GridProps = {
  columns: number;
  rows: number;
  id?: string;
  className?: string;
  children: React.ReactNode;
};

type GridCellProps = {
  column: string | number;
  row: string | number;
  columnSpan?: number;
  rowSpan?: number;
  className?: string;
  children: React.ReactNode;
};

type GridCrossProps = {
  column: number;
  row: number;
};

function Grid({ columns, rows, id, className = '', children }: GridProps) {
  return (
    <div
      id={id}
      className={`grid-system ${className}`}
      style={
        {
          '--grid-columns': columns,
          '--grid-rows': rows,
        } as React.CSSProperties
      }
    >
      <div className="grid-guides" aria-hidden>
        {Array.from({ length: columns * rows }, (_, index) => {
          const x = (index % columns) + 1;
          const y = Math.floor(index / columns) + 1;

          return (
            <span
              key={`${x}-${y}`}
              className="grid-guide"
              style={
                {
                  '--grid-x': x,
                  '--grid-y': y,
                } as React.CSSProperties
              }
            />
          );
        })}
      </div>
      {children}
    </div>
  );
}

function GridCell({
  column,
  row,
  columnSpan = 1,
  rowSpan = 1,
  className = '',
  children,
}: GridCellProps) {
  return (
    <div
      className={`grid-cell ${className}`}
      style={{
        gridColumn: `${column} / span ${columnSpan}`,
        gridRow: `${row} / span ${rowSpan}`,
      }}
    >
      {children}
    </div>
  );
}

function GridCross({ column, row }: GridCrossProps) {
  return (
    <span
      className="grid-cross"
      aria-hidden
      style={
        {
          '--cross-column': column,
          '--cross-row': row,
        } as React.CSSProperties
      }
    />
  );
}

const normalize = (value: string) => value.trim().toLowerCase();

const formatTag = (tag: string) =>
  tag
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const postDate = (post: Post) => {
  if (!post.date) return 'No date';
  return format(parseISO(post.date), 'MMM d, yyyy');
};

const postExcerpt = (post: Post) =>
  post.excerpt?.trim() ||
  'A short technical note with implementation details, tradeoffs, and lessons learned.';

export default function Blog() {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('all');

  const sortedPosts = useMemo(
    () =>
      [...allPosts].sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return compareDesc(dateA, dateB);
      }),
    [],
  );

  const tags = useMemo(() => {
    const uniqueTags = new Map<string, string>();

    sortedPosts.forEach((post) => {
      post.tags?.forEach((tag) => {
        const trimmedTag = tag.trim();
        if (trimmedTag) uniqueTags.set(normalize(trimmedTag), formatTag(trimmedTag));
      });
    });

    return [...uniqueTags.entries()].sort(([, a], [, b]) => a.localeCompare(b));
  }, [sortedPosts]);

  const featuredPost = sortedPosts[0];
  const lowerQuery = normalize(query);

  const filteredPosts = sortedPosts.filter((post) => {
    const matchesTag =
      activeTag === 'all' || post.tags?.some((tag) => normalize(tag) === activeTag);
    const searchableText = [
      post.title,
      post.excerpt,
      ...(post.tags || []),
    ]
      .join(' ')
      .toLowerCase();

    return matchesTag && searchableText.includes(lowerQuery);
  });

  return (
    <main className="dev-blog-shell">
      <Grid columns={3} rows={5} className="home-grid hero-system">
        <GridCross column={1} row={1} />
        <GridCross column={4} row={1} />
        <GridCross column={1} row={6} />
        <GridCross column={4} row={6} />

        <GridCell column={1} row={1} columnSpan={3} className="nav-cell">
          <nav className="dev-blog-nav" aria-label="Main navigation">
            <Link href="/" className="dev-blog-brand" aria-label="Nardcart Blog home">
              <span className="dev-blog-brand-mark">N</span>
              <span>Nardcart Blog</span>
            </Link>
            <div className="dev-blog-nav-links">
              <Link href="/quick-blog">Quick Blog</Link>
              <a href="#posts">Posts</a>
            </div>
          </nav>
        </GridCell>

        <GridCell column={1} row={2} columnSpan={2} rowSpan={4} className="hero-copy-cell">
          <div className="dev-blog-intro">
            <p className="dev-blog-kicker">Developer notes, tutorials, and build logs</p>
            <h1>Readable notes from shipping software.</h1>
            <p>
              A focused place for web development, competitive programming, systems notes,
              and small lessons from real projects.
            </p>
            <div className="dev-blog-stats" aria-label="Blog statistics">
              <span>{sortedPosts.length} posts</span>
              <span>{tags.length} topics</span>
              <span>MDX powered</span>
            </div>
          </div>
        </GridCell>

        <GridCell column={3} row={3} rowSpan={3} className="terminal-cell">
          <aside className="dev-blog-terminal" aria-label="Developer workspace preview">
            <div className="terminal-topbar">
              <span />
              <span />
              <span />
            </div>
            <div className="terminal-body">
              <p><span>$</span> npm run notes</p>
              <p>collecting posts...</p>
              <p>latest: {featuredPost?.title || 'Untitled'}</p>
              <p>status: ready to read</p>
            </div>
          </aside>
        </GridCell>
      </Grid>

      <Grid columns={3} rows={4} className="home-grid content-system" id="posts">
        <GridCross column={1} row={1} />
        <GridCross column={4} row={1} />
        <GridCross column={1} row={5} />
        <GridCross column={4} row={5} />

        {featuredPost && (
          <GridCell column={1} row={1} columnSpan={3} className="featured-cell">
            <Link href={featuredPost.url} className="featured-post">
              <div>
                <p className="section-label">Latest post</p>
                <h2>{featuredPost.title}</h2>
                <p>{postExcerpt(featuredPost)}</p>
              </div>
              <div className="featured-meta">
                <time>{postDate(featuredPost)}</time>
                <span>{featuredPost.readTime} min read</span>
              </div>
            </Link>
          </GridCell>
        )}

        <GridCell column={1} row={2} className="search-cell">
          <label className="search-control">
            <span>Search posts</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, tag, or topic"
            />
          </label>
        </GridCell>

        <GridCell column={2} row={2} columnSpan={2} className="filter-cell">
          <div className="tag-filter" aria-label="Filter by topic">
            <button
              type="button"
              className={activeTag === 'all' ? 'active' : ''}
              onClick={() => setActiveTag('all')}
            >
              All
            </button>
            {tags.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={activeTag === value ? 'active' : ''}
                onClick={() => setActiveTag(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </GridCell>

        <GridCell column={1} row={3} columnSpan={3} rowSpan={2} className="posts-cell">
          <div className="posts-list">
            {filteredPosts.map((post) => (
              <Link key={post._id} href={post.url} className="dev-post-card">
                <time className="post-row-date">{postDate(post)}</time>
                <div className="post-card-main">
                  <div className="post-card-meta">
                    <span>{post.readTime} min read</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{postExcerpt(post)}</p>
                </div>
                <span className="post-row-arrow" aria-hidden>→</span>
              </Link>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <p className="empty-state">No posts match this search.</p>
          )}
        </GridCell>
      </Grid>
    </main>
  );
}
