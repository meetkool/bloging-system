import { 
  ContentType, 
  ContentData, 
  LinkContent, 
  ImageLinkContent, 
  ImageContent,
  ContentManager as IContentManager 
} from '@/types/blog-editor';

/**
 * Sanitizes a string to prevent XSS attacks
 * Escapes HTML special characters
 */
function sanitizeString(str: string | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

/**
 * Validates and sanitizes a URL to prevent XSS and dangerous protocols
 * Only allows http, https, and relative URLs
 */
function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  
  try {
    const parsedUrl = new URL(url);
    // Only allow http, https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      console.warn('Blocked unsafe URL protocol:', parsedUrl.protocol);
      return '';
    }
    return parsedUrl.href;
  } catch {
    // If URL parsing fails, treat as relative path
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }
    console.warn('Invalid URL:', url);
    return '';
  }
}

export class ContentManager implements IContentManager {
  public currentContent: ContentData | null = null;
  public isContentSet: boolean = false;
  private containerElement: HTMLElement | null = null;

  constructor(containerElement?: HTMLElement) {
    this.containerElement = containerElement || null;
  }

  setContent(type: ContentType, data: unknown): void {
    this.currentContent = {
      type,
      data: data as LinkContent | ImageLinkContent | ImageContent
    };
    this.isContentSet = true;
    
    // Re-render if container is available
    if (this.containerElement) {
      this.renderToContainer();
    }
  }

  clearContent(): void {
    this.currentContent = null;
    this.isContentSet = false;
    
    // Clear the container
    if (this.containerElement) {
      this.containerElement.innerHTML = '';
      this.containerElement.classList.remove('has-content');
    }
  }

  renderContent(): HTMLElement {
    if (!this.currentContent) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'content-empty';
      return emptyDiv;
    }

    const { type, data } = this.currentContent;
    
    switch (type) {
      case 'link':
        return this.renderLink(data as LinkContent);
      case 'img_link':
        return this.renderImageLink(data as ImageLinkContent);
      case 'image':
        return this.renderImage(data as ImageContent);
      default:
        const errorDiv = document.createElement('div');
        errorDiv.className = 'content-error';
        errorDiv.textContent = `Unknown content type: ${type}`;
        return errorDiv;
    }
  }

  renderLink(data: LinkContent): HTMLElement {
    const linkContainer = document.createElement('div');
    linkContainer.className = 'blog-editor__content blog-editor__content--link';
    
    const linkCard = document.createElement('div');
    linkCard.className = 'link-card';
    
    // Sanitize thumbnail URL
    const sanitizedThumb = sanitizeUrl(data.thumb);
    // Thumbnail
    if (sanitizedThumb) {
      const thumbnail = document.createElement('div');
      thumbnail.className = 'link-card__thumbnail';
      thumbnail.style.backgroundImage = `url(${sanitizedThumb})`;
      linkCard.appendChild(thumbnail);
    }
    
    // Content
    const content = document.createElement('div');
    content.className = 'link-card__content';
    
    // Title - sanitize to prevent XSS
    const title = document.createElement('div');
    title.className = 'link-card__title';
    title.textContent = sanitizeString(data.title);
    content.appendChild(title);
    
    // Description - sanitize to prevent XSS
    if (data.desc) {
      const description = document.createElement('div');
      description.className = 'link-card__description';
      description.textContent = sanitizeString(data.desc);
      content.appendChild(description);
    }
    
    // Host/URL - sanitize to prevent XSS
    const host = document.createElement('div');
    host.className = 'link-card__host';
    host.textContent = sanitizeString(data.host);
    content.appendChild(host);
    
    // Video indicator
    if (data.is_video) {
      const videoIcon = document.createElement('div');
      videoIcon.className = 'link-card__video-icon';
      videoIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      `;
      linkCard.appendChild(videoIcon);
    }
    
    linkCard.appendChild(content);
    
    // Make the entire card clickable - sanitize URL
    const sanitizedLink = sanitizeUrl(data.link);
    if (sanitizedLink) {
      linkCard.addEventListener('click', () => {
        window.open(sanitizedLink, '_blank', 'noopener,noreferrer');
      });
    }
    
    // Add remove button
    const removeButton = this.createRemoveButton();
    linkContainer.appendChild(linkCard);
    linkContainer.appendChild(removeButton);
    
    return linkContainer;
  }

  renderImageLink(data: ImageLinkContent): HTMLElement {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'blog-editor__content blog-editor__content--image-link';
    
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'image-link-wrapper';
    
    // Sanitize image source URL
    const sanitizedSrc = sanitizeUrl(data.src);
    
    const image = document.createElement('img');
    image.src = sanitizedSrc;
    image.alt = 'Linked image';
    image.className = 'image-link';
    image.loading = 'lazy';
    
    // Add click handler to open image in new tab - sanitize URL
    if (sanitizedSrc) {
      image.addEventListener('click', () => {
        window.open(sanitizedSrc, '_blank', 'noopener,noreferrer');
      });
    }
    
    // Host info - sanitize to prevent XSS
    const hostInfo = document.createElement('div');
    hostInfo.className = 'image-link__host';
    hostInfo.textContent = sanitizeString(data.host);
    
    imageWrapper.appendChild(image);
    imageWrapper.appendChild(hostInfo);
    
    // Add remove button
    const removeButton = this.createRemoveButton();
    imageContainer.appendChild(imageWrapper);
    imageContainer.appendChild(removeButton);
    
    return imageContainer;
  }

  renderImage(data: ImageContent): HTMLElement {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'blog-editor__content blog-editor__content--image';
    
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'uploaded-image-wrapper';
    
    // Sanitize image path URL
    const sanitizedPath = sanitizeUrl(data.path);
    
    // Main image
    const image = document.createElement('img');
    image.src = sanitizedPath;
    image.alt = sanitizeString(data.name);
    image.className = 'uploaded-image';
    image.loading = 'lazy';
    
    // Image info - sanitize filename
    const imageInfo = document.createElement('div');
    imageInfo.className = 'uploaded-image__info';
    
    const fileName = document.createElement('div');
    fileName.className = 'uploaded-image__name';
    fileName.textContent = sanitizeString(data.name);
    
    const fileType = document.createElement('div');
    fileType.className = 'uploaded-image__type';
    fileType.textContent = sanitizeString(data.type).toUpperCase();
    
    imageInfo.appendChild(fileName);
    imageInfo.appendChild(fileType);
    
    imageWrapper.appendChild(image);
    imageWrapper.appendChild(imageInfo);
    
    // Add remove button
    const removeButton = this.createRemoveButton();
    imageContainer.appendChild(imageWrapper);
    imageContainer.appendChild(removeButton);
    
    return imageContainer;
  }

  private createRemoveButton(): HTMLElement {
    const removeButton = document.createElement('button');
    removeButton.className = 'content-remove-btn';
    removeButton.type = 'button';
    removeButton.title = 'Remove content';
    removeButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    `;
    
    removeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.clearContent();
    });
    
    return removeButton;
  }

  private renderToContainer(): void {
    if (!this.containerElement) return;
    
    const contentElement = this.renderContent();
    this.containerElement.innerHTML = '';
    this.containerElement.appendChild(contentElement);
    
    if (this.isContentSet) {
      this.containerElement.classList.add('has-content');
    } else {
      this.containerElement.classList.remove('has-content');
    }
  }

  getContentForSubmission(): { content_type: string, content: string } {
    if (!this.currentContent) {
      return {
        content_type: '',
        content: ''
      };
    }

    const { type, data } = this.currentContent;
    
    switch (type) {
      case 'link':
        return {
          content_type: 'link',
          content: JSON.stringify(data)
        };
      case 'img_link':
        return {
          content_type: 'img_link',
          content: JSON.stringify(data)
        };
      case 'image':
        return {
          content_type: 'image',
          content: JSON.stringify(data)
        };
      default:
        return {
          content_type: '',
          content: ''
        };
    }
  }

  // Utility method to set container element
  setContainer(element: HTMLElement): void {
    this.containerElement = element;
    if (this.isContentSet) {
      this.renderToContainer();
    }
  }

  // Method to get content type
  getContentType(): ContentType | null {
    return this.currentContent?.type || null;
  }

  // Method to get content data
  getContentData(): unknown {
    return this.currentContent?.data || null;
  }

  // Method to validate content
  validateContent(): { valid: boolean; error?: string } {
    if (!this.currentContent) {
      return { valid: true }; // Empty content is valid
    }

    const { type, data } = this.currentContent;
    
    switch (type) {
      case 'link':
        const linkData = data as LinkContent;
        if (!linkData.link || !linkData.title || !linkData.host) {
          return { valid: false, error: 'Link content is missing required fields' };
        }
        break;
        
      case 'img_link':
        const imgLinkData = data as ImageLinkContent;
        if (!imgLinkData.src || !imgLinkData.host) {
          return { valid: false, error: 'Image link content is missing required fields' };
        }
        break;
        
      case 'image':
        const imageData = data as ImageContent;
        if (!imageData.path || !imageData.name || !imageData.type) {
          return { valid: false, error: 'Image content is missing required fields' };
        }
        break;
        
      default:
        return { valid: false, error: `Unknown content type: ${type}` };
    }
    
    return { valid: true };
  }
}

// Factory function to create content manager instance
export function createContentManager(containerElement?: HTMLElement): ContentManager {
  return new ContentManager(containerElement);
}
