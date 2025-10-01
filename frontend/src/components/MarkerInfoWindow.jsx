import React, { memo, useState, useCallback, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';

const MarkerInfoWindow = memo(({ event, onClose, isLoading, isCached, isPositionedBelow = false }) => {
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  const handleImageClick = useCallback(() => {
    if (event?.image) {
      setIsImagePreviewOpen(true);
    }
  }, [event?.image]);

  const handleCloseImagePreview = useCallback(() => {
    setIsImagePreviewOpen(false);
  }, []);

  // Close image preview when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isImagePreviewOpen && e.target.classList.contains('image-preview-backdrop')) {
        handleCloseImagePreview();
      }
    };

    if (isImagePreviewOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isImagePreviewOpen, handleCloseImagePreview]);
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="relative">
      {/* Dynamic arrow positioning based on info window position */}
      <div 
        className={`absolute left-1/2 transform -translate-x-1/2 z-[10002] ${
          isPositionedBelow ? '-top-2' : '-bottom-2'
        }`}
      >
        <div 
          className={`w-4 h-4 transform ${isPositionedBelow ? 'rotate-45' : 'rotate-[225deg]'}`}
          style={{
            backgroundColor: `hsl(var(--marker-background))`,
            borderLeft: `1px solid hsl(var(--marker-border))`,
            borderTop: `1px solid hsl(var(--marker-border))`
          }}
        />
      </div>
      
      <div 
        className="rounded-lg shadow-2xl relative z-[10001] translate-y-2"
        style={{
          backgroundColor: `hsl(var(--marker-background))`,
          borderColor: `hsl(var(--marker-border))`,
          borderWidth: '1px',
          minWidth: '420px',
          maxWidth: '500px',
          width: '480px' // Fixed width for consistent layout
        }}
      >
        <div className="p-4">
        {/* Header with close button */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            {isLoading && !event && (
              <span 
                className="text-xs px-2 py-1 rounded-full border transition-colors duration-200"
                style={{
                  color: `hsl(var(--marker-text-primary))`,
                  backgroundColor: `hsla(var(--marker-accent), 0.1)`,
                  borderColor: `hsl(var(--marker-border))`
                }}
              >
                ⏳ Loading...
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-xl font-bold transition-colors duration-200 hover:scale-110 transform"
            style={{
              color: `hsl(var(--marker-text-muted))`,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = `hsl(var(--marker-text-secondary))`;
              e.target.style.cursor = 'pointer';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = `hsl(var(--marker-text-muted))`;
              e.target.style.cursor = 'pointer';
            }}
          >
            ×
          </button>
        </div>

        {isLoading && !event ? (
          // Only show loading spinner when we actually need to load and have no data
          <div className="flex items-center justify-center py-8">
            <div 
              className="animate-spin rounded-full h-8 w-8 border-2 border-solid border-transparent"
              style={{
                borderTopColor: `hsl(var(--marker-accent))`,
                borderRightColor: `hsl(var(--marker-accent))`
              }}
            />
            <span className="ml-2 text-sm" style={{color: `hsl(var(--marker-text-muted))`}}>
              Loading event details...
            </span>
          </div>
        ) : event ? (
          <div className="flex space-x-4 min-h-[140px]">
            {/* Left Side - Image (35% width) - Larger and Clickable */}
            {event.image && (
              <div 
                className="flex-shrink-0 rounded-lg overflow-hidden border hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative"
                style={{
                  backgroundColor: `hsl(var(--marker-surface))`,
                  borderColor: `hsl(var(--marker-border))`,
                  width: '40%', // Increased from 35% to 40%
                  minWidth: '160px', // Increased from 140px
                  height: '140px', // Increased from 120px
                  cursor: 'pointer'
                }}
                onClick={handleImageClick}
                title="Click to view larger image"
              >
                <img
                  src={event.image}
                  alt={event.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity duration-200"
                  style={{ cursor: 'pointer' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                {/* Overlay icon to indicate clickability */}
                <div 
                  className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-20"
                  style={{ cursor: 'pointer', pointerEvents: 'none' }}
                >
                  <svg 
                    className="w-6 h-6 text-white"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ pointerEvents: 'none' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Right Side - Content (60% width) */}
            <div 
              className="space-y-3 overflow-hidden"
              style={{
                width: event.image ? '60%' : '100%', // 60% when image present (40% + 60% = 100%), 100% when no image
                minWidth: 0 // Allow shrinking
              }}
            >
              {/* Event Title - Clickable if URL exists */}
              <div className="mb-2">
                {event.url ? (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold transition-colors duration-200 hover:underline text-sm leading-tight block truncate"
                    style={{
                      color: `hsl(var(--marker-accent))`,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = `hsl(var(--marker-primary-hover))`;
                      e.target.style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = `hsl(var(--marker-accent))`;
                      e.target.style.cursor = 'pointer';
                    }}
                    title={event.name}
                  >
                    {event.name}
                  </a>
                ) : (
                  <h3 
                    className="font-semibold text-sm leading-tight truncate"
                    style={{
                      color: `hsl(var(--marker-text-primary))`
                    }}
                    title={event.name}
                  >
                    {event.name}
                  </h3>
                )}
              </div>

              {/* Event Description */}
              {event.description && (
                <>
                  <div className="mb-2">
                    <p 
                      className="text-xs leading-relaxed line-clamp-2 break-words"
                      style={{
                        color: `hsl(var(--marker-text-secondary))`,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                      }}
                    >
                      {event.description}
                    </p>
                  </div>
                  <Separator className="my-2" style={{ backgroundColor: `hsl(var(--marker-border))` }} />
                </>
              )}

              {/* Event Dates */}
              {(event.startDate || event.endDate) && (
                <>
                  <div className="mb-2">
                    {event.startDate && (
                      <div className="text-xs">
                        <span 
                          className="font-medium"
                          style={{
                            color: `hsl(var(--marker-text-muted))`
                          }}
                        >
                          📅
                        </span>
                        <span 
                          className="ml-1 break-words"
                          style={{
                            color: `hsl(var(--marker-text-secondary))`,
                            wordWrap: 'break-word'
                          }}
                        >
                          {formatDate(event.startDate)}
                        </span>
                      </div>
                    )}
                  </div>
                  <Separator className="my-2" style={{ backgroundColor: `hsl(var(--marker-border))` }} />
                </>
              )}

              {/* Venue and Address - Compact */}
              {(event.venue || event.address) && (
                <div className="space-y-1">
                  {event.venue && (
                    <div className="text-xs">
                      <span 
                        className="font-medium"
                        style={{
                          color: `hsl(var(--marker-text-muted))`
                        }}
                      >
                        📍
                      </span>
                      <span 
                        className="ml-1 break-words"
                        style={{
                          color: `hsl(var(--marker-text-secondary))`,
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        {event.venue}
                      </span>
                    </div>
                  )}
                  
                  {event.address && (
                    <div className="text-xs">
                      <span 
                        className="ml-3 break-words block"
                        style={{
                          color: `hsl(var(--marker-text-secondary))`,
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                        title={event.address}
                      >
                        {event.address}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div 
            className="text-center py-4"
            style={{
              color: `hsl(0 62.8% 50.6%)`  /* Error red color */
            }}
          >
            Failed to load event details
          </div>
        )}
        </div>
      </div>

      {/* Image Preview Modal */}
      {isImagePreviewOpen && event?.image && (
        <div 
          className="image-preview-backdrop fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black bg-opacity-80 animate-in fade-in-0 duration-200"
          style={{ backdropFilter: 'blur(4px)' }}
        >
          <div className="relative flex items-center justify-center animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={handleCloseImagePreview}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 z-[20001]"
              style={{ cursor: 'pointer' }}
              title="Close preview"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Properly sized and centered image */}
            <img
              src={event.image}
              alt={event.name}
              className="object-contain rounded-lg shadow-2xl block"
              style={{
                maxWidth: '45vw', // Reduced from 90vw to 45vw (half size)
                maxHeight: '45vh', // Reduced from 90vh to 45vh (half size)
                width: 'auto',
                height: 'auto'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                handleCloseImagePreview();
              }}
            />
            
            {/* Image caption */}
            {event.name && (
              <div 
                className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-4 rounded-b-lg"
                style={{ backdropFilter: 'blur(8px)' }}
              >
                <p className="text-sm font-medium truncate">{event.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default MarkerInfoWindow;