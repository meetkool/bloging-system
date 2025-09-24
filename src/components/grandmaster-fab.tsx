'use client';

interface GrandmasterFabProps {
  currentUrl: string;
  postTitle: string;
}

export default function GrandmasterFab({ currentUrl }: GrandmasterFabProps) {
  const handleOpenNewTab = () => {
    window.open(currentUrl, '_blank');
  };

  return (
    <div className="grandmaster-fab-container">
      <button
        className="grandmaster-fab"
        aria-label="Open in new tab - Grandmaster move!"
        onClick={handleOpenNewTab}
        title="Execute the perfect opening - new tab!"
      >
        {/* Chess board pattern background */}
        <div className="chess-board-bg"></div>
        
        {/* Knight's movement path */}
        <div className="knight-path-1"></div>
        <div className="knight-path-2"></div>
        <div className="knight-path-3"></div>
        
        {/* Rotating chess pieces shadows */}
        <div className="chess-shadow chess-shadow-queen"></div>
        <div className="chess-shadow chess-shadow-knight"></div>
        <div className="chess-shadow chess-shadow-bishop"></div>
        
        {/* Strategic liquid flow like thinking ahead */}
        <div className="strategic-flow"></div>
        
        {/* Main icon with chess piece transformation */}
        <div className="fab-icon-container">
          <div className="chess-crown"></div>
          <svg className="main-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15,3 21,3 21,9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
            <circle cx="19" cy="5" r="3" stroke="none" fill="currentColor" opacity="0.9"/>
          </svg>
          
          {/* Floating chess pieces */}
          <div className="floating-piece floating-piece-1">♛</div>
          <div className="floating-piece floating-piece-2">♞</div>
          <div className="floating-piece floating-piece-3">♝</div>
          <div className="floating-piece floating-piece-4">♜</div>
        </div>
        
        {/* Grandmaster aura */}
        <div className="grandmaster-aura"></div>
        
        {/* Victory glow */}
        <div className="victory-glow"></div>
      </button>
      
      {/* Strategic tooltip */}
      <div className="grandmaster-tooltip">
        <div className="tooltip-content">
          <span className="tooltip-text">Checkmate! Open New Tab</span>
          <div className="tooltip-subtitle">Grandmaster's Opening</div>
        </div>
        <div className="tooltip-arrow"></div>
      </div>
    </div>
  );
}
