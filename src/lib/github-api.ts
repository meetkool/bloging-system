// GitHub API integration for Gist-based blog posts

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

class GitHubGistAPI {
  private baseURL = 'https://api.github.com';
  private accessToken: string | null = null;
  private githubUsername: string | null = null;

  constructor() {
    // Get stored credentials from localStorage
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('github_access_token');
      this.githubUsername = localStorage.getItem('github_username');
    }
  }

  setCredentials(token: string, username: string) {
    this.accessToken = token;
    this.githubUsername = username;
    if (typeof window !== 'undefined') {
      localStorage.setItem('github_access_token', token);
      localStorage.setItem('github_username', username);
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('github_access_token', token);
    }
  }

  removeCredentials() {
    this.accessToken = null;
    this.githubUsername = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('github_access_token');
      localStorage.removeItem('github_username');
    }
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
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
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
      const gists = await this.getUserGists();
      
      // Filter gists that are blog posts (you can customize this logic)
      const blogGists = gists.filter(gist => 
        gist.description && 
        (gist.description.startsWith('[BLOG]') || gist.description.includes('#blog')) &&
        gist.files && 
        Object.keys(gist.files).length > 0
      );

      return Promise.all(blogGists.map((gist) => this.transformGistToBlogPost(gist)));
    } catch (error) {
      console.error('Error fetching blog posts:', error);
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
  }): Promise<BlogPost> {
    const filename = `${data.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    
    // Create metadata object
    const metadata = {
      location: data.location,
      images: data.images || [],
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
    };

    // Combine content with metadata as frontmatter
    const fullContent = `---
title: ${data.title}
location: ${data.location || ''}
images: ${JSON.stringify(data.images || [])}
tags: ${JSON.stringify(data.tags || [])}
createdAt: ${metadata.createdAt}
---

${data.content}`;

    const gistData = {
      description: `[BLOG] ${data.title} ${data.description ? `- ${data.description}` : ''}`,
      public: true,
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
      updatedAt: new Date().toISOString(),
    };

    const updatedContent = `---
title: ${updatedMetadata.title || metadata.title}
location: ${updatedMetadata.location || ''}
images: ${JSON.stringify(updatedMetadata.images || [])}
tags: ${JSON.stringify(updatedMetadata.tags || [])}
createdAt: ${metadata.createdAt}
updatedAt: ${updatedMetadata.updatedAt}
---

${data.content || currentContent}`;

    const updateData = {
      description: `[BLOG] ${updatedMetadata.title} ${data.description ? `- ${data.description}` : ''}`,
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
      return {
        id: gist.id,
        title: 'Untitled',
        content: 'No content available',
        description: gist.description.replace('[BLOG]', '').trim(),
        createdAt: gist.created_at,
        updatedAt: gist.updated_at,
        author: {
          login: gist.owner.login,
          avatar_url: gist.owner.avatar_url,
        },
      };
    }
    
    const filename = Object.keys(gist.files)[0];
    const file = gist.files[filename];
    
    // Ensure file exists
    if (!file) {
      console.warn('Gist file not found:', gist.id, filename);
      return {
        id: gist.id,
        title: filename ? filename.replace('.md', '').replace(/-/g, ' ') : 'Untitled',
        content: 'No content available',
        description: gist.description.replace('[BLOG]', '').trim(),
        createdAt: gist.created_at,
        updatedAt: gist.updated_at,
        author: {
          login: gist.owner.login,
          avatar_url: gist.owner.avatar_url,
        },
      };
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

    // If content is truncated, fetch full content from raw_url
    if (file.truncated && file.raw_url) {
      console.log('Fetching full content for truncated file:', gist.id, filename);
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
      return {
        id: gist.id,
        title: filename ? filename.replace('.md', '').replace(/-/g, ' ') : 'Untitled',
        content: 'No content available',
        description: gist.description.replace('[BLOG]', '').trim(),
        createdAt: gist.created_at,
        updatedAt: gist.updated_at,
        author: {
          login: gist.owner.login,
          avatar_url: gist.owner.avatar_url,
        },
      };
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
}

// Export singleton instance
export const githubAPI = new GitHubGistAPI();

// Simple authentication helper functions
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
  
  // Set credentials in the API instance
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
