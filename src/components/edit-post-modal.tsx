'use client';

import { useState, useEffect, useRef } from 'react';
import { BlogPost, githubAPI } from '@/lib/github-api';
import GitHubGistEditor from '@/components/github-gist-editor';
import { PostData } from '@/types/blog-editor';

interface EditPostModalProps {
  post: BlogPost | null;
  isVisible: boolean;
  onSave: (updatedPost: BlogPost) => void;
  onCancel: () => void;
}

export default function EditPostModal({ 
  post, 
  isVisible, 
  onSave, 
  onCancel 
}: EditPostModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    location: '',
    privacy: 'public' as 'public' | 'private',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [editorKey, setEditorKey] = useState(0); // Force editor re-render
  const modalRef = useRef<HTMLDivElement>(null);

  // Populate form when post changes
  useEffect(() => {
    if (post && isVisible) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        location: post.location || '',
        privacy: post.privacy || 'public',
      });
      setSaveError('');
      // Force editor re-render with new key
      setEditorKey(prev => prev + 1);
    }
  }, [post, isVisible]);

  // Handle content changes from the editor
  const handleContentChange = (newContent: string) => {
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible && !isSaving) {
        onCancel();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'auto';
      };
    }
  }, [isVisible, isSaving, onCancel]);

  // Focus management
  useEffect(() => {
    if (isVisible && modalRef.current) {
      const firstFocusableElement = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      firstFocusableElement?.focus();
    }
  }, [isVisible]);

  const handleSave = async (postData: PostData) => {
    if (!post) return;

    setIsSaving(true);
    setSaveError('');

    try {
      // Use the current form data
      const updatedPost = await githubAPI.updateBlogPost(post.id, {
        title: formData.title.trim() || post.title,
        content: postData.text || formData.content,
        location: postData.location || formData.location,
        privacy: formData.privacy,
      });

      onSave(updatedPost);
    } catch (error) {
      console.error('Error updating post:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to update post. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!isSaving) {
      onCancel();
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, location: e.target.value }));
  };

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, privacy: e.target.value as 'public' | 'private' }));
  };

  if (!isVisible || !post) return null;

  return (
    <div className="modal-overlay">
      <div 
        className="modal edit-post-modal" 
        ref={modalRef}
        role="dialog" 
        aria-labelledby="edit-post-title"
        aria-modal="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <h2 id="edit-post-title" className="modal-title">
                Edit Post
              </h2>
              <button
                className="modal-close"
                onClick={handleCancel}
                disabled={isSaving}
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Error Display */}
              {saveError && (
                <div className="error-alert" role="alert">
                  {saveError}
                </div>
              )}

              {/* Post Title */}
              <div className="form-group">
                <label htmlFor="post-title" className="form-label">
                  Title
                </label>
                <input
                  id="post-title"
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className="form-input"
                  placeholder="Enter post title..."
                  disabled={isSaving}
                />
              </div>

              {/* Location */}
              <div className="form-group">
                <label htmlFor="post-location" className="form-label">
                  Location
                </label>
                <input
                  id="post-location"
                  type="text"
                  value={formData.location}
                  onChange={handleLocationChange}
                  className="form-input"
                  placeholder="Where are you?"
                  disabled={isSaving}
                />
              </div>

              {/* Privacy */}
              <div className="form-group">
                <label htmlFor="post-privacy" className="form-label">
                  Privacy
                </label>
                <select
                  id="post-privacy"
                  value={formData.privacy}
                  onChange={handlePrivacyChange}
                  className="form-input"
                  disabled={isSaving}
                >
                  <option value="public">🌍 Public - Anyone can see</option>
                  <option value="private">🔒 Private - Only you can see</option>
                </select>
              </div>

              {/* Content Editor */}
              <div className="form-group">
                <label className="form-label">Content</label>
                <GitHubGistEditor
                  key={`editor-${editorKey}`} // Force complete re-render when post changes
                  initialValue={formData.content}
                  onChange={handleContentChange}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  placeholder="What's on your mind? Use BBCode, paste images, share links..."
                  autoFocus={false}
                  showButtons={true}
                  saveButtonText={isSaving ? "Saving..." : "Save Changes"}
                  cancelButtonText="Cancel"
                  disabled={isSaving}
                  config={{
                    enableLinkPreview: true,
                    enableImageUpload: true,
                    enableDragDrop: true,
                    enableClipboardPaste: true,
                    enableBBCode: true,
                    maxFileSize: 100 * 1024 * 1024, // 100MB
                    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
