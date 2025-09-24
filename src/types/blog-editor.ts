export interface PostData {
  text: string;
  location?: string;
  feeling?: string;
  persons?: string;
  content_type?: string;
  content?: string;
  privacy?: PrivacyLevel;
  images?: string[];
}

export type EditorEvent = 'contentChange' | 'uploadStart' | 'linkDetected';

export type PrivacyLevel = 'public' | 'friends' | 'private';

export interface PrivacyOption {
  value: PrivacyLevel;
  label: string;
  icon: string;
}

export interface PostMetadata {
  feeling: string;
  persons: string;
  location: string;
}

export interface MetadataField {
  name: keyof PostMetadata;
  label: string;
  icon: string;
  placeholder: string;
  isActive: boolean;
}

export interface EditorConfig {
  apiBaseURL: string;
  csrfToken: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  uploadEndpoint: string;
  enableLinkPreview: boolean;
  enableImageUpload: boolean;
  enableDragDrop: boolean;
  enableClipboardPaste: boolean;
  enableBBCode: boolean;
  enableSyntaxHighlighting: boolean;
  autoResize: boolean;
  showProgressBar: boolean;
  theme: string;
  proxyURL?: string;
  proxyAuth?: string;
}

// Manager interfaces
export interface PrivacyManager {
  currentPrivacy: PrivacyLevel;
  options: PrivacyOption[];
  onPrivacyChange: (level: PrivacyLevel) => void;
  setPrivacy(level: PrivacyLevel): void;
  getPrivacy(): PrivacyLevel;
  renderDropdown(): HTMLElement;
}

export interface MetadataManager {
  fields: Map<keyof PostMetadata, MetadataField>;
  onFieldChange: (name: keyof PostMetadata, value: string) => void;
  setField(name: keyof PostMetadata, value: string): void;
  getField(name: keyof PostMetadata): string;
  clearField(name: keyof PostMetadata): void;
  toggleField(name: keyof PostMetadata): void;
  getAllMetadata(): PostMetadata;
  setAllMetadata(metadata: Partial<PostMetadata>): void;
}

export interface BBCodeTag {
  name: string;
  template: string;
  hasOption: boolean;
  parseContent: boolean;
  validator?: (param: string, content: string) => boolean;
}

export interface BBCodeParser {
  getSupportedTags(): BBCodeTag[];
  parse(input: string): string;
}

// Content types
export type ContentType = 'link' | 'img_link' | 'image';

export interface LinkContent {
  link: string;
  title: string;
  host: string;
  thumb?: string;
  desc?: string;
  is_video?: boolean;
}

export interface ImageLinkContent {
  src: string;
  host: string;
}

export interface ImageContent {
  path: string;
  name: string;
  type: string;
  thumb?: string;
}

export interface ContentData {
  type: ContentType;
  data: LinkContent | ImageLinkContent | ImageContent;
}

export interface ContentManager {
  currentContent: ContentData | null;
  isContentSet: boolean;
  setContent(type: ContentType, data: unknown): void;
  getContentType(): ContentType | null;
  getContentData(): unknown;
}

export interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  [key: string]: string | undefined;
}

export interface LinkParseResult {
  valid: boolean;
  content_type: ContentType;
  content: LinkContent | ImageLinkContent | ImageContent;
}

export interface LinkParser {
  ignoredLinks: string[];
  parseLink(url: string): Promise<LinkParseResult>;
  getCachedResult(url: string): LinkParseResult | undefined;
}

export interface FileDropHandler {
  element: HTMLElement;
  callback: (file: File) => void;
  init(): void;
}

export interface UploadManager {
  supportedTypes: string[];
  maxFileSize: number;
  uploadEndpoint: string;
  onUploadStart: () => void;
  onUploadProgress: (progress: number) => void;
  onUploadComplete: (data: ImageContent) => void;
  onUploadError: (error: string) => void;
  enableDragDrop(element: HTMLElement): void;
  handleFileSelect(files: FileList): void;
}