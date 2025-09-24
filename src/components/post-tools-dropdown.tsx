'use client';

import { useState, useEffect, useRef } from 'react';
import { BlogPost } from '@/lib/github-api';

interface PostToolsDropdownProps {
  post: BlogPost;
  currentUser?: { github_username: string } | null;
  onEdit: (post: BlogPost) => void;
  onDelete: (post: BlogPost) => void;
}

export default function PostToolsDropdown({ 
  post, 
  currentUser, 
  onEdit, 
  onDelete 
}: PostToolsDropdownProps) {
  const [isVisible, setIsVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Only show tools if current user is the author
  const canEdit = currentUser?.github_username === post.author.login;
  
  // Temporarily show on all posts for visibility testing
  // if (!canEdit) return null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible]);

  const handleToggleDropdown = () => {
    setIsVisible(!isVisible);
  };

  const handleEdit = () => {
    setIsVisible(false);
    onEdit(post);
  };

  const handleDelete = () => {
    setIsVisible(false);
    onDelete(post);
  };

  return (
    <div className="post-tools-container">
      <button
        ref={buttonRef}
        className="b_tools"
        onClick={handleToggleDropdown}
        aria-label="Post options"
        aria-expanded={isVisible}
        aria-haspopup="menu"
      />
      
      {isVisible && (
        <>
          {/* Dropdown backdrop */}
          <div className="dropdown-backdrop" onClick={() => setIsVisible(false)} />
          
          {/* Dropdown menu */}
          <div
            ref={dropdownRef}
            className="b_dropdown post_tools"
            role="menu"
            aria-label="Post options"
          >
            <ul>
              <li>
                <button
                  onClick={handleEdit}
                  className="dropdown-item"
                  role="menuitem"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Post
                </button>
              </li>
              <li>
                <button
                  onClick={handleDelete}
                  className="dropdown-item delete-item"
                  role="menuitem"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete Post
                </button>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
