import { BBCodeTag, BBCodeParser as IBBCodeParser } from '@/types/blog-editor';

// Default BBCode tags configuration
export const DEFAULT_BBCODE_TAGS: BBCodeTag[] = [
  { name: 'b', template: '<strong>{param}</strong>', hasOption: false, parseContent: true },
  { name: 'i', template: '<em>{param}</em>', hasOption: false, parseContent: true },
  { name: 'u', template: '<u>{param}</u>', hasOption: false, parseContent: true },
  { name: 'url', template: '<a href="{param}" target="_blank" rel="noopener noreferrer">{param}</a>', hasOption: false, parseContent: false },
  { name: 'url', template: '<a href="{option}" target="_blank" rel="noopener noreferrer">{param}</a>', hasOption: true, parseContent: true },
  { name: 'img', template: '<img src="{param}" alt="Image" class="bbcode-img" loading="lazy" />', hasOption: false, parseContent: false },
  { name: 'code', template: '<code class="bbcode-code">{param}</code>', hasOption: false, parseContent: false },
  { name: 'code', template: '<code class="bbcode-code language-{option}">{param}</code>', hasOption: true, parseContent: false },
  { name: 'quote', template: '<blockquote class="bbcode-quote">{param}</blockquote>', hasOption: false, parseContent: true },
  { name: 'quote', template: '<blockquote class="bbcode-quote"><cite>{option}</cite>{param}</blockquote>', hasOption: true, parseContent: true },
  { name: 'goal', template: '<div class="b_goal star">{param}</div>', hasOption: false, parseContent: true },
  { name: 'goal', template: '<div class="b_goal {option}">{param}</div>', hasOption: true, parseContent: true },
  { name: 'color', template: '<span style="color: {option}">{param}</span>', hasOption: true, parseContent: true },
  { name: 'size', template: '<span style="font-size: {option}px">{param}</span>', hasOption: true, parseContent: true },
  { name: 'center', template: '<div style="text-align: center">{param}</div>', hasOption: false, parseContent: true },
  { name: 'left', template: '<div style="text-align: left">{param}</div>', hasOption: false, parseContent: true },
  { name: 'right', template: '<div style="text-align: right">{param}</div>', hasOption: false, parseContent: true }
];

export class BBCodeParser implements IBBCodeParser {
  private tags: BBCodeTag[];

  constructor(customTags: BBCodeTag[] = []) {
    this.tags = [...DEFAULT_BBCODE_TAGS, ...customTags];
  }

  getSupportedTags(): BBCodeTag[] {
    return this.tags;
  }

  parse(input: string): string {
    if (!input) return '';
    
    let parsed = input;

    // Handle text formatting shortcuts first
    parsed = this.parseTextFormatting(parsed);
    
    // Handle hashtags
    parsed = this.parseHashtags(parsed);
    
    // Handle auto-linking
    parsed = this.parseAutoLinks(parsed);
    
    // Handle BBCode tags
    parsed = this.parseBBCodeTags(parsed);
    
    // Handle line breaks
    parsed = this.parseLineBreaks(parsed);
    
    return parsed;
  }

  private parseTextFormatting(input: string): string {
    let result = input;
    
    // Bold: *text* → <strong>text</strong>
    result = result.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
    
    // Quotes: "text" → „text"
    result = result.replace(/"([^"]+)"/g, '„$1"');
    
    return result;
  }

  private parseHashtags(input: string): string {
    // Match hashtags with A-Za-z0-9-_
    return input.replace(/#([A-Za-z0-9_-]+)/g, '<span class="hashtag" data-tag="$1">#$1</span>');
  }

  private parseAutoLinks(input: string): string {
    // URL regex that matches http/https URLs
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    return input.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="auto-link">$1</a>');
  }

  private parseBBCodeTags(input: string): string {
    let result = input;
    
    // Process tags in order of complexity (with options first, then without)
    const tagsWithOptions = this.tags.filter(tag => tag.hasOption);
    const tagsWithoutOptions = this.tags.filter(tag => !tag.hasOption);
    
    // Process tags with options first
    for (const tag of tagsWithOptions) {
      result = this.processBBCodeTag(result, tag);
    }
    
    // Then process tags without options
    for (const tag of tagsWithoutOptions) {
      result = this.processBBCodeTag(result, tag);
    }
    
    return result;
  }

  private processBBCodeTag(input: string, tag: BBCodeTag): string {
    let regex: RegExp;
    
    if (tag.hasOption) {
      // [tag=option]content[/tag]
      regex = new RegExp(`\\[${tag.name}=([^\\]]+)\\]([\\s\\S]*?)\\[\\/${tag.name}\\]`, 'gi');
    } else {
      // [tag]content[/tag]
      regex = new RegExp(`\\[${tag.name}\\]([\\s\\S]*?)\\[\\/${tag.name}\\]`, 'gi');
    }

    return input.replace(regex, (match, ...args) => {
      let content: string;
      let option: string = '';

      if (tag.hasOption) {
        option = args[0];
        content = args[1];
      } else {
        content = args[0];
      }

      // Parse nested BBCode if parseContent is true
      if (tag.parseContent && content) {
        content = this.parseBBCodeTags(content);
      }

      // Apply validator if present
      if (tag.validator && !tag.validator(option, content)) {
        return match; // Return original text if validation fails
      }

      // Replace template placeholders
      let result = tag.template;
      result = result.replace(/\{param\}/g, content || '');
      result = result.replace(/\{option\}/g, option || '');

      return result;
    });
  }

  private parseLineBreaks(input: string): string {
    return input.replace(/\n/g, '<br>');
  }

  // Utility method to escape HTML in user content
  public escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Method to strip all BBCode tags and get plain text
  public getPlainText(input: string): string {
    if (!input) return '';
    
    let result = input;
    
    // Remove all BBCode tags
    result = result.replace(/\[[^\]]+\]/g, '');
    
    // Remove hashtag styling but keep the tag
    result = result.replace(/<span class="hashtag"[^>]*>(#[^<]+)<\/span>/g, '$1');
    
    // Remove HTML tags but keep content
    result = result.replace(/<[^>]+>/g, '');
    
    // Convert HTML entities back to text
    const textarea = document.createElement('textarea');
    textarea.innerHTML = result;
    result = textarea.value;
    
    return result.trim();
  }

  // Method to validate BBCode syntax
  public validateSyntax(input: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const openTags: string[] = [];
    
    // Find all BBCode tags
    const tagRegex = /\[(\/?[a-z]+)(?:=[^\]]+)?\]/gi;
    let match;
    
    while ((match = tagRegex.exec(input)) !== null) {
      const tagName = match[1].toLowerCase();
      
      if (tagName.startsWith('/')) {
        // Closing tag
        const closingTagName = tagName.substring(1);
        const lastOpenTag = openTags[openTags.length - 1];
        
        if (lastOpenTag === closingTagName) {
          openTags.pop();
        } else {
          errors.push(`Mismatched closing tag: [${tagName}]`);
        }
      } else {
        // Opening tag
        const supportedTag = this.tags.find(tag => tag.name.toLowerCase() === tagName);
        if (supportedTag) {
          openTags.push(tagName);
        } else {
          errors.push(`Unsupported tag: [${tagName}]`);
        }
      }
    }
    
    // Check for unclosed tags
    openTags.forEach(tag => {
      errors.push(`Unclosed tag: [${tag}]`);
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance for global use
export const bbcodeParser = new BBCodeParser();

// Helper functions
export function parseBBCode(input: string, customTags?: BBCodeTag[]): string {
  if (customTags) {
    const parser = new BBCodeParser(customTags);
    return parser.parse(input);
  }
  return bbcodeParser.parse(input);
}

export function getBBCodePlainText(input: string): string {
  return bbcodeParser.getPlainText(input);
}

export function validateBBCodeSyntax(input: string): { valid: boolean; errors: string[] } {
  return bbcodeParser.validateSyntax(input);
}
