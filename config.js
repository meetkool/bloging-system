// Simple configuration file for Quick Blog
// Replace these with your actual GitHub credentials

const config = {
  // Login credentials
  auth: {
    username: 'kooljool',
    password: 'Meetkool!',
  },
  
  // GitHub configuration
  github: {
    username: 'kooljool', // Your GitHub username
    // Get your personal access token from: https://github.com/settings/tokens
    // Required scopes: 'gist' (to create/read/update/delete gists)
    personalAccessToken: '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',
  },
  
  // App configuration
  app: {
    name: 'Quick Blog',
    description: 'Simple blogging system using GitHub Gists',
  }
};

module.exports = config;

