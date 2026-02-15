import { NextRequest, NextResponse } from 'next/server';
import config from '../../../../config.js';

// Get GitHub token from server-side config
function getGitHubToken(): string | null {
  return config.github.personalAccessToken || null;
}

// Admin authentication check
function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_API_TOKEN;

  // If no admin token configured, allow all requests (dev mode)
  if (!adminToken) {
    return true;
  }

  // Check Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return token === adminToken;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication for non-public actions
    const body = await request.json();
    const token = getGitHubToken();

    // Check if GitHub token is configured
    if (!token) {
      return NextResponse.json({
        error: 'GitHub token not configured. Please set GITHUB_PERSONAL_ACCESS_TOKEN in environment variables.'
      }, { status: 500 });
    }

    // Endpoint to get gists/posts (Public access allowed)
    if (body.action === 'getPosts') {
      const response = await fetch('https://api.github.com/gists', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch gists', status: response.status }, { status: response.status });
      }

      const gists = await response.json();

      // Filter for blog gists
      const blogGists = gists.filter((gist: any) =>
        gist.description &&
        (gist.description.startsWith('[BLOG]') || gist.description.includes('#blog'))
      );

      // Enrich gists with full content if missing or truncated
      const enrichedGists = await Promise.all(blogGists.map(async (gist: any) => {
        // Find the first markdown file or just the first file
        const filename = Object.keys(gist.files).find(f => f.endsWith('.md')) || Object.keys(gist.files)[0];
        if (!filename) return gist;

        const file = gist.files[filename];

        // If content is missing or truncated, fetch it from raw_url
        if ((file.truncated || !file.content) && file.raw_url) {
          try {
            const contentResponse = await fetch(file.raw_url);
            if (contentResponse.ok) {
              file.content = await contentResponse.text();
            }
          } catch (error) {
            console.error(`Failed to fetch raw content for gist ${gist.id}:`, error);
          }
        }

        return gist;
      }));

      // Filter gists based on privacy settings and authentication
      const isUserAuthenticated = isAuthenticated(request);

      const filteredGists = enrichedGists.filter((gist: any) => {
        // If user is authenticated (admin), show all posts
        if (isUserAuthenticated) return true;

        // Check gist native privacy field (public: false means private)
        if (gist.public === false) {
          return false;
        }

        // For unauthenticated users, check privacy setting in frontmatter
        const filename = Object.keys(gist.files).find(f => f.endsWith('.md')) || Object.keys(gist.files)[0];
        if (!filename) return false;

        const content = gist.files[filename].content || '';
        const privacyMatch = content.match(/privacy:\s*(["']?)(public|private)\1/);

        // precise match for "private"
        if (privacyMatch && privacyMatch[2] === 'private') {
          return false;
        }

        // Also check legacy/alternative privacy field if exists
        // (Default to public if not specified)
        return true;
      });

      return NextResponse.json({ gists: filteredGists });
    }

    // Require authentication for write operations
    if (!isAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Endpoint to create a new blog post
    if (body.action === 'createPost') {
      const { title, content, description, privacy = 'public', tags, images } = body;

      if (!title || !content) {
        return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
      }

      // Build frontmatter
      const frontmatter = `---
title: "${title}"
date: "${new Date().toISOString().split('T')[0]}"
excerpt: "${description || title}"
tags: ${JSON.stringify(tags || [])}
${images ? `images: ${JSON.stringify(images)}` : ''}
privacy: "${privacy}"
---

`;

      const filename = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;

      const gistData = {
        description: `[BLOG] ${title} ${description || ''}`,
        public: privacy !== 'private',
        files: {
          [filename]: {
            content: frontmatter + content,
          },
        },
      };

      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gistData),
      });

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json({ error: error.message || 'Failed to create post' }, { status: response.status });
      }

      const gist = await response.json();
      return NextResponse.json({ success: true, gist });
    }

    // Endpoint to update a post
    if (body.action === 'updatePost') {
      const { gistId, title, content, description, privacy, tags, images } = body;

      if (!gistId) {
        return NextResponse.json({ error: 'Gist ID required' }, { status: 400 });
      }

      // First get the current gist
      const getResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!getResponse.ok) {
        return NextResponse.json({ error: 'Gist not found' }, { status: 404 });
      }

      const currentGist = await getResponse.json();
      const filename = Object.keys(currentGist.files)[0];
      const currentContent = currentGist.files[filename].content;

      // Build updated content
      let newContent = content || currentContent;
      if (title || description || tags || images || privacy) {
        // Extract existing frontmatter or create new if missing
        const existingFrontmatterMatch = currentContent.match(/^---[\s\S]*?---\n/);
        const frontmatterObj: Record<string, unknown> = {};

        if (existingFrontmatterMatch) {
          // Parse existing frontmatter lines (very basic YAML support)
          const fmText = existingFrontmatterMatch[0].replace(/---\n/g, '').trim();
          fmText.split('\n').forEach((line: string) => {
            const parts = line.split(':');
            if (parts.length >= 2) {
              const key = parts[0].trim();
              const val = parts.slice(1).join(':').trim().replace(/['"]/g, '');
              try {
                // Try to parse basic JSON arrays/objects if possible, otherwise string
                if (val.startsWith('[') || val.startsWith('{')) {
                  frontmatterObj[key] = JSON.parse(val);
                } else {
                  frontmatterObj[key] = val;
                }
              } catch (e) {
                frontmatterObj[key] = val;
              }
            }
          });
        }

        // Update frontmatter values
        if (title) frontmatterObj.title = title;
        if (description) frontmatterObj.excerpt = description;
        if (tags) frontmatterObj.tags = tags;
        if (images) frontmatterObj.images = images;
        if (privacy) frontmatterObj.privacy = privacy;

        // Rebuild frontmatter string
        const newFrontmatter = `---
title: "${frontmatterObj.title || title || currentGist.description.replace('[BLOG]', '').trim()}"
date: "${frontmatterObj.date || new Date().toISOString().split('T')[0]}"
excerpt: "${frontmatterObj.excerpt || description || ''}"
tags: ${JSON.stringify(frontmatterObj.tags || tags || [])}
${frontmatterObj.images ? `images: ${JSON.stringify(frontmatterObj.images)}` : (images ? `images: ${JSON.stringify(images)}` : '')}
privacy: "${frontmatterObj.privacy || privacy || 'public'}"
---

`;
        newContent = newFrontmatter + (content || currentContent.replace(/^---[\s\S]*?---\n/, ''));
      }

      const gistData = {
        description: `[BLOG] ${title || currentGist.description}`,
        public: privacy !== 'private',
        files: {
          [filename]: {
            content: newContent,
          },
        },
      };

      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gistData),
      });

      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json({ error: error.message || 'Failed to update post' }, { status: response.status });
      }

      const gist = await response.json();
      return NextResponse.json({ success: true, gist });
    }

    // Endpoint to delete a post
    if (body.action === 'deletePost') {
      const { gistId } = body;

      if (!gistId) {
        return NextResponse.json({ error: 'Gist ID required' }, { status: 400 });
      }

      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to delete post' }, { status: response.status });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('Blog API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
