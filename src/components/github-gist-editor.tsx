'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BlogTextEditor } from './blog-text-editor';
import { ContentManager } from '../lib/content-manager';
import { UploadManager } from '../lib/upload-manager';
import { LinkParser } from '../lib/link-parser';
import { PrivacyManager, PRIVACY_OPTIONS } from '../lib/privacy-manager';
import { MetadataManager } from '../lib/metadata-manager';
import { parseBBCode } from '../lib/bbcode-parser';
import { 
  EditorConfig, 
  PostData, 
  PrivacyLevel, 
  PostMetadata,
  EditorEvent 
} from '../types/blog-editor';

// Import styles
import '../styles/blog-editor.css';

interface GitHubGistEditorProps {
  initialValue?: string;
  onSave?: (data: PostData) => Promise<void>;
  onCancel?: () => void;
  onChange?: (content: string) => void;
  config?: Partial<EditorConfig>;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  showButtons?: boolean;
  saveButtonText?: string;
  cancelButtonText?: string;
  disabled?: boolean;
}

const defaultConfig: EditorConfig = {
  apiBaseURL: '/api',
  csrfToken: '',
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  uploadEndpoint: '/api/upload',
  enableLinkPreview: true,
  enableImageUpload: true,
  enableDragDrop: true,
  enableClipboardPaste: true,
  enableBBCode: true,
  enableSyntaxHighlighting: true,
  autoResize: true,
  showProgressBar: true,
  theme: 'light'
};

export const GitHubGistEditor: React.FC<GitHubGistEditorProps> = ({
  initialValue = '',
  onSave,
  onCancel,
  onChange,
  config = {},
  className = '',
  placeholder = "What's happening?",
  autoFocus = false,
  showButtons = true,
  saveButtonText = 'Publish',
  cancelButtonText = 'Cancel',
  disabled = false
}) => {
  // State management
  const [content, setContent] = useState(initialValue);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  // Update content when initialValue changes (for editing different posts)
  useEffect(() => {
    setContent(initialValue);
    setUploadedImages([]); // Reset uploaded images when editing different posts
  }, [initialValue]);

  // Wrapper to handle both internal state and external onChange
  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    onChange?.(newContent);
  }, [onChange]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Refs for managers
  const contentManagerRef = useRef<ContentManager | null>(null);
  const uploadManagerRef = useRef<UploadManager | null>(null);
  const linkParserRef = useRef<LinkParser | null>(null);
  const privacyManagerRef = useRef<PrivacyManager | null>(null);
  const metadataManagerRef = useRef<MetadataManager | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentPreviewRef = useRef<HTMLDivElement>(null);
  
  // Merged configuration
  const editorConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);
  
  // Initialize managers
  useEffect(() => {
    // Initialize Content Manager
    contentManagerRef.current = new ContentManager();
    if (contentPreviewRef.current) {
      contentManagerRef.current.setContainer(contentPreviewRef.current);
    }
    
    // Initialize Upload Manager
    uploadManagerRef.current = new UploadManager({
      supportedTypes: editorConfig.allowedFileTypes,
      maxFileSize: editorConfig.maxFileSize,
      uploadEndpoint: editorConfig.uploadEndpoint
    });
    
    uploadManagerRef.current.onUploadStart = () => {
      setIsLoading(true);
      setUploadProgress(0);
    };
    
    uploadManagerRef.current.onUploadProgress = (progress) => {
      setUploadProgress(progress);
    };
    
    uploadManagerRef.current.onUploadComplete = (result: any) => {
      console.log('Upload completed:', result);
      setIsLoading(false);
      setUploadProgress(0);
      
      // Add the image URL to our tracked images
      if (result && (result.url || result.path)) {
        const imageUrl = result.url || result.path;
        setUploadedImages(prev => [...prev, imageUrl]);
        
        // Insert the image into the content at cursor position
        const imageMarkdown = `![${result.name || 'Image'}](${imageUrl})`;
        const newContent = content + (content ? '\n\n' : '') + imageMarkdown;
        updateContent(newContent);
      } else {
        console.error('Upload result missing URL/path:', result);
      }
      
      contentManagerRef.current?.setContent('image', result);
    };
    
    uploadManagerRef.current.onUploadError = (error: string) => {
      setIsLoading(false);
      setUploadProgress(0);
      console.error('Upload error:', error);
      setErrorMessage(error);
      // Auto-clear error after 10 seconds
      setTimeout(() => setErrorMessage(''), 10000);
    };
    
    uploadManagerRef.current.init();
    
    // Enable drag and drop on container
    if (containerRef.current && editorConfig.enableDragDrop) {
      uploadManagerRef.current.enableDragDrop(containerRef.current);
    }
    
    // Initialize Link Parser
    linkParserRef.current = new LinkParser({
      proxyURL: editorConfig.proxyURL,
      proxyAuth: editorConfig.proxyAuth
    });
    
    // Initialize Privacy Manager
    privacyManagerRef.current = new PrivacyManager();
    privacyManagerRef.current.onPrivacyChange = (level) => {
      console.log('Privacy changed to:', level);
    };
    
    // Initialize Metadata Manager
    metadataManagerRef.current = new MetadataManager();
    metadataManagerRef.current.onFieldChange = (name, value) => {
      console.log('Metadata field changed:', name, value);
    };
    
    // Get current location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        },
        () => {
          console.log('Location unavailable');
        }
      );
    }
    
    return () => {
      // Cleanup
      uploadManagerRef.current?.destroy();
      privacyManagerRef.current?.destroy();
    };
  }, [editorConfig, content, updateContent]);

  // Handle editor events
  const handleEditorEvent = useCallback(async (event: EditorEvent, data?: any) => {
    switch (event) {
      case 'contentChange':
        updateContent(data.value);
        // Auto-detect links
        if (editorConfig.enableLinkPreview && linkParserRef.current) {
          linkParserRef.current.parseText(data.value);
        }
        break;
        
      case 'uploadStart':
        if (uploadManagerRef.current && data.files) {
          // Convert array to FileList-like object if needed
          if (Array.isArray(data.files)) {
            const fileList = Object.create(FileList.prototype);
            data.files.forEach((file: File, index: number) => {
              Object.defineProperty(fileList, index, { value: file });
            });
            Object.defineProperty(fileList, 'length', { value: data.files.length });
            uploadManagerRef.current.handleFileSelect(fileList);
          } else {
            uploadManagerRef.current.handleFileSelect(data.files);
          }
        }
        break;
        
      case 'linkDetected':
        if (linkParserRef.current && editorConfig.enableLinkPreview) {
          try {
            const result = await linkParserRef.current.parseLink(data.url);
            if (result.valid && contentManagerRef.current) {
              contentManagerRef.current.setContent(result.content_type, result.content);
            }
          } catch (error) {
            console.warn('Failed to parse link:', error);
          }
        }
        break;
        
      default:
        console.log('Unhandled editor event:', event, data);
    }
  }, [editorConfig]);

  // Handle paste events for clipboard uploads
  const handlePaste = useCallback((event: React.ClipboardEvent) => {
    if (editorConfig.enableClipboardPaste && uploadManagerRef.current) {
      uploadManagerRef.current.handlePaste(event.nativeEvent);
    }
  }, [editorConfig.enableClipboardPaste, updateContent]);

  // Handle file selection
  const handleFileSelect = useCallback(() => {
    if (uploadManagerRef.current) {
      uploadManagerRef.current.selectFiles();
    }
  }, []);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    setIsLoading(true);
    
    try {
      const contentData = contentManagerRef.current?.getContentForSubmission() || {
        content_type: '',
        content: ''
      };
      const metadata = metadataManagerRef.current?.getAllMetadata() || {
        feeling: '',
        persons: '',
        location: currentLocation
      };
      const privacy = privacyManagerRef.current?.getPrivacy() || 'public';
      
      const postData: PostData = {
        text: content,
        feeling: metadata.feeling,
        persons: metadata.persons,
        location: metadata.location || currentLocation,
        content_type: contentData.content_type,
        content: contentData.content,
        privacy,
        images: uploadedImages
      };
      
      await onSave(postData);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [content, currentLocation, onSave, uploadedImages]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setUploadedImages([]); // Reset uploaded images on cancel
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Handle privacy change
  const handlePrivacyChange = useCallback((level: PrivacyLevel) => {
    privacyManagerRef.current?.setPrivacy(level);
  }, []);

  // Handle metadata field toggle
  const handleMetadataToggle = useCallback((fieldName: keyof PostMetadata) => {
    metadataManagerRef.current?.toggleField(fieldName);
    // Force re-render by updating a state
    setShowPreview(prev => prev); // Dummy update to trigger re-render
  }, []);

  // Get current privacy level
  const currentPrivacy = privacyManagerRef.current?.getPrivacy() || 'public';
  const currentPrivacyOption = PRIVACY_OPTIONS.find(opt => opt.value === currentPrivacy) || PRIVACY_OPTIONS[0];

  // Get active metadata fields
  const activeMetadataFields = metadataManagerRef.current?.getActiveFields() || [];
  const inactiveMetadataFields = metadataManagerRef.current?.getInactiveFields() || [];

  return (
    <div 
      ref={containerRef}
      className={`blog-editor ${className}`}
      onPaste={handlePaste}
    >
      {/* Main Editor Area */}
      <div className="blog-editor__main">
        <BlogTextEditor
          value={content}
          onChange={updateContent}
          onEvent={handleEditorEvent}
          placeholder={placeholder}
          autoFocus={autoFocus}
          enableBBCode={editorConfig.enableBBCode}
        />
        
        {/* Content Preview */}
        <div ref={contentPreviewRef} className="blog-editor__content-preview" />
        
        {/* Upload Progress */}
        {isLoading && (
          <div className="blog-editor__progress-container">
            {uploadProgress > 0 ? (
              <>
                <div className="blog-editor__progress">
                  <div 
                    className="blog-editor__progress-bar" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="blog-editor__progress-text">
                  Uploading... {Math.round(uploadProgress)}%
                </div>
              </>
            ) : (
              <div className="blog-editor__loading">
                <div className="blog-editor__loading-dots">
                  <div></div>
                  <div></div>
                  <div></div>
                </div>
                <div className="blog-editor__loading-text">
                  Preparing upload...
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Error Message */}
        {errorMessage && (
          <div className="blog-editor__error">
            <div className="error-content">
              <div className="error-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
              </div>
              <div className="error-message">
                <strong>Upload Failed:</strong> {errorMessage}
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="error-close"
                title="Dismiss"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Fields */}
      {activeMetadataFields.length > 0 && (
        <div className="blog-editor__metadata">
          <div className="blog-editor__metadata-table">
            {activeMetadataFields.map(field => (
              <div key={field.name} className="metadata-field-row">
                <div className="metadata-field-label">
                  <div className="metadata-icon">
                    {field.name === 'feeling' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                      </svg>
                    )}
                    {field.name === 'persons' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25Z"/>
                      </svg>
                    )}
                    {field.name === 'location' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
                      </svg>
                    )}
                  </div>
                  <span>{field.label}</span>
                </div>
                <div className="metadata-field-input">
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={metadataManagerRef.current?.getField(field.name) || ''}
                    onChange={(e) => metadataManagerRef.current?.setField(field.name, e.target.value)}
                    className="metadata-input"
                  />
                  <button
                    type="button"
                    onClick={() => handleMetadataToggle(field.name)}
                    className="metadata-clear-btn"
                    title="Clear field"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="blog-editor__toolbar">
        <div className="flex items-center gap-2">
          {/* Upload Image Button */}
          {editorConfig.enableImageUpload && (
            <button
              type="button"
              onClick={handleFileSelect}
              className="blog-editor__toolbar-item"
              title="Upload image"
              disabled={isLoading || disabled}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
            </button>
          )}
          
          {/* Metadata Toggle Buttons */}
          {inactiveMetadataFields.map(field => (
            <button
              key={field.name}
              type="button"
              onClick={() => handleMetadataToggle(field.name)}
              className="metadata-toolbar-btn"
              title={`Add ${field.label.toLowerCase()}`}
            >
              <div className="metadata-icon">
                {field.name === 'feeling' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                  </svg>
                )}
                {field.name === 'persons' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25Z"/>
                  </svg>
                )}
                {field.name === 'location' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/>
                  </svg>
                )}
              </div>
            </button>
          ))}
          
          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`blog-editor__toolbar-item ${showPreview ? 'blog-editor__toolbar-item--active' : ''}`}
            title="Toggle preview"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
            </svg>
          </button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Privacy Selector */}
          <div className="blog-editor__privacy">
            <button
              type="button"
              onClick={() => {
                // Toggle privacy dropdown
                const dropdown = document.querySelector('.blog-editor__privacy-dropdown') as HTMLElement;
                if (dropdown) {
                  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                }
              }}
              className="blog-editor__privacy-trigger"
            >
              <div className="privacy-trigger-content">
                <div className="privacy-icon">
                  {currentPrivacyOption.value === 'public' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                    </svg>
                  )}
                  {currentPrivacyOption.value === 'friends' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25Z"/>
                    </svg>
                  )}
                  {currentPrivacyOption.value === 'private' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                    </svg>
                  )}
                </div>
                <span className="privacy-label">{currentPrivacyOption.label}</span>
                <svg className="privacy-arrow" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
            </button>
            
            <div className="blog-editor__privacy-dropdown" style={{ display: 'none' }}>
              {PRIVACY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    handlePrivacyChange(option.value);
                    const dropdown = document.querySelector('.blog-editor__privacy-dropdown') as HTMLElement;
                    if (dropdown) dropdown.style.display = 'none';
                  }}
                  className={`privacy-option ${option.value === currentPrivacy ? 'active' : ''}`}
                >
                  <div className="privacy-option-content">
                    <div className="privacy-icon">
                      {option.value === 'public' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
                        </svg>
                      )}
                      {option.value === 'friends' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25Z"/>
                        </svg>
                      )}
                      {option.value === 'private' && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                        </svg>
                      )}
                    </div>
                    <div className="privacy-option-text">
                      <div className="privacy-option-label">{option.label}</div>
                      <div className="privacy-option-description">
                        {option.value === 'public' && 'Anyone can see this post'}
                        {option.value === 'friends' && 'Only your friends can see this'}
                        {option.value === 'private' && 'Only you can see this post'}
                      </div>
                    </div>
                    {option.value === currentPrivacy && (
                      <div className="privacy-check">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {showButtons && onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="blog-editor-btn blog-editor-btn--ghost"
              disabled={isLoading || disabled}
            >
              {cancelButtonText}
            </button>
          )}
          
          {showButtons && onSave && (
            <button
              type="button"
              onClick={handleSave}
              className="blog-editor-btn blog-editor-btn--primary"
              disabled={isLoading || disabled || !content.trim()}
            >
              {isLoading ? 'Publishing...' : saveButtonText}
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="blog-editor-modal-backdrop">
          <div className="blog-editor-modal">
            <div className="blog-editor-modal__header">
              <h3 className="blog-editor-modal__title">Preview</h3>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="blog-editor-modal__close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="blog-editor-modal__body p-6">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: parseBBCode(content) }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubGistEditor;
