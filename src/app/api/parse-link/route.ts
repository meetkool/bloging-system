import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ 
        error: true, 
        message: 'URL is required' 
      }, { status: 400 });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ 
        error: true, 
        message: 'Invalid URL format' 
      }, { status: 400 });
    }
    
    // Check if it's an image URL
    const imageRegex = /^https?:\/\/([^:\/\s]+)([^\/\s]*\/)([^\.\s]+)\.(jpe?g|png|gif|webp|svg)((\?|\#)(.*))?$/i;
    const imageMatch = url.match(imageRegex);
    
    if (imageMatch) {
      const host = imageMatch[1];
      
      return NextResponse.json({
        valid: true,
        content_type: 'img_link',
        content: {
          src: url,
          host: host
        }
      });
    }
    
    // Parse as regular link
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BlogEditor/1.0; +https://example.com)'
        },
        // Set timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Extract metadata using simple regex patterns
      const extractMetaContent = (property: string): string | null => {
        // Try Open Graph property
        const ogRegex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*?)["']`, 'i');
        let match = html.match(ogRegex);
        if (match) return match[1];
        
        // Try name attribute
        const nameRegex = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*?)["']`, 'i');
        match = html.match(nameRegex);
        if (match) return match[1];
        
        return null;
      };
      
      // Extract title
      let title = extractMetaContent('og:title') || 
                 extractMetaContent('twitter:title');
      
      if (!title) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        title = titleMatch ? titleMatch[1].trim() : '';
      }
      
      // Extract description
      const description = extractMetaContent('og:description') || 
                         extractMetaContent('twitter:description') ||
                         extractMetaContent('description');
      
      // Extract image
      const image = extractMetaContent('og:image') || 
                   extractMetaContent('twitter:image');
      
      // Extract host
      const urlObj = new URL(url);
      const host = urlObj.hostname;
      
      // Check if it's video content
      const type = extractMetaContent('og:type') || extractMetaContent('twitter:card');
      const isVideo = type ? 
        (type.includes('video') || type.includes('player')) : 
        false;
      
      const linkContent = {
        link: url,
        title: title || host,
        desc: description || undefined,
        host: host,
        thumb: image || undefined,
        is_video: isVideo
      };
      
      return NextResponse.json({
        valid: true,
        content_type: 'link',
        content: linkContent
      });
      
    } catch (error) {
      console.error('Link parsing error:', error);
      
      // Fallback: return basic link info
      const urlObj = new URL(url);
      const host = urlObj.hostname;
      
      return NextResponse.json({
        valid: true,
        content_type: 'link',
        content: {
          link: url,
          title: host,
          host: host,
          is_video: false
        }
      });
    }
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: true, 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: true, message: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: true, message: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: true, message: 'Method not allowed' }, { status: 405 });
}
