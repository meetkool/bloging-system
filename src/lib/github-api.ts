// GitHub API integration for Gist-based blog posts

// Import config for default GitHub username
const defaultGitHubUsername = 'meetkool'; // Fallback username

// Get GitHub credentials from environment variables
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN;

export interface GistFile {
  filename: string;
  content: string;
  truncated?: boolean;
  type?: string;
  language?: string;
  raw_url?: string;
  size?: number;
}

export interface GistData {
  id: string;
  description: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  files: { [key: string]: GistFile };
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  comments: number;
  html_url: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  author: {
    login: string;
    avatar_url: string;
  };
  location?: string;
  images?: string[];
  tags?: string[];
  privacy?: 'public' | 'private';
}

// Simple authentication interface
export interface AuthCredentials {
  username: string;
  password: string;
}

export interface User {
  username: string;
  github_username: string;
  avatar_url: string;
  name: string;
}

// Check if admin token is valid
export function isValidAdminToken(token: string): boolean {
  if (!ADMIN_API_TOKEN) {
    console.warn('ADMIN_API_TOKEN not configured in environment');
    return false;
  }
  return token === ADMIN_API_TOKEN;
}

// Get GitHub credentials (for server-side use)
export function getGitHubCredentials() {
  return {
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_CLIENT_SECRET,
  };
}

class GitHubGistAPI {
  private baseURL = 'https://api.github.com';
  private accessToken: string | null = null;
  private githubUsername: string | null = null;

  constructor() {
    // No localStorage - tokens should be handled server-side or via OAuth flow
    // For server-side operations, we rely on environment variables
  }

  // For OAuth flow - set token after GitHub authentication
  setCredentials(token: string, username: string) {
    this.accessToken = token;
    this.githubUsername = username;
    // Note: We don't store in localStorage anymore
    // Tokens should be managed via secure HttpOnly cookies or server-side sessions
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  removeCredentials() {
    this.accessToken = null;
    this.githubUsername = null;
  }

  isAuthenticated(): boolean {
    return !!(this.accessToken && this.githubUsername);
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(this.accessToken && { 'Authorization': `token ${this.accessToken}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Handle different error types
      let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;

      if (response.status === 404) {
        errorMessage = 'Post not found - it may have already been deleted';
      } else if (response.status === 403) {
        errorMessage = 'Access denied - you may not have permission to perform this action';
      } else if (response.status === 401) {
        errorMessage = 'Unauthorized - please log in again';
      }

      throw new Error(errorMessage);
    }

    // Handle empty responses (like DELETE requests)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    }

    return {};
  }

  // Get current user info (using stored username)
  async getCurrentUser(): Promise<User> {
    if (!this.githubUsername) {
      throw new Error('Not authenticated');
    }

    return {
      username: this.githubUsername,
      github_username: this.githubUsername,
      avatar_url: `https://github.com/${this.githubUsername}.png`,
      name: this.githubUsername,
    };
  }

  // Get all gists for the authenticated user
  async getUserGists(username?: string): Promise<GistData[]> {
    const endpoint = username ? `/users/${username}/gists` : '/gists';
    return this.request(endpoint);
  }

  // Get blog posts (gists with specific naming convention)
  async getBlogPosts(): Promise<BlogPost[]> {
    try {
      let gists: GistData[] = [];

      if (this.isAuthenticated()) {
        // User is authenticated - get their own gists
        console.log('Fetching authenticated user gists');
        gists = await this.getUserGists();
      } else {
        // User is NOT authenticated - get public gists from the default user
        console.log(`Fetching public gists from user: ${defaultGitHubUsername}`);
        gists = await this.getUserGists(defaultGitHubUsername);
      }

      console.log(`Found ${gists.length} total gists`);

      // Filter gists that are blog posts (you can customize this logic)
      const blogGists = gists.filter(gist =>
        gist.description &&
        (gist.description.startsWith('[BLOG]') || gist.description.includes('#blog')) &&
        gist.files &&
        Object.keys(gist.files).length > 0
      );

      console.log(`Found ${blogGists.length} blog gists after filtering`);

      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled(
        blogGists.map((gist) => this.transformGistToBlogPost(gist))
      );

      // Filter successful results and log failures
      const successfulPosts: BlogPost[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulPosts.push(result.value);
        } else {
          const gistId = blogGists[index]?.id || 'unknown';
          const gistDescription = blogGists[index]?.description || 'unknown';
          console.warn(`Skipping inaccessible blog post from gist ${gistId} (${gistDescription}):`, result.reason?.message || result.reason);
        }
      });

      // Apply privacy filtering
      const filteredPosts = this.filterPostsByPrivacy(successfulPosts);
      console.log(`Successfully loaded ${filteredPosts.length} out of ${blogGists.length} blog posts (after privacy filtering)`);

      return filteredPosts;
    } catch (error) {
      console.error('Error fetching blog posts directly:', error);

      // Fallback: If running in browser and direct access failed (likely 403 rate limit), try server-side API
      if (typeof window !== 'undefined') {
        try {
          console.log('Attempting fallback to server-side API /api/blogs...');
          const response = await fetch('/api/blogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getPosts' }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.gists && Array.isArray(data.gists)) {
              console.log(`Fallback successful: received ${data.gists.length} gists from server`);

              // Process the gists returned from server
              const results = await Promise.allSettled(
                data.gists.map((gist: GistData) => this.transformGistToBlogPost(gist))
              );

              const successfulPosts: BlogPost[] = [];
              results.forEach((result) => {
                if (result.status === 'fulfilled') {
                  successfulPosts.push(result.value);
                }
              });

              // Apply privacy filtering (even though server might have already filtered, we re-check)
              const filteredPosts = this.filterPostsByPrivacy(successfulPosts);
              return filteredPosts;
            }
          } else {
            console.error('Fallback API request failed:', response.status);
          }
        } catch (fallbackError) {
          console.error('Fallback to server-side API failed:', fallbackError);
        }
      }

      console.error('Authentication status:', this.isAuthenticated());
      console.error('Access token exists:', !!this.accessToken);
      console.error('GitHub username:', this.githubUsername);

      // Even if there's an error, try to fetch public posts as fallback (if we haven't already tried)
      if (this.isAuthenticated()) {
        console.log('Falling back to public posts due to error');
        try {
          return await this.getPublicBlogPosts();
        } catch (fallbackError) {
          console.error('Fallback to public posts also failed:', fallbackError);
        }
      }

      return [];
    }
  }

  // Helper method to explicitly get public blog posts
  private async getPublicBlogPosts(): Promise<BlogPost[]> {
    try {
      console.log(`Fetching public blog posts from user: ${defaultGitHubUsername}`);
      const gists = await this.getUserGists(defaultGitHubUsername);

      const blogGists = gists.filter(gist =>
        gist.description &&
        (gist.description.startsWith('[BLOG]') || gist.description.includes('#blog')) &&
        gist.files &&
        Object.keys(gist.files).length > 0
      );

      const results = await Promise.allSettled(
        blogGists.map((gist) => this.transformGistToBlogPost(gist))
      );

      const successfulPosts: BlogPost[] = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          successfulPosts.push(result.value);
        }
      });

      // For public posts, only show public privacy posts
      const publicPosts = successfulPosts.filter(post => post.privacy !== 'private');
      console.log(`Public blog posts loaded: ${publicPosts.length}`);
      return publicPosts;
    } catch (error) {
      console.error('Error fetching public blog posts:', error);
      return [];
    }
  }

  // Get a specific gist
  async getGist(gistId: string): Promise<GistData> {
    return this.request(`/gists/${gistId}`);
  }

  // Create a new blog post (gist)
  async createBlogPost(data: {
    title: string;
    content: string;
    description?: string;
    location?: string;
    images?: string[];
    tags?: string[];
    privacy?: 'public' | 'private';
  }): Promise<BlogPost> {
    const filename = `${data.title.toLowerCase().replace(/\s+/g, '-')}.md`;

    // Create metadata object
    const metadata = {
      location: data.location,
      images: data.images || [],
      tags: data.tags || [],
      privacy: data.privacy || 'public',
      createdAt: new Date().toISOString(),
    };

    // Create enhanced content with images if provided
    let enhancedContent = data.content;

    // If images are provided and not already in content, add them
    if (data.images && data.images.length > 0) {
      const existingImages = new Set();
      // Extract existing image URLs from content
      const imageRegex = /!\[.*?\]\(([^)]+)\)/g;
      let match;
      while ((match = imageRegex.exec(data.content)) !== null) {
        existingImages.add(match[1]);
      }

      // Add any new images that aren't already in the content
      const newImages = data.images.filter(img => !existingImages.has(img));
      if (newImages.length > 0) {
        const imageMarkdown = newImages.map(img => `![Image](${img})`).join('\n\n');
        enhancedContent = data.content + (data.content ? '\n\n' : '') + imageMarkdown;
      }
    }

    // Combine content with metadata as frontmatter
    const fullContent = `---
title: ${data.title}
location: ${data.location || ''}
images: ${JSON.stringify(data.images || [])}
tags: ${JSON.stringify(data.tags || [])}
privacy: ${metadata.privacy}
createdAt: ${metadata.createdAt}
---

${enhancedContent}`;

    const gistData = {
      description: `[BLOG] ${data.title} ${data.description ? `- ${data.description}` : ''}`,
      public: data.privacy !== 'private', // Set gist to private if post privacy is private
      files: {
        [filename]: {
          content: fullContent,
        },
      },
    };

    const gist = await this.request('/gists', {
      method: 'POST',
      body: JSON.stringify(gistData),
    });

    return await this.transformGistToBlogPost(gist);
  }

  // Update an existing blog post
  async updateBlogPost(gistId: string, data: {
    title?: string;
    content?: string;
    description?: string;
    location?: string;
    images?: string[];
    tags?: string[];
    privacy?: 'public' | 'private';
  }): Promise<BlogPost> {
    const gist = await this.getGist(gistId);
    const filename = Object.keys(gist.files)[0];
    const currentFile = gist.files[filename];

    // Parse current content to extract metadata
    const { content: currentContent, metadata } = this.parseMarkdownWithFrontmatter(currentFile.content);

    // Update metadata
    const updatedMetadata = {
      ...metadata,
      ...(data.title && { title: data.title }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.images && { images: data.images }),
      ...(data.tags && { tags: data.tags }),
      ...(data.privacy && { privacy: data.privacy }),
      updatedAt: new Date().toISOString(),
    };

    // Create enhanced content with images if provided
    let enhancedContent = data.content || currentContent;

    // If images are provided in the update, handle them
    if (data.images && data.images.length > 0) {
      const existingImages = new Set();
      // Extract existing image URLs from content
      const imageRegex = /!\[.*?\]\(([^)]+)\)/g;
      let match;
      while ((match = imageRegex.exec(enhancedContent)) !== null) {
        existingImages.add(match[1]);
      }

      // Add any new images that aren't already in the content
      const newImages = data.images.filter(img => !existingImages.has(img));
      if (newImages.length > 0) {
        const imageMarkdown = newImages.map(img => `![Image](${img})`).join('\n\n');
        enhancedContent = enhancedContent + (enhancedContent ? '\n\n' : '') + imageMarkdown;
      }
    }

    const updatedContent = `---
title: ${updatedMetadata.title || metadata.title}
location: ${updatedMetadata.location || ''}
images: ${JSON.stringify(updatedMetadata.images || [])}
tags: ${JSON.stringify(updatedMetadata.tags || [])}
privacy: ${updatedMetadata.privacy || metadata.privacy || 'public'}
createdAt: ${metadata.createdAt}
updatedAt: ${updatedMetadata.updatedAt}
---

${enhancedContent}`;

    // Get the current description without the [BLOG] prefix and clean it up
    const currentDescription = gist.description.replace(/^\[BLOG\]\s*/, '').trim();

    // Extract just the title part and any additional description
    const titleMatch = currentDescription.match(/^(.+?)(?:\s*-\s*(.*))?$/);
    const originalExtraDescription = titleMatch ? titleMatch[2] : '';

    // Build new description
    const newTitle = updatedMetadata.title || metadata.title || 'Untitled Post';
    const descriptionPart = data.description || originalExtraDescription;
    const newDescription = `[BLOG] ${newTitle}${descriptionPart ? ` - ${descriptionPart}` : ''}`;

    const updateData = {
      description: newDescription,
      public: (updatedMetadata.privacy || metadata.privacy || 'public') !== 'private', // Update gist visibility
      files: {
        [filename]: {
          content: updatedContent,
        },
      },
    };

    const updatedGist = await this.request(`/gists/${gistId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });

    return await this.transformGistToBlogPost(updatedGist);
  }

  // Delete a blog post
  async deleteBlogPost(gistId: string): Promise<void> {
    await this.request(`/gists/${gistId}`, {
      method: 'DELETE',
    });
  }

  // Transform Gist data to BlogPost format
  private async transformGistToBlogPost(gist: GistData): Promise<BlogPost> {
    // Ensure gist has files
    if (!gist.files || Object.keys(gist.files).length === 0) {
      console.warn('Gist has no files:', gist.id);
      throw new Error(`Gist ${gist.id} has no files and should be skipped`);
    }

    const filename = Object.keys(gist.files)[0];
    const file = gist.files[filename];

    // Ensure file exists
    if (!file) {
      console.warn('Gist file not found:', gist.id, filename);
      throw new Error(`Gist ${gist.id} file ${filename} not found and should be skipped`);
    }

    let fileContent = file.content;

    // Debug logging
    console.log('Processing gist file:', {
      gistId: gist.id,
      filename,
      truncated: file.truncated,
      hasRawUrl: !!file.raw_url,
      contentLength: file.content ? file.content.length : 0,
      contentType: typeof file.content,
      contentPreview: file.content ? file.content.substring(0, 100) + '...' : 'NO CONTENT'
    });

    // If content is truncated OR missing/empty, fetch full content from raw_url
    if ((file.truncated || !file.content) && file.raw_url) {
      console.log('Fetching full content from raw_url (truncated or missing):', gist.id, filename);
      try {
        const response = await fetch(file.raw_url);
        if (response.ok) {
          fileContent = await response.text();
          console.log('Successfully fetched full content for:', gist.id, 'Length:', fileContent.length);
        } else {
          console.warn('Failed to fetch full content from raw_url:', response.status, gist.id);
        }
      } catch (error) {
        console.error('Error fetching full content from raw_url:', error, gist.id);
      }
    }

    // If content is still missing or empty, try fetching the full gist
    if (!fileContent || fileContent.trim().length === 0) {
      console.log('Content missing, attempting to fetch full gist:', gist.id);
      try {
        const fullGist = await this.getGist(gist.id);
        const fullFile = fullGist.files[filename];
        if (fullFile && fullFile.content) {
          fileContent = fullFile.content;
          console.log('Successfully fetched content from full gist:', gist.id, 'Length:', fileContent.length);

          // If the full gist content is also truncated, fetch from raw_url
          if (fullFile.truncated && fullFile.raw_url) {
            console.log('Full gist content also truncated, fetching from raw_url:', gist.id);
            try {
              const response = await fetch(fullFile.raw_url);
              if (response.ok) {
                fileContent = await response.text();
                console.log('Successfully fetched content from full gist raw_url:', gist.id, 'Length:', fileContent.length);
              }
            } catch (error) {
              console.error('Error fetching from full gist raw_url:', error, gist.id);
            }
          }
        } else {
          console.warn('Full gist also has no content:', gist.id, filename);
        }
      } catch (error) {
        console.error('Error fetching full gist:', error, gist.id);
        // If the gist is deleted or inaccessible, throw an error to skip it entirely
        if (error instanceof Error && error.message.includes('Post not found')) {
          throw new Error(`Gist ${gist.id} is no longer accessible and should be skipped`);
        }
      }
    }

    // Debug final content
    console.log('Final content check:', {
      gistId: gist.id,
      finalContentLength: fileContent ? fileContent.length : 0,
      finalContentType: typeof fileContent,
      finalContentPreview: fileContent ? fileContent.substring(0, 100) + '...' : 'NO CONTENT'
    });

    // Ensure content exists after potential fetch
    if (!fileContent || typeof fileContent !== 'string' || fileContent.trim().length === 0) {
      console.warn('Gist file has no content after processing:', gist.id, filename);
      // Instead of creating a placeholder post, throw an error to skip this gist entirely
      throw new Error(`Gist ${gist.id} has no accessible content and should be skipped`);
    }

    const { content, metadata } = this.parseMarkdownWithFrontmatter(fileContent);

    return {
      id: gist.id,
      title: (metadata.title as string) || filename.replace('.md', '').replace(/-/g, ' '),
      content,
      description: gist.description.replace('[BLOG]', '').trim(),
      createdAt: (metadata.createdAt as string) || gist.created_at,
      updatedAt: (metadata.updatedAt as string) || gist.updated_at,
      author: {
        login: gist.owner.login,
        avatar_url: gist.owner.avatar_url,
      },
      location: metadata.location as string,
      images: metadata.images as string[],
      tags: metadata.tags as string[],
      privacy: (metadata.privacy as 'public' | 'private') || 'public',
    };
  }

  // Parse markdown with frontmatter
  private parseMarkdownWithFrontmatter(content: string): { content: string; metadata: Record<string, unknown> } {
    // Handle undefined or null content
    if (!content || typeof content !== 'string') {
      console.warn('parseMarkdownWithFrontmatter received invalid content:', typeof content);
      return { content: content || '', metadata: {} };
    }

    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return { content, metadata: {} };
    }

    const [, frontmatterText, markdownContent] = match;
    const metadata: Record<string, unknown> = {};

    // Parse simple YAML-like frontmatter
    frontmatterText.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        try {
          // Try to parse JSON values
          metadata[key.trim()] = JSON.parse(value);
        } catch {
          // If not JSON, treat as string
          metadata[key.trim()] = value;
        }
      }
    });

    return { content: markdownContent.trim(), metadata };
  }

  // Filter posts based on privacy and authentication status
  private filterPostsByPrivacy(posts: BlogPost[]): BlogPost[] {
    if (this.isAuthenticated()) {
      // Authenticated users see all their posts (private and public)
      console.log('User authenticated - showing all posts');
      return posts;
    } else {
      // Non-authenticated users only see public posts
      const publicPosts = posts.filter(post => post.privacy !== 'private');
      console.log(`Non-authenticated user - filtering to ${publicPosts.length} public posts out of ${posts.length} total`);
      return publicPosts;
    }
  }
}

// Export singleton instance
export const githubAPI = new GitHubGistAPI();

// Simple authentication helper functions (for OAuth flow)
export const authenticateUser = async (credentials: AuthCredentials): Promise<User> => {
  // Call the login API
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Login failed');
  }

  const data = await response.json();

  // Set credentials in the API instance (not in localStorage)
  githubAPI.setCredentials(data.github_token, data.github_username);

  return {
    username: data.username,
    github_username: data.github_username,
    avatar_url: `https://github.com/${data.github_username}.png`,
    name: data.username,
  };
};

export const logoutUser = () => {
  githubAPI.removeCredentials();
};

// Exchange authorization code for access token
export const exchangeCodeForToken = async (code: string): Promise<string> => {
  try {
    const response = await fetch('/api/auth/github/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to exchange code for token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};
