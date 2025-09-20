'use client';

interface ShareButtonsProps {
  title: string;
}

export default function ShareButtons({ title }: ShareButtonsProps) {
  const handleTwitterShare = () => {
    const url = window.location.href;
    const text = `Check out this article: ${title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleLinkedInShare = () => {
    const url = window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Link copied to clipboard!');
    });
  };

  return (
    <div className="share-buttons">
      <button 
        className="share-btn twitter"
        onClick={handleTwitterShare}
        aria-label="Share on Twitter"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
        </svg>
        Twitter
      </button>
      <button 
        className="share-btn linkedin"
        onClick={handleLinkedInShare}
        aria-label="Share on LinkedIn"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
        LinkedIn
      </button>
      <button 
        className="share-btn copy"
        onClick={handleCopyLink}
        aria-label="Copy link"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
        </svg>
        Copy Link
      </button>
    </div>
  );
}
