'use client';

export default function FabButton() {
  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <button
      className="legendary-fab"
      aria-label="Open in new tab with style"
      onClick={handleOpenNewTab}
      title="Open this masterpiece in a new tab"
    >
      {/* Multi-layer background animations */}
      <div className="fab-bg-layer-1"></div>
      <div className="fab-bg-layer-2"></div>
      <div className="fab-bg-layer-3"></div>
      
      {/* Ripple effects */}
      <div className="fab-ripple-1"></div>
      <div className="fab-ripple-2"></div>
      <div className="fab-ripple-3"></div>
      
      {/* Liquid flow overlay */}
      <div className="fab-liquid-overlay"></div>
      
      {/* Icon container */}
      <div className="fab-icon-container">
        <svg className="fab-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15,3 21,3 21,9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
          <circle cx="19" cy="5" r="2" stroke="none" fill="currentColor" opacity="0.8"/>
        </svg>
        
        {/* Floating particles */}
        <div className="fab-particle fab-particle-1"></div>
        <div className="fab-particle fab-particle-2"></div>
        <div className="fab-particle fab-particle-3"></div>
        <div className="fab-particle fab-particle-4"></div>
      </div>
      
      {/* Glow effect */}
      <div className="fab-glow"></div>
    </button>
  );
}
