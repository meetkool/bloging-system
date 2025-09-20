# Quick Blog Setup Guide

This guide will help you configure your Quick Blog system with GitHub Gist integration.

## 🔧 Configuration Steps

### 1. Create a GitHub Personal Access Token

1. Go to [GitHub Settings > Personal access tokens](https://github.com/settings/tokens)
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give your token a descriptive name (e.g., "Quick Blog Gist Access")
4. Set expiration as needed (or "No expiration" for permanent access)
5. Select the following scope:
   - ✅ **`gist`** - Create, read, update, and delete gists

6. Click **"Generate token"**
7. **Copy the token immediately** (you won't be able to see it again!)

### 2. Update Configuration File

1. Open `config.js` in the blog directory
2. Replace `'your_github_personal_access_token_here'` with your actual token:

```javascript
const config = {
  // Login credentials
  auth: {
    username: 'kooljool',
    password: 'Meetkool!',
  },
  
  // GitHub configuration
  github: {
    username: 'kooljool', // Your GitHub username
    personalAccessToken: 'ghp_xxxxxxxxxxxxxxxxxxxx', // Your actual token here
  },
  
  // App configuration
  app: {
    name: 'Quick Blog',
    description: 'Simple blogging system using GitHub Gists',
  }
};
```

### 3. Update GitHub Username (if needed)

Make sure the `github.username` in `config.js` matches your actual GitHub username.

## 🚀 Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000/quick-blog

4. Login with:
   - **Username**: `kooljool`
   - **Password**: `Meetkool!`

## ✅ Testing the Setup

1. Try logging in with the credentials above
2. Create a test blog post
3. Check your GitHub gists at https://gist.github.com/ - you should see a new gist with `[BLOG]` prefix
4. The post should appear in your Quick Blog feed

## 🔒 Security Notes

- **Keep your Personal Access Token secure** - never commit it to version control
- The token gives access to create/modify/delete your gists
- You can revoke the token anytime from GitHub settings
- Consider using environment variables in production

## 🛠 Customization

You can modify the login credentials in `config.js`:
- Change `auth.username` and `auth.password` to your preferred credentials
- Update `github.username` to match your GitHub account
- Modify `app.name` and `app.description` as needed

## 📝 How It Works

1. You log in with your custom credentials
2. The system uses your GitHub Personal Access Token to access the GitHub API
3. Blog posts are stored as GitHub Gists with a `[BLOG]` prefix
4. Posts are rendered from these Gists in real-time
5. You can edit posts by modifying the Gists directly on GitHub or through the blog interface

## 🐛 Troubleshooting

### "GitHub Personal Access Token not configured"
- Make sure you've replaced the placeholder token in `config.js`
- Ensure the token has the `gist` scope

### Login fails
- Check that username/password match what's in `config.js`
- Verify the config file syntax is correct

### Can't create posts
- Verify your GitHub token has the `gist` scope
- Check that your GitHub username is correct
- Make sure the token hasn't expired

### Posts don't appear
- Check your GitHub gists at https://gist.github.com/
- Look for gists with `[BLOG]` prefix
- Verify the token has read permissions for gists

