import React, { createContext, useContext, useCallback, useRef, useState, useMemo } from 'react';

/**
 * Isolated state management for map interactions
 * Prevents cascading re-renders and prop drilling
 */
const MapStateContext = createContext();

export const useMapState = () => {
  const context = useContext(MapStateContext);
  if (!context) {
    throw new Error('useMapState must be used within MapStateProvider');
  }
  return context;
};

export const MapStateProvider = ({ children }) => {
  // Core marker data - only changes on API calls
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  
  // Selection state - isolated to prevent marker re-renders
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventDetailsCache, setEventDetailsCache] = useState({});
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Map movement state - completely isolated
  const [isMapMoving, setIsMapMoving] = useState(false);
  
  // Zoom tracking for clustering
  const [currentZoom, setCurrentZoom] = useState(12);
  
  // Refs to prevent state dependencies
  const mapBoundsRef = useRef(null);
  const lastRefreshBoundsRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const hasInitialLoadRef = useRef(false);
  
  // Stable event processing with zoom-based clustering
  const processedEvents = useMemo(() => {
    if (!events.length) return [];
    
    // Disable clustering at much lower zoom levels for easier splitting
    if (currentZoom >= 14) {
      console.log(`🚫 Clustering disabled at zoom ${currentZoom} - showing ${events.length} individual markers`);
      return events.map(event => ({
        ...event,
        position: { lat: Number(event.lat), lng: Number(event.long) },
        isCluster: false
      }));
    }
    
    // Dynamic clustering distance based on zoom - much more aggressive
    const getClusterDistance = (zoom) => {
      if (zoom >= 13) return 0.003;  // Very small clusters 
      if (zoom >= 12) return 0.006;  // Small clusters
      if (zoom >= 11) return 0.010;  // Medium clusters  
      return 0.015;                  // Large clusters at very low zoom
    };
    
    const CLUSTER_DISTANCE = getClusterDistance(currentZoom);
    const clusters = [];
    const processed = new Set();
    
    events.forEach((event, i) => {
      if (processed.has(i)) return;
      
      const nearby = [event];
      processed.add(i);
      
      for (let j = i + 1; j < events.length; j++) {
        if (processed.has(j)) continue;
        
        const other = events[j];
        const latDiff = Math.abs(Number(event.lat) - Number(other.lat));
        const lngDiff = Math.abs(Number(event.long) - Number(other.long));
        
        if (latDiff < CLUSTER_DISTANCE && lngDiff < CLUSTER_DISTANCE) {
          nearby.push(other);
          processed.add(j);
        }
      }
      
      if (nearby.length > 1) {
        // Create cluster
        const avgLat = nearby.reduce((sum, e) => sum + Number(e.lat), 0) / nearby.length;
        const avgLng = nearby.reduce((sum, e) => sum + Number(e.long), 0) / nearby.length;
        
        console.log(`🔗 Creating cluster with ${nearby.length} events at zoom ${currentZoom}`);
        
        clusters.push({
          id: `cluster-${i}`,
          lat: avgLat,
          long: avgLng,
          position: { lat: avgLat, lng: avgLng },
          isCluster: true,
          count: nearby.length,
          events: nearby
        });
      } else {
        // Single event
        clusters.push({
          ...event,
          position: { lat: Number(event.lat), lng: Number(event.long) },
          isCluster: false
        });
      }
    });
    
    return clusters;
  }, [events, currentZoom]);
  
  // API functions
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoadingEvents(true);
      const response = await fetch('http://127.0.0.1:8000/api/get-all-events');
      const data = await response.json();
      setEvents(data);
      console.log(`✅ Loaded ${data.length} events`);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);
  
  const fetchEventDetails = useCallback(async (eventId) => {
    if (eventDetailsCache[eventId]) {
      return eventDetailsCache[eventId];
    }
    
    try {
      setIsLoadingDetails(true);
      const response = await fetch(`http://127.0.0.1:8000/api/get-event-details/${eventId}`);
      const data = await response.json();
      
      setEventDetailsCache(prev => ({ ...prev, [eventId]: data }));
      return data;
    } catch (error) {
      console.error('Error fetching event details:', error);
      return null;
    } finally {
      setIsLoadingDetails(false);
    }
  }, [eventDetailsCache]);
  
  // Marker interaction handlers - no state cascade
  const handleMarkerClick = useCallback(async (eventId, clusterData = null) => {
    console.log(`🖱️ Marker clicked: ${eventId}`);
    
    if (clusterData?.isCluster) {
      // Return cluster data for parent to handle
      return { action: 'expandCluster', data: clusterData };
    }
    
    // Prevent rapid clicks
    if (selectedEventId === eventId && eventDetailsCache[eventId]) {
      return;
    }
    
    setSelectedEventId(eventId);
    
    if (!eventDetailsCache[eventId]) {
      await fetchEventDetails(eventId);
    }
  }, [selectedEventId, eventDetailsCache, fetchEventDetails]);
  
  const handleInfoClose = useCallback(() => {
    console.log('🚫 Info window closed');
    setSelectedEventId(null);
  }, []);
  
  // Bounds management without triggering marker updates
  const updateBounds = useCallback((bounds) => {
    mapBoundsRef.current = bounds;
    
    // Only refresh if this isn't the initial load
    if (!hasInitialLoadRef.current) {
      console.log('📍 Initial bounds set - skipping refresh');
      hasInitialLoadRef.current = true;
      return;
    }
    
    // Debounced refresh check
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      const lastBounds = lastRefreshBoundsRef.current;
      if (!lastBounds) {
        lastRefreshBoundsRef.current = bounds;
        return;
      }
      
      // Check if significant movement
      const latDiff = Math.abs(bounds.north - lastBounds.north);
      const lngDiff = Math.abs(bounds.east - lastBounds.east);
      
      if (latDiff > 0.02 || lngDiff > 0.02) {
        console.log('🗺️ Significant movement - refreshing events');
        lastRefreshBoundsRef.current = bounds;
        fetchEvents();
      }
    }, 3000); // 3 second debounce
  }, [fetchEvents]);

  // Zoom tracking for clustering
  const updateZoom = useCallback((zoom) => {
    setCurrentZoom(zoom);
    console.log('🔍 Zoom changed to:', zoom);
  }, []);
  
  // Initialize data on mount
  React.useEffect(() => {
    console.log('🚀 Initial event load');
    fetchEvents();
  }, [fetchEvents]);
  
  const value = {
    // Data
    events: processedEvents,
    isLoadingEvents,
    selectedEventId,
    selectedEventDetails: selectedEventId ? eventDetailsCache[selectedEventId] : null,
    isLoadingDetails,
    currentZoom,
    
    // Actions
    fetchEvents,
    handleMarkerClick,
    handleInfoClose,
    updateBounds,
    setIsMapMoving,
    updateZoom,
    
    // State
    isMapMoving
  };
  
  return (
    <MapStateContext.Provider value={value}>
      {children}
    </MapStateContext.Provider>
  );
};