import { 
  LinkParser as ILinkParser,
  LinkParseResult,
  LinkContent,
  ImageLinkContent,
  LinkMetadata
} from '@/types/blog-editor';

export class LinkParser implements ILinkParser {
  public ignoredLinks: string[] = [];
  private parseCache: Map<string, LinkParseResult> = new Map();
  private proxyURL?: string;
  private proxyAuth?: string;
  
  constructor(config?: {
    proxyURL?: string;
    proxyAuth?: string;
    ignoredLinks?: string[];
  }) {
    if (config) {
      this.proxyURL = config.proxyURL;
      this.proxyAuth = config.proxyAuth;
      this.ignoredLinks = config.ignoredLinks || [];
    }
  }

  parseText(text: string): void {
    const urls = this.extractUrls(text);
    
    // Process each URL
    urls.forEach(url => {
      if (!this.shouldIgnoreUrl(url)) {
        // Parse the link asynchronously
        this.parseLink(url).catch(error => {
          console.warn('Failed to parse link:', url, error);
        });
      }
    });
  }

  async parseLink(url: string): Promise<LinkParseResult> {
    // Check cache first
    if (this.parseCache.has(url)) {
      const cached = this.parseCache.get(url)!;
      return cached;
    }

    try {
      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error('Invalid URL format');
      }

      // Check if it's an image URL
      const imageResult = this.tryParseAsImage(url);
      if (imageResult) {
        this.parseCache.set(url, imageResult);
        return imageResult;
      }

      // Parse as regular link
      const linkResult = await this.fetchLinkMetadata(url);
      this.parseCache.set(url, linkResult);
      return linkResult;

    } catch (err) {
      const errorResult: LinkParseResult = {
        valid: false,
        content_type: 'link',
        content: {
          link: url,
          title: url,
          host: this.extractHost(url),
          is_video: false
        }
      };
      
      this.parseCache.set(url, errorResult);
      throw err;
    }
  }

  isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  extractMetadata(html: string, url: string): LinkContent {
    // Create a temporary DOM to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract metadata using various methods
    const metadata: LinkMetadata = {};
    
    // Open Graph tags (Facebook, Twitter, etc.)
    metadata.title = this.getMetaContent(doc, 'og:title') || 
                    this.getMetaContent(doc, 'twitter:title') ||
                    doc.querySelector('title')?.textContent?.trim();
                    
    metadata.description = this.getMetaContent(doc, 'og:description') ||
                          this.getMetaContent(doc, 'twitter:description') ||
                          this.getMetaContent(doc, 'description');
                          
    metadata.image = this.getMetaContent(doc, 'og:image') ||
                    this.getMetaContent(doc, 'twitter:image') ||
                    this.getMetaContent(doc, 'image');
                    
    metadata.type = this.getMetaContent(doc, 'og:type') ||
                   this.getMetaContent(doc, 'twitter:card');
                   
    metadata.url = this.getMetaContent(doc, 'og:url') || url;

    // Construct LinkContent
    const linkContent: LinkContent = {
      link: url,
      title: metadata.title || this.extractHost(url),
      desc: metadata.description,
      host: this.extractHost(url),
      thumb: this.resolveImageUrl(metadata.image, url),
      is_video: this.isVideoContent(metadata.type, html)
    };

    return linkContent;
  }

  private extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches || [];
  }

  private shouldIgnoreUrl(url: string): boolean {
    return this.ignoredLinks.some(ignored => url.includes(ignored));
  }

  private tryParseAsImage(url: string): LinkParseResult | null {
    const imageRegex = /^https?:\/\/([^:\/\s]+)([^\/\s]*\/)([^\.\s]+)\.(jpe?g|png|gif|webp|svg)((\?|\#)(.*))?$/i;
    const imageMatch = url.match(imageRegex);
    
    if (imageMatch) {
      const host = imageMatch[1];
      
      return {
        valid: true,
        content_type: 'img_link',
        content: {
          src: url,
          host: host
        } as ImageLinkContent
      };
    }
    
    return null;
  }

  private async fetchLinkMetadata(url: string): Promise<LinkParseResult> {
    const fetchUrl = this.proxyURL ? 
      `${this.proxyURL}?url=${encodeURIComponent(url)}` : 
      url;
      
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (compatible; BlogEditor/1.0)'
    };
    
    if (this.proxyAuth) {
      headers['Authorization'] = this.proxyAuth;
    }

    try {
      const response = await fetch(fetchUrl, {
        method: 'GET',
        headers,
        mode: 'cors',
        cache: 'default'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const metadata = this.extractMetadata(html, url);
      
      return {
        valid: true,
        content_type: 'link',
        content: metadata
      };
      
    } catch {
      // If direct fetch fails, try with a simple API endpoint
      return this.fallbackLinkParse(url);
    }
  }

  private async fallbackLinkParse(url: string): Promise<LinkParseResult> {
    try {
      const response = await fetch('/api/parse-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.message || 'Failed to parse link');
      }

      return data as LinkParseResult;
      
    } catch {
      // Final fallback: create basic link content
      return {
        valid: true,
        content_type: 'link',
        content: {
          link: url,
          title: this.extractHost(url),
          host: this.extractHost(url),
          is_video: false
        }
      };
    }
  }

  private getMetaContent(doc: Document, property: string): string | undefined {
    // Try Open Graph property
    let meta = doc.querySelector(`meta[property="${property}"]`);
    if (meta) {
      return meta.getAttribute('content') || undefined;
    }
    
    // Try name attribute
    meta = doc.querySelector(`meta[name="${property}"]`);
    if (meta) {
      return meta.getAttribute('content') || undefined;
    }
    
    return undefined;
  }

  private extractHost(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }

  private resolveImageUrl(imageUrl: string | undefined, baseUrl: string): string | undefined {
    if (!imageUrl) return undefined;
    
    try {
      // If image URL is absolute, return as is
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      
      // If image URL is relative, resolve against base URL
      const base = new URL(baseUrl);
      return new URL(imageUrl, base.origin).href;
      
    } catch {
      return undefined;
    }
  }

  private isVideoContent(type: string | undefined, html: string): boolean {
    if (type && (type.includes('video') || type.includes('player'))) {
      return true;
    }
    
    // Check for video-related elements in HTML
    const videoIndicators = [
      'youtube.com',
      'vimeo.com',
      'dailymotion.com',
      'twitch.tv',
      'tiktok.com',
      'instagram.com/p/',
      'twitter.com/.*video',
      'player.vimeo.com',
      'video',
      'player'
    ];
    
    return videoIndicators.some(indicator => 
      html.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  // Public utility methods
  
  public clearCache(): void {
    this.parseCache.clear();
  }

  public addIgnoredLink(url: string): void {
    if (!this.ignoredLinks.includes(url)) {
      this.ignoredLinks.push(url);
    }
  }

  public removeIgnoredLink(url: string): void {
    const index = this.ignoredLinks.indexOf(url);
    if (index > -1) {
      this.ignoredLinks.splice(index, 1);
    }
  }

  public getCacheSize(): number {
    return this.parseCache.size;
  }

  public getCachedResult(url: string): LinkParseResult | undefined {
    return this.parseCache.get(url);
  }

  // Static utility methods
  
  public static extractAllUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  }

  public static isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowercaseUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowercaseUrl.includes(ext));
  }

  public static isVideoUrl(url: string): boolean {
    const videoSites = [
      'youtube.com',
      'youtu.be',
      'vimeo.com',
      'dailymotion.com',
      'twitch.tv',
      'tiktok.com'
    ];
    
    return videoSites.some(site => url.toLowerCase().includes(site));
  }
}

// Factory function
export function createLinkParser(config?: {
  proxyURL?: string;
  proxyAuth?: string;
  ignoredLinks?: string[];
}): LinkParser {
  return new LinkParser(config);
}

// Singleton instance
export const linkParser = new LinkParser();
