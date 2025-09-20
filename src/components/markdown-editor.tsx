'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder, minHeight = "150px" }: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      // Reset cursor position after state update
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newValue);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  const editorClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-white flex flex-col"
    : "border rounded-lg overflow-hidden";

  return (
    <div className={editorClass}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertMarkdown('**', '**')}
            className="p-2 hover:bg-gray-200 rounded text-sm font-semibold"
            title="Bold"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('*', '*')}
            className="p-2 hover:bg-gray-200 rounded text-sm italic"
            title="Italic"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
            </svg>
          </button>
          <div className="w-px h-6 bg-gray-300"></div>
          <button
            type="button"
            onClick={() => insertMarkdown('\n## ', '')}
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Heading"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('\n- ', '')}
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="List"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('\n```\n', '\n```\n')}
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Code block"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('[', '](url)')}
            className="p-2 hover:bg-gray-200 rounded text-sm"
            title="Link"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
            </svg>
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              isPreview ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
            }`}
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-200 rounded"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className={`flex-1 ${isFullscreen ? 'min-h-0' : ''}`} style={{ minHeight }}>
        {isPreview ? (
          <div className="p-4 prose prose-sm max-w-none overflow-auto h-full">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || '*No content to preview*'}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleTabKey}
            placeholder={placeholder}
            className="w-full h-full p-4 border-none outline-none resize-none font-mono text-sm text-gray-900 bg-white"
            style={{ minHeight }}
          />
        )}
      </div>

      {/* Footer with tips */}
      <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-600">
        <span>Supports Markdown. Use </span>
        <code className="bg-gray-200 px-1 rounded">**bold**</code>
        <span>, </span>
        <code className="bg-gray-200 px-1 rounded">*italic*</code>
        <span>, </span>
        <code className="bg-gray-200 px-1 rounded">## headings</code>
        <span>, and more.</span>
      </div>
    </div>
  );
}

