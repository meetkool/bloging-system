'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { parseBBCode, getBBCodePlainText } from '@/lib/bbcode-parser';
import { EditorEvent } from '@/types/blog-editor';

interface BlogTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onEvent?: (event: EditorEvent, data?: unknown) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  autoFocus?: boolean;
  enableBBCode?: boolean;
}

export const BlogTextEditor: React.FC<BlogTextEditorProps> = ({
  value,
  onChange,
  onEvent,
  placeholder = "What's on your mind?",
  minHeight = 120,
  maxHeight = 400,
  className = '',
  autoFocus = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize functionality
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [minHeight, maxHeight]);

  // Initialize and setup
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    autoResize();
    
    if (autoFocus) {
      textarea.focus();
    }
  }, [autoResize, autoFocus]);

  // Auto-resize on content change
  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  // Insert BBCode formatting
  const insertBBCode = useCallback((tag: string, option?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);
    
    const openTag = option ? `[${tag}=${option}]` : `[${tag}]`;
    const closeTag = `[/${tag}]`;
    
    const newValue = value.substring(0, selectionStart) + openTag + selectedText + closeTag + value.substring(selectionEnd);
    onChange(newValue);
    
    // Set cursor position after the opening tag
    setTimeout(() => {
      const newPosition = selectionStart + openTag.length;
      textarea.selectionStart = newPosition;
      textarea.selectionEnd = newPosition + selectedText.length;
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  // Handle input changes
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    onEvent?.('contentChange', { value: newValue, plainText: getBBCodePlainText(newValue) });
  }, [onChange, onEvent]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.target as HTMLTextAreaElement;
    const { selectionStart, selectionEnd } = textarea;

    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const indent = '  ';
      const newValue = value.substring(0, selectionStart) + indent + value.substring(selectionEnd);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + indent.length;
      }, 0);
    }
    
    // Handle Enter key for line breaks
    else if (e.key === 'Enter' && !e.shiftKey) {
      // Let normal behavior happen for line breaks
    }
    
    // Handle Ctrl+B for bold
    else if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      insertBBCode('b');
    }
    
    // Handle Ctrl+I for italic
    else if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      insertBBCode('i');
    }
    
    // Handle Ctrl+U for underline
    else if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      insertBBCode('u');
    }
  }, [value, onChange, insertBBCode]);

  // Handle paste events
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    console.log('Paste event detected, clipboard data:', clipboardData);
    
    // Check for files first
    const files = Array.from(clipboardData.files);
    console.log('Files in clipboard:', files);
    
    if (files.length > 0) {
      e.preventDefault();
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      console.log('Image files found:', imageFiles);
      
      if (imageFiles.length > 0) {
        onEvent?.('uploadStart', { files: imageFiles });
      }
      return;
    }
    
    // Handle text paste - check for URLs
    const pastedText = clipboardData.getData('text');
    if (pastedText && isValidUrl(pastedText.trim())) {
      onEvent?.('linkDetected', { url: pastedText.trim() });
    }
  }, [onEvent]);

  // Handle composition events for IME support
  const handleCompositionStart = useCallback(() => {
    // Composition started
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const syntheticEvent = {
      target,
      currentTarget: target,
      type: 'change'
    } as React.ChangeEvent<HTMLTextAreaElement>;
    handleInput(syntheticEvent);
  }, [handleInput]);

  // Utility function to check if text is a URL
  const isValidUrl = (text: string): boolean => {
    try {
      new URL(text);
      return text.startsWith('http://') || text.startsWith('https://');
    } catch {
      return false;
    }
  };

  // Handle selection changes
  const handleSelectionChange = useCallback(() => {
    // Selection changed
  }, []);

  return (
    <div className={`blog-text-editor ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onSelect={handleSelectionChange}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        placeholder={placeholder}
        className="blog-text-editor__textarea"
        style={{ 
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          height: `${minHeight}px`
        }}
        spellCheck={true}
        autoComplete="off"
        wrap="soft"
      />
      
      {/* Character count or other status indicators could go here */}
      <div className="blog-text-editor__status">
        <span className="text-xs text-gray-500">
          {value.length} characters | {getBBCodePlainText(value).length} plain text
        </span>
      </div>
    </div>
  );
};

// Hook for using the editor with advanced features
export const useBlogTextEditor = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);
  
  const getPlainText = useCallback(() => {
    return getBBCodePlainText(value);
  }, [value]);
  
  const getParsedHTML = useCallback(() => {
    return parseBBCode(value);
  }, [value]);
  
  return {
    value,
    setValue,
    getPlainText,
    getParsedHTML
  };
};

export default BlogTextEditor;
