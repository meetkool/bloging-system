import { allPosts } from 'contentlayer/generated';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface IProps {
  params: Promise<{ slug: string }>;
}

type GridProps = {
  columns: number;
  rows: number;
  className?: string;
  children: ReactNode;
};

type GridCellProps = {
  column: string | number;
  row: string | number;
  columnSpan?: number;
  rowSpan?: number;
  className?: string;
  children: ReactNode;
};

type GridCrossProps = {
  column: number;
  row: number;
};

function Grid({ columns, rows, className = '', children }: GridProps) {
  return (
    <div
      className={`grid-system ${className}`}
      style={
        {
          '--grid-columns': columns,
          '--grid-rows': rows,
        } as CSSProperties
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
                } as CSSProperties
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
        } as CSSProperties
      }
    />
  );
}

const formatTag = (tag: string) =>
  tag
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

// generateStaticParams is required for static export
export const generateStaticParams = async () =>
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
    title: `${post.title} | Nardcart Blog`,
    description: post.excerpt,
  };
}

export default async function Page({ params }: IProps) {
  const { slug } = await params;
  const post = allPosts.find((post) => post._raw.flattenedPath === slug);

  if (!post) notFound();

  return (
    <main className="article-page-shell">
      <Grid columns={3} rows={7} className="article-grid">
        <GridCross column={1} row={1} />
        <GridCross column={4} row={1} />
        <GridCross column={1} row={8} />
        <GridCross column={4} row={8} />

        <GridCell column={1} row={1} columnSpan={3} className="article-nav-cell">
          <nav className="article-nav" aria-label="Article navigation">
            <Link href="/" className="dev-blog-brand" aria-label="Nardcart Blog home">
              <span className="dev-blog-brand-mark">N</span>
              <span>Nardcart Blog</span>
            </Link>
            <div className="dev-blog-nav-links">
              <Link href="/">All Posts</Link>
              <Link href="/quick-blog">Quick Blog</Link>
            </div>
          </nav>
        </GridCell>

        <GridCell column={2} row={2} columnSpan={2} rowSpan={2} className="article-title-cell">
          <header className="article-header">
            <p className="article-date">{format(parseISO(post.date), 'MMM d, yyyy')}</p>
            <h1>{post.title}</h1>
            {post.excerpt && <p>{post.excerpt}</p>}
          </header>
        </GridCell>

        <GridCell column={1} row={2} rowSpan={2} className="article-meta-cell">
          <aside className="article-meta-panel" aria-label="Article details">
            <dl>
              <div>
                <dt>Reading time</dt>
                <dd>{post.readTime} min</dd>
              </div>
              <div>
                <dt>Topic</dt>
                <dd>{post.tags?.[0] ? formatTag(post.tags[0]) : 'Notes'}</dd>
              </div>
            </dl>
          </aside>
        </GridCell>

        <GridCell column={2} row={4} columnSpan={2} className="article-tags-cell">
          <div className="article-tags" aria-label="Article tags">
            {post.tags?.map((tag) => <span key={tag}>{formatTag(tag)}</span>)}
          </div>
        </GridCell>

        <GridCell column={2} row={5} columnSpan={2} rowSpan={2} className="article-body-cell">
          <article className="article-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.body.raw}
            </ReactMarkdown>
          </article>
        </GridCell>

        <GridCell column={1} row={4} rowSpan={3} className="article-side-cell">
          <aside className="article-side-panel" aria-label="Article actions">
            <Link href="/" className="article-action-link">Back to all posts</Link>
            <Link href="/quick-blog" className="article-action-link">Write a quick blog</Link>
          </aside>
        </GridCell>
      </Grid>
    </main>
  );
}
