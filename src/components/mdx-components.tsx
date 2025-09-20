import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
  try {
    const codeElement = React.Children.only(children) as React.ReactElement<any>;
    const className = codeElement?.props?.className;
    if (className && typeof className === 'string') {
      const match = /language-(\w+)/.exec(className);
      const language = match ? match[1] : '';

      if (language) {
        const codeContent = String(codeElement.props?.children || '').replace(/\n$/, '');
        
        // Render syntax highlighted code block
        return (
          <div className="code-block-wrapper">
            <div className="code-block-header">
              <div className="code-block-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="code-block-info">
                <span className="code-block-language">{language}</span>
                <button 
                  className="copy-button"
                  onClick={() => navigator.clipboard.writeText(codeContent)}
                  title="Copy code"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
              </div>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={language}
              PreTag="div"
              showLineNumbers={true}
              lineNumberStyle={{
                minWidth: '3em',
                paddingRight: '1em',
                color: '#6b7280',
                fontSize: '0.85rem',
                textAlign: 'right',
                backgroundColor: 'transparent',
                borderRight: '1px solid #374151',
                marginRight: '1em',
              }}
              customStyle={{
                margin: 0,
                borderRadius: '0 0 12px 12px',
                padding: '1.5rem',
                fontSize: '0.9rem',
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
                backgroundColor: '#1e293b',
                lineHeight: 1.6,
                overflow: 'auto',
                textShadow: 'none',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
              codeTagProps={{
                style: {
                  fontSize: '0.9rem',
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
                }
              }}
            >
              {codeContent}
            </SyntaxHighlighter>
          </div>
        );
      }
    }
  } catch (error) {
    // If React.Children.only fails, fall back to regular pre
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
  return <div style={{ marginBottom: '1.5rem', textAlign: 'justify', color: '#374151' }} {...props} />;
};

/**
 * Custom heading components with better styling
 */
const h1 = (props: React.HTMLProps<HTMLHeadingElement>) => {
  return (
    <h1 
      style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        color: '#111827',
        margin: '2.5rem 0 1rem 0',
        borderBottom: '3px solid #667eea',
        paddingBottom: '0.5rem'
      }}
      {...props} 
    />
  );
};

const h2 = (props: React.HTMLProps<HTMLHeadingElement>) => {
  return (
    <h2 
      style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: '#111827',
        margin: '3rem 0 1rem 0',
        position: 'relative',
        paddingLeft: '1rem'
      }}
      {...props} 
    />
  );
};

const h3 = (props: React.HTMLProps<HTMLHeadingElement>) => {
  return (
    <h3 
      style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#4f46e5',
        margin: '2.5rem 0 1rem 0'
      }}
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
      style={{
        color: '#4f46e5',
        textDecoration: 'underline',
        transition: 'color 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = '#3730a3'}
      onMouseLeave={(e) => e.currentTarget.style.color = '#4f46e5'}
      {...props} 
    />
  );
};

/**
 * Custom list styling
 */
const ul = (props: React.HTMLProps<HTMLUListElement>) => {
  return <ul style={{ margin: '1.5rem 0', paddingLeft: '2rem' }} {...props} />;
};

const ol = (props: React.OlHTMLAttributes<HTMLOListElement>) => {
  return <ol style={{ margin: '1.5rem 0', paddingLeft: '2rem' }} {...props} />;
};

const li = (props: React.HTMLProps<HTMLLIElement>) => {
  return <li style={{ margin: '0.5rem 0', color: '#374151' }} {...props} />;
};

/**
 * Custom blockquote styling
 */
const blockquote = (props: React.HTMLProps<HTMLQuoteElement>) => {
  return (
    <blockquote 
      style={{
        borderLeft: '4px solid #667eea',
        background: 'linear-gradient(135deg, #f8faff, #f0f9ff)',
        padding: '1.5rem 2rem',
        margin: '2rem 0',
        borderRadius: '0 8px 8px 0',
        fontStyle: 'italic',
        color: '#4b5563'
      }}
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
