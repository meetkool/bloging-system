'use client';

interface BlogActionsProps {
  title: string;
  excerpt: string;
}

export default function BlogActions({ title, excerpt }: BlogActionsProps) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title,
        text: excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Link copied to clipboard!');
      });
    }
  };

  const handleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const bookmark = {
      title,
      url: window.location.href,
      date: new Date().toISOString()
    };
    
    const existingIndex = bookmarks.findIndex((b: any) => b.url === bookmark.url);
    if (existingIndex >= 0) {
      bookmarks.splice(existingIndex, 1);
      alert('Bookmark removed!');
    } else {
      bookmarks.push(bookmark);
      alert('Bookmarked!');
    }
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  };

  return (
    <>
      <button 
        className="nav-social-link" 
        aria-label="Share"
        onClick={handleShare}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3"/>
          <circle cx="6" cy="12" r="3"/>
          <circle cx="18" cy="19" r="3"/>
          <path d="m8.59 13.51 6.83 3.98"/>
          <path d="m15.41 6.51-6.82 3.98"/>
        </svg>
      </button>
      <button 
        className="nav-social-link" 
        aria-label="Bookmark"
        onClick={handleBookmark}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
        </svg>
      </button>
    </>
  );
}
