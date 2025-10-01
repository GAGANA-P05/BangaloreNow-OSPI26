import React, { useEffect, useCallback, useRef } from 'react';
import { APIProvider, Map, useMap, useApiLoadingStatus, useApiIsLoaded } from '@vis.gl/react-google-maps';
import { MapStateProvider, useMapState } from './MapStateProvider.jsx';
import OptimizedMarker from './OptimizedMarker.jsx';
import MapErrorBoundary from './MapErrorBoundary.jsx';
import Navbar from './Navbar.jsx';

// Loading component
const LoadingOverlay = () => {
  const apiLoadingStatus = useApiLoadingStatus();
  const apiIsLoaded = useApiIsLoaded();

  if (apiIsLoaded) return null;

  const getLoadingMessage = () => {
    switch (apiLoadingStatus) {
      case 'LOADING':
        return 'Loading Google Maps...';
      case 'LOADED':
        return 'Maps loaded, initializing...';
      case 'FAILED':
        return 'Failed to load Maps - Check API key';
      default:
        return 'Initializing...';
    }
  };

  return (
    <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="text-foreground font-medium">{getLoadingMessage()}</p>
        {apiLoadingStatus === 'LOADING' && (
          <p className="text-muted-foreground text-sm">Please wait while we load the map...</p>
        )}
        {apiLoadingStatus === 'FAILED' && (
          <p className="text-red-500 text-sm">Please check your internet connection and API key</p>
        )}
      </div>
    </div>
  );
};

// Inner map component with access to map instance
const MapContent = () => {
  const map = useMap();
  const {
    events,
    isLoadingEvents,
    selectedEventId,
    selectedEventDetails,
    isLoadingDetails,
    currentZoom,
    handleMarkerClick,
    handleInfoClose,
    updateBounds,
    setIsMapMoving,
    updateZoom
  } = useMapState();

  const dragTimeoutRef = useRef(null);
  const zoomTimeoutRef = useRef(null);

  // Handle cluster expansion with proper centering
  const handleClusterExpansion = useCallback(async (eventId, clusterData) => {
    const result = await handleMarkerClick(eventId, clusterData);
    
    if (result?.action === 'expandCluster' && map) {
      const cluster = result.data;
      console.log(`🔍 Expanding cluster with ${cluster.count} events:`, cluster.events);
      
      if (!cluster.events || cluster.events.length === 0) {
        console.error('❌ No events in cluster');
        return;
      }
      
      // Create bounds from cluster events
      const bounds = new window.google.maps.LatLngBounds();
      let validEvents = 0;
      
      cluster.events.forEach(event => {
        const lat = Number(event.lat);
        const lng = Number(event.long);
        console.log(`📍 Event coordinates: ${lat}, ${lng}`);
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend(new window.google.maps.LatLng(lat, lng));
          validEvents++;
        }
      });
      
      if (validEvents === 0) {
        console.error('❌ No valid coordinates in cluster');
        return;
      }
      
      // Calculate center of cluster
      const center = bounds.getCenter();
      
      // Zoom aggressively to break clusters apart
      const currentZoom = map.getZoom();
      const targetZoom = Math.max(14, currentZoom + 3); // Ensure we reach zoom 14+ to disable clustering
      
      console.log(`🎯 Zooming from ${currentZoom} to ${targetZoom} to break cluster`);
      map.setCenter(center);
      map.setZoom(targetZoom);
    }
  }, [handleMarkerClick, map]);

  // Optimized bounds handling - no marker refresh triggers
  const handleBoundsChanged = useCallback(() => {
    if (!map) return;
    
    const bounds = map.getBounds();
    if (bounds) {
      const boundsObj = {
        north: bounds.getNorthEast().lat(),
        south: bounds.getSouthWest().lat(),
        east: bounds.getNorthEast().lng(),
        west: bounds.getSouthWest().lng()
      };
      
      updateBounds(boundsObj);
    }
  }, [map, updateBounds]);

  // Movement handlers that don't affect markers
  const handleDragStart = useCallback(() => {
    console.log('🖱️ Drag start');
    setIsMapMoving(true);
    
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  }, [setIsMapMoving]);

  const handleDragEnd = useCallback(() => {
    console.log('✋ Drag end');
    
    dragTimeoutRef.current = setTimeout(() => {
      setIsMapMoving(false);
      handleBoundsChanged();
    }, 500);
  }, [setIsMapMoving, handleBoundsChanged]);

  const handleZoomChanged = useCallback(() => {
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    
    zoomTimeoutRef.current = setTimeout(() => {
      const newZoom = map.getZoom();
      updateZoom(newZoom);
      handleBoundsChanged();
    }, 300);
  }, [map, updateZoom, handleBoundsChanged]);

  // Set up event listeners
  useEffect(() => {
    if (!map) return;
    
    const dragStartListener = map.addListener('dragstart', handleDragStart);
    const dragEndListener = map.addListener('dragend', handleDragEnd);
    const zoomChangedListener = map.addListener('zoom_changed', handleZoomChanged);
    
    // Initial bounds setup
    const idleListener = map.addListener('idle', () => {
      google.maps.event.removeListener(idleListener);
      handleBoundsChanged();
    });
    
    return () => {
      google.maps.event.removeListener(dragStartListener);
      google.maps.event.removeListener(dragEndListener);
      google.maps.event.removeListener(zoomChangedListener);
      
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
    };
  }, [map, handleDragStart, handleDragEnd, handleZoomChanged, handleBoundsChanged]);

  return (
    <>
      {/* Render markers - completely isolated from state changes */}
      {!isLoadingEvents && events.map((event) => (
        <OptimizedMarker
          key={event.id}
          position={event.position}
          eventId={event.id}
          isSelected={selectedEventId === event.id}
          eventDetails={selectedEventDetails}
          isLoadingDetails={isLoadingDetails}
          onMarkerClick={handleClusterExpansion}
          onInfoClose={handleInfoClose}
          isCluster={event.isCluster}
          clusterCount={event.count}
          clusterData={event}
        />
      ))}
    </>
  );
};

// Main component
const OptimizedMapComponent = () => {
  const defaultCenter = { lat: 12.9716, lng: 77.5946 };
  
  // Bangalore city boundaries  
  const bangaloreBounds = {
    north: 13.15,
    south: 12.75,
    east: 77.85,
    west: 77.35
  };
  
  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    zoomControlOptions: {
      position: window.google?.maps?.ControlPosition?.RIGHT_CENTER,
    },
    gestureHandling: 'greedy',
    backgroundColor: 'rgb(17, 24, 39)',
    styles: [], // Keep empty when using mapId
    tilt: 0, // Disable 3D tilt for faster rendering
    restriction: {
      latLngBounds: bangaloreBounds,
      strictBounds: false
    },
    renderingType: 'RASTER', // Use raster tiles for faster loading
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    minZoom: 10,
    maxZoom: 20
  };

  return (
    <MapStateProvider>
      <div className="w-full h-screen bg-gray-900 relative">
        <APIProvider 
          apiKey="AIzaSyCTWEDs6_36PKstsj2jfzZzs4TqxquA1RA"
          libraries={['marker', 'geometry']}
        >
          <MapErrorBoundary>
            <LoadingOverlay />
            <Map
              defaultCenter={defaultCenter}
              defaultZoom={12}
              options={mapOptions}
              className="w-full h-full"
              mapId="da06caae89cc4238b61f553a"
              colorScheme="DARK"
            >
              <MapContent />
            </Map>
            <Navbar />
          </MapErrorBoundary>
        </APIProvider>
      </div>
    </MapStateProvider>
  );
};

export default OptimizedMapComponent;