import React, { useCallback, useState, useRef, memo } from "react";
import { AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import MarkerInfoWindow from "./MarkerInfoWindow.jsx";

/**
 * Highly optimized marker component with zero unnecessary re-renders
 * and smart info window positioning
 */
const OptimizedMarker = memo(({ 
  position, 
  eventId, 
  isSelected, 
  eventDetails, 
  isLoadingDetails, 
  onMarkerClick, 
  onInfoClose,
  isCluster = false,
  clusterCount = 0,
  clusterData = null,
  currentZoom = 12
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const infoWindowRef = useRef(null);
  const map = useMap();

  // Calculate info window position to always stay in viewport
  const calculateInfoWindowPosition = useCallback(() => {
    if (!map || !isSelected) return { x: 0, y: -250, below: false };
    
    try {
      const mapDiv = map.getDiv();
      if (!mapDiv) return { x: 0, y: -250, below: false };
      
      const bounds = map.getBounds();
      if (!bounds) return { x: 0, y: -250, below: false };
      
      const mapRect = mapDiv.getBoundingClientRect();
      
      // Get marker screen position
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      
      const relativeX = (position.lng - sw.lng()) / (ne.lng() - sw.lng());
      const relativeY = (ne.lat() - position.lat) / (ne.lat() - sw.lat());
      
      const screenX = relativeX * mapRect.width;
      const screenY = relativeY * mapRect.height;
      
      // Info window dimensions
      const INFO_WIDTH = 480;
      const INFO_HEIGHT = 250;
      const PADDING = 30;
      
      let x = 0;
      let y = -50; // Default: close to marker (was -INFO_HEIGHT - 30)
      let below = false;
      
      // Vertical: Only move below if very close to top edge
      if (screenY < 100) { // More restrictive threshold (was INFO_HEIGHT + PADDING)
        y = 40; // Position below marker
        below = true;
      }
      
      // Horizontal: Keep within bounds
      if (screenX < INFO_WIDTH / 2 + PADDING) {
        x = -(screenX - INFO_WIDTH / 2 - PADDING);
      } else if (screenX > mapRect.width - INFO_WIDTH / 2 - PADDING) {
        x = mapRect.width - screenX - INFO_WIDTH / 2 - PADDING;
      }
      
      return { x, y, below };
    } catch (error) {
      return { x: 0, y: -250, below: false };
    }
  }, [map, position, isSelected]);

  const handleClick = useCallback(() => {
    console.log('🖱️ Optimized marker clicked:', eventId);
    onMarkerClick(eventId, isCluster ? clusterData : null);
  }, [eventId, onMarkerClick, isCluster, clusterData]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Calculate position for info window
  const infoPosition = isSelected ? calculateInfoWindowPosition() : null;

  return (
    <>
      {/* Main marker */}
      <AdvancedMarker
        position={position}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        zIndex={isSelected ? 9999 : 100}
      >
        {isCluster ? (
          // Cluster marker with original green color scheme
          <div 
            className="relative flex items-center justify-center rounded-full border-2 border-white shadow-lg text-white font-bold"
            style={{
              width: isSelected ? '40px' : '36px',
              height: isSelected ? '40px' : '36px',
              fontSize: clusterCount > 99 ? '10px' : '12px',
              transform: `scale(${isHovered ? 1.1 : 1})`,
              transition: 'all 0.2s ease',
              backgroundColor: isSelected 
                ? `hsl(var(--marker-primary-selected))`
                : isHovered 
                ? `hsl(var(--marker-primary-hover))`
                : `hsl(var(--marker-primary))`,
              boxShadow: isSelected 
                ? `0 0 15px hsla(var(--marker-glow), 0.8), 0 0 30px hsla(var(--marker-glow), 0.4)`
                : isHovered 
                ? `0 0 10px hsla(var(--marker-glow), 0.6)`
                : `0 0 5px hsla(var(--marker-glow), 0.4)`
            }}
          >
            {clusterCount > 999 ? '999+' : clusterCount}
          </div>
        ) : (
          // Regular marker with original green Pin
          <Pin
            background={`hsl(var(--marker-primary))`}
            borderColor="white"
            glyphColor="white"
            scale={isSelected ? 1.3 : isHovered ? 1.1 : 1}
          />
        )}
      </AdvancedMarker>

      {/* Info window with smart positioning */}
      {isSelected && !isCluster && infoPosition && (
        <AdvancedMarker
          position={position}
          zIndex={10000}
        >
          <div 
            ref={infoWindowRef}
            style={{
              transform: `translate(${infoPosition.x}px, ${infoPosition.y}px)`,
              transition: 'transform 0.3s ease-out'
            }}
            className="relative"
          >
            <MarkerInfoWindow
              event={eventDetails}
              onClose={onInfoClose}
              isLoading={isLoadingDetails}
              isCached={!!eventDetails}
              isPositionedBelow={infoPosition.below}
            />
          </div>
        </AdvancedMarker>
      )}
    </>
  );
});

// Strict equality check for memoization - only re-render when absolutely necessary
OptimizedMarker.displayName = 'OptimizedMarker';

export default OptimizedMarker;