// Simple configuration file for Quick Blog
// GitHub credentials are now stored in environment variables

const config = {
  // Login credentials
  // These should also be moved to environment variables for security
  auth: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'change_me',
  },
  
  // GitHub configuration
  github: {
    username: process.env.GITHUB_USERNAME || 'meetkool',
    // Get your personal access token from: https://github.com/settings/tokens
    // Required scopes: 'gist' (to create/read/update/delete gists)
    // Token is now stored in GITHUB_PERSONAL_ACCESS_TOKEN environment variable
    personalAccessToken: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || '',
  },
  
  // App configuration
  app: {
    name: 'Quick Blog Nardcart',
    description: 'Simple blogging system using GitHub Gists',
  }
};

module.exports = config;
