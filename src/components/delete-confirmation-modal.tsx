'use client';

import { useState, useEffect, useRef } from 'react';
import { BlogPost, githubAPI } from '@/lib/github-api';

interface DeleteConfirmationModalProps {
  post: BlogPost | null;
  isVisible: boolean;
  onConfirm: (postId: string) => void;
  onCancel: () => void;
}

export default function DeleteConfirmationModal({ 
  post, 
  isVisible, 
  onConfirm, 
  onCancel 
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible && !isDeleting) {
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
  }, [isVisible, isDeleting, onCancel]);

  // Focus management - focus delete button for accessibility
  useEffect(() => {
    if (isVisible && deleteButtonRef.current) {
      deleteButtonRef.current.focus();
    }
  }, [isVisible]);

  // Reset state when modal visibility changes
  useEffect(() => {
    if (isVisible) {
      setDeleteError('');
    }
  }, [isVisible]);

  const handleConfirmDelete = async () => {
    if (!post || isDeleting) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await githubAPI.deleteBlogPost(post.id);
      onConfirm(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete post. Please try again.';
      
      // If the post is already deleted (404), still remove it from the UI
      if (errorMessage.includes('Post not found') || errorMessage.includes('404')) {
        console.log('Post already deleted on GitHub, removing from UI');
        onConfirm(post.id);
      } else {
        setDeleteError(errorMessage);
        setIsDeleting(false);
      }
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      onCancel();
    }
  };

  if (!isVisible || !post) return null;

  return (
    <div className="modal-overlay">
      <div 
        className="modal delete-confirmation-modal" 
        ref={modalRef}
        role="dialog" 
        aria-labelledby="delete-post-title"
        aria-describedby="delete-post-description"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-small">
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <h2 id="delete-post-title" className="modal-title">
                Delete Post
              </h2>
              <button
                className="modal-close"
                onClick={handleCancel}
                disabled={isDeleting}
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
              {deleteError && (
                <div className="error-alert" role="alert">
                  {deleteError}
                </div>
              )}

              {/* Confirmation Message */}
              <div id="delete-post-description" className="confirmation-message">
                <div className="warning-icon">
                  <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                <div className="message-content">
                  <h3>Are you sure you want to delete this post?</h3>
                  
                  {post.title && post.title !== 'Untitled Post' && (
                    <p className="post-title">"{post.title}"</p>
                  )}
                  
                  <p className="warning-text">
                    This post will be permanently deleted and cannot be recovered. 
                    You can also edit this post if you just want to make changes.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <div className="button-group">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleCancel}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  ref={deleteButtonRef}
                  type="button"
                  className="button button-danger"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete Post'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
