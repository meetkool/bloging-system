# GitHub Gist-Style Blog Editor

A comprehensive social media-style content creation tool with rich media support, BBCode parsing, and advanced content handling capabilities.

## Features

### ✨ Core Features
- **BBCode Support**: Rich text formatting with `[b]`, `[i]`, `[u]`, `[url]`, `[img]`, `[code]`, `[quote]`, `[goal]`
- **Text Shortcuts**: `*text*` → **bold**, `"text"` → „smart quotes"
- **Hashtag Support**: `#tagname` → clickable hashtags
- **Auto-linking**: URLs automatically converted to clickable links
- **File Upload**: Drag & drop or clipboard paste images
- **Link Previews**: Automatic link metadata extraction with thumbnails
- **Privacy Settings**: Public, Friends, or Private visibility
- **Metadata Fields**: Feeling, People, and Location tags
- **Real-time Preview**: BBCode rendered in real-time

### 🚀 Advanced Features
- **Smart Content Detection**: Automatically detects and previews images, videos, and links
- **Progress Tracking**: Visual upload progress indicators
- **Error Handling**: Comprehensive error handling with user feedback
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: Automatic dark mode support
- **Extensible**: Plugin system for custom BBCode tags and features

## Architecture

### Component Structure
```
GitHubGistEditor (Main Component)
├── BlogTextEditor (Text input with BBCode)
├── ContentManager (Link/image previews)
├── UploadManager (File handling)
├── LinkParser (URL metadata extraction)
├── PrivacyManager (Visibility settings)
└── MetadataManager (Feeling, people, location)
```

### File Organization
```
blog/src/
├── components/
│   ├── github-gist-editor.tsx      # Main editor component
│   └── blog-text-editor.tsx        # Text input component
├── lib/
│   ├── bbcode-parser.ts            # BBCode parsing engine
│   ├── content-manager.ts          # Content preview management
│   ├── upload-manager.ts           # File upload handling
│   ├── link-parser.ts              # Link metadata extraction
│   ├── privacy-manager.ts          # Privacy level management
│   └── metadata-manager.ts         # Post metadata handling
├── types/
│   └── blog-editor.ts              # TypeScript interfaces
└── styles/
    └── blog-editor.css             # Comprehensive styling
```

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Import the Editor**
   ```tsx
   import GitHubGistEditor from '@/components/github-gist-editor';
   import '@/styles/blog-editor.css';
   ```

3. **Basic Usage**
   ```tsx
   <GitHubGistEditor
     onSave={handleSave}
     onCancel={handleCancel}
     placeholder="What's happening?"
     autoFocus={true}
   />
   ```

## Configuration

### Editor Configuration
```tsx
const editorConfig = {
  // API settings
  apiBaseURL: '/api',
  uploadEndpoint: '/api/upload',
  
  // Upload settings
  maxFileSize: 10 * 1024 * 1024,  // 10MB
  allowedFileTypes: [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp'
  ],
  
  // Feature flags
  enableLinkPreview: true,
  enableImageUpload: true,
  enableDragDrop: true,
  enableClipboardPaste: true,
  enableBBCode: true,
  
  // UI settings
  autoResize: true,
  showProgressBar: true,
  theme: 'light'
};

<GitHubGistEditor config={editorConfig} />
```

### Custom BBCode Tags
```tsx
const customTags = [
  {
    name: 'highlight',
    template: '<mark class="highlight">{param}</mark>',
    hasOption: false,
    parseContent: true
  },
  {
    name: 'color',
    template: '<span style="color: {option}">{param}</span>',
    hasOption: true,
    parseContent: true
  }
];

<GitHubGistEditor 
  config={{ customTags }} 
/>
```

## BBCode Reference

### Basic Formatting
- `[b]Bold text[/b]` → **Bold text**
- `[i]Italic text[/i]` → *Italic text*
- `[u]Underlined text[/u]` → <u>Underlined text</u>

### Advanced Formatting
- `[url]https://example.com[/url]` → [https://example.com](https://example.com)
- `[url=https://example.com]Click here[/url]` → [Click here](https://example.com)
- `[img]https://example.com/image.jpg[/img]` → ![Image](image.jpg)
- `[code]console.log('Hello')[/code]` → `console.log('Hello')`
- `[code=javascript]const x = 1;[/code]` → ```javascript const x = 1; ```

### Special Tags
- `[quote]Some quote[/quote]` → Blockquote
- `[quote=Author]Some quote[/quote]` → Blockquote with attribution
- `[goal]Achieve this[/goal]` → Highlighted goal box
- `[goal=star]Special goal[/goal]` → Goal with icon

### Text Shortcuts
- `*bold text*` → **bold text**
- `"quoted text"` → „quoted text"
- `#hashtag` → Clickable hashtag
- `https://example.com` → Auto-linked URL

## API Endpoints

### Upload Endpoint
```typescript
POST /api/upload
Content-Type: multipart/form-data

Response:
{
  error: false,
  path: "/uploads/image.jpg",
  thumb: "/uploads/image.jpg",
  name: "image.jpg",
  type: "image/jpeg",
  size: 1024
}
```

### Link Parser Endpoint
```typescript
POST /api/parse-link
Content-Type: application/json
Body: { "url": "https://example.com" }

Response:
{
  valid: true,
  content_type: "link",
  content: {
    link: "https://example.com",
    title: "Page Title",
    desc: "Page description",
    host: "example.com",
    thumb: "https://example.com/image.jpg",
    is_video: false
  }
}
```

## Event System

The editor emits various events that you can listen to:

```tsx
const handleEditorEvent = (event, data) => {
  switch (event) {
    case 'contentChange':
      console.log('Content changed:', data.value);
      break;
    case 'uploadStart':
      console.log('Upload started');
      break;
    case 'uploadComplete':
      console.log('Upload completed:', data);
      break;
    case 'linkDetected':
      console.log('Link detected:', data.url);
      break;
    case 'privacyChange':
      console.log('Privacy changed:', data.level);
      break;
  }
};

<GitHubGistEditor onEvent={handleEditorEvent} />
```

## Styling & Theming

### CSS Classes
The editor uses a comprehensive set of CSS classes for styling:

```css
.blog-editor { /* Main container */ }
.blog-text-editor__textarea { /* Text input */ }
.blog-editor__content { /* Content previews */ }
.blog-editor__toolbar { /* Bottom toolbar */ }
.blog-editor__privacy { /* Privacy dropdown */ }
.metadata-field-row { /* Metadata fields */ }
```

### Custom Themes
Create custom themes by overriding CSS variables:

```css
.blog-editor.custom-theme {
  --primary-color: #your-color;
  --background-color: #your-bg;
  --border-color: #your-border;
  --text-color: #your-text;
}
```

### Dark Mode
Dark mode is automatically supported via CSS media queries:

```css
@media (prefers-color-scheme: dark) {
  .blog-editor {
    background: #1f2937;
    color: #f9fafb;
  }
}
```

## Usage Examples

### Basic Implementation
```tsx
import { useState } from 'react';
import GitHubGistEditor from '@/components/github-gist-editor';

function MyBlogEditor() {
  const [posts, setPosts] = useState([]);

  const handleSave = async (postData) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      if (response.ok) {
        const newPost = await response.json();
        setPosts([newPost, ...posts]);
      }
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  return (
    <GitHubGistEditor
      onSave={handleSave}
      placeholder="Share your thoughts..."
      config={{
        enableImageUpload: true,
        enableLinkPreview: true,
        maxFileSize: 5 * 1024 * 1024
      }}
    />
  );
}
```

### Advanced Implementation with Custom Handlers
```tsx
function AdvancedEditor() {
  const handleSave = async (postData) => {
    // Custom save logic
    const processedData = {
      ...postData,
      html: parseBBCode(postData.text),
      plainText: getBBCodePlainText(postData.text),
      timestamp: new Date().toISOString()
    };
    
    await savePost(processedData);
  };

  const handleUploadProgress = (progress) => {
    console.log(`Upload progress: ${progress}%`);
  };

  return (
    <GitHubGistEditor
      onSave={handleSave}
      onUploadProgress={handleUploadProgress}
      config={{
        enableAll: true,
        customTags: [
          {
            name: 'spoiler',
            template: '<details class="spoiler"><summary>Spoiler</summary>{param}</details>',
            hasOption: false,
            parseContent: true
          }
        ]
      }}
    />
  );
}
```

## Performance Considerations

### Optimizations
- **Lazy Loading**: Content previews are rendered only when needed
- **Debounced Parsing**: BBCode parsing is debounced to prevent excessive re-renders
- **Image Compression**: Uploaded images can be automatically compressed
- **Link Caching**: Parsed link metadata is cached to avoid repeat requests

### Memory Management
- Event listeners are properly cleaned up on component unmount
- File uploads are processed in chunks to prevent memory issues
- Link parser cache is automatically cleaned to prevent memory leaks

## Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Required Features
- File API (for drag & drop uploads)
- Fetch API (for link parsing)
- CSS Grid & Flexbox (for layout)
- ES6+ (for modern JavaScript features)

## Accessibility

### Keyboard Navigation
- `Tab`: Navigate between elements
- `Enter/Space`: Activate buttons
- `Escape`: Close dropdowns/modals
- `Ctrl+B`: Bold formatting
- `Ctrl+I`: Italic formatting
- `Ctrl+U`: Underline formatting

### Screen Reader Support
- All interactive elements have proper ARIA labels
- Content changes are announced
- Upload progress is communicated
- Error messages are accessible

## Troubleshooting

### Common Issues

1. **Upload Not Working**
   - Check upload endpoint configuration
   - Verify file size limits
   - Ensure upload directory permissions

2. **Link Previews Not Loading**
   - Check CORS configuration
   - Verify API endpoint is accessible
   - Check network connectivity

3. **BBCode Not Parsing**
   - Verify BBCode syntax is correct
   - Check for conflicting CSS
   - Ensure parser is properly initialized

### Debug Mode
Enable debug mode for detailed logging:

```tsx
<GitHubGistEditor 
  config={{ debug: true }} 
/>
```

## Contributing

To contribute to the editor:

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

### Development Setup
```bash
git clone <repository>
cd blog
npm install
npm run dev
```

### Testing
```bash
npm run test          # Run unit tests
npm run test:e2e      # Run end-to-end tests
npm run lint          # Run linting
npm run type-check    # Run TypeScript checks
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Credits

Built with:
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Next.js 14** - Full-stack framework
- **Tailwind CSS** - Utility-first CSS framework

Inspired by GitHub Gists and modern social media editors.
