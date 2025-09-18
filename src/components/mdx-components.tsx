import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Custom pre component that handles code blocks with syntax highlighting
 */
const pre = ({ children, ...props }: React.HTMLProps<HTMLPreElement>) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for dark mode
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(darkModeQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    darkModeQuery.addListener(handler);
    return () => darkModeQuery.removeListener(handler);
  }, []);

  // Extract the code element and its props
  const codeElement = React.Children.only(children) as React.ReactElement;
  if (codeElement?.props?.className) {
    const match = /language-(\w+)/.exec(codeElement.props.className || '');
    const language = match ? match[1] : '';

    if (language) {
      // Render syntax highlighted code block
      return (
        <SyntaxHighlighter
          style={isDark ? vscDarkPlus : vs}
          language={language}
          PreTag="div"
          className="rounded-lg text-sm"
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: '2rem',
            paddingRight: '1rem',
            color: isDark ? '#6B7280' : '#9CA3AF',
            fontSize: '0.8rem',
          }}
          customStyle={{
            margin: '1.5rem 0',
            borderRadius: '0.5rem',
            padding: '1rem',
            fontSize: '0.875rem',
            fontFamily: "'Fira Code', 'JetBrains Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace",
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          }}
        >
          {String(codeElement.props.children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }
  }

  // Fallback for regular pre elements
  return <pre {...props}>{children}</pre>;
};

const code = ({ children, className, ...props }: React.HTMLProps<HTMLElement>) => {
  // Only handle inline code now
  return <code className={className} {...props}>{children}</code>;
};

/**
 * Image component that uses figure tag with optional title
 */
const img = ({ src, alt, title }: React.HTMLProps<HTMLImageElement>) => {
  return (
    <figure className="flex h-fit w-fit flex-col" aria-label={alt}>
      <img 
        src={src || ''} 
        alt={alt} 
        className="rounded-lg shadow-md max-w-full h-auto" 
      />
      {title && (
        <figcaption className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
          {title}
        </figcaption>
      )}
    </figure>
  );
};

/**
 * Replace the p elements with div elements, as p elements have restrictions on
 * the types of elements that can be nested inside them.
 */
const p = (props: React.HTMLProps<HTMLParagraphElement>) => {
  return <div className="my-6" {...props} />;
};

/**
 * Custom heading components with better styling
 */
const h1 = (props: React.HTMLProps<HTMLHeadingElement>) => {
  return (
    <h1 
      className="text-4xl font-bold text-gray-900 dark:text-white mb-6 mt-8" 
      {...props} 
    />
  );
};

const h2 = (props: React.HTMLProps<HTMLHeadingElement>) => {
  return (
    <h2 
      className="text-3xl font-bold text-gray-900 dark:text-white mb-4 mt-8" 
      {...props} 
    />
  );
};

const h3 = (props: React.HTMLProps<HTMLHeadingElement>) => {
  return (
    <h3 
      className="text-2xl font-bold text-gray-900 dark:text-white mb-3 mt-6" 
      {...props} 
    />
  );
};

/**
 * Custom link styling
 */
const a = (props: React.HTMLProps<HTMLAnchorElement>) => {
  return (
    <a 
      className="text-blue-600 hover:text-blue-800 underline" 
      {...props} 
    />
  );
};

/**
 * Custom list styling
 */
const ul = (props: React.HTMLProps<HTMLUListElement>) => {
  return <ul className="list-disc list-inside my-4 space-y-2" {...props} />;
};

const ol = (props: React.HTMLProps<HTMLOListElement>) => {
  return <ol className="list-decimal list-inside my-4 space-y-2" {...props} />;
};

const li = (props: React.HTMLProps<HTMLLIElement>) => {
  return <li className="text-gray-700 dark:text-gray-300" {...props} />;
};

/**
 * Custom blockquote styling
 */
const blockquote = (props: React.HTMLProps<HTMLQuoteElement>) => {
  return (
    <blockquote 
      className="border-l-4 border-blue-500 pl-4 my-6 italic text-gray-600 dark:text-gray-400" 
      {...props} 
    />
  );
};

export const MDXComponents = { 
  img, 
  p, 
  h1, 
  h2, 
  h3, 
  a, 
  ul, 
  ol, 
  li, 
  blockquote,
  code,
  pre,
};
