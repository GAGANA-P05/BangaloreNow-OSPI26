import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Calendar, Navigation } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { getApiUrl, API_ENDPOINTS } from '../lib/api.js';

export function SearchBar({ onSearch, onEventSelect, userLocation }) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      await performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search_query: searchQuery,
        limit: 10,
        sort_by: 'name'
      });

      if (userLocation) {
        params.append('user_lat', userLocation.lat);
        params.append('user_lng', userLocation.lng);
      }

      const url = `${getApiUrl(API_ENDPOINTS.SEARCH_EVENTS)}?${params}`;      
      const response = await fetch(url);
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search failed:', response.status, errorText);
        setResults([]);
        return;
      }
      
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (!isExpanded) setIsExpanded(true);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsExpanded(false);
  };

  const handleEventClick = (event) => {
    onEventSelect(event.id);
    setQuery(event.name);
    setIsExpanded(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsExpanded(true)}
          placeholder="Search events, venues, organizers..."
          className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-3 bg-white/95 backdrop-blur border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg transition-all text-sm sm:text-base text-gray-900 placeholder-gray-400"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isExpanded && query.length >= 2 && (
        <Card className="absolute top-full mt-2 w-full max-h-[60vh] sm:max-h-96 overflow-y-auto bg-white/95 backdrop-blur shadow-xl border z-50">
          {isLoading ? (
            <div className="p-3 sm:p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <span className="text-xs sm:text-sm">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 sm:p-4 text-center text-gray-500 text-xs sm:text-sm">
              No events found for "{query}"
            </div>
          ) : (
            <div className="py-2">
              <div className="px-3 py-2 text-[10px] sm:text-xs text-gray-500 font-medium">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              {results.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventClick(event)}
                  className="w-full px-3 py-2 sm:py-3 hover:bg-gray-100 transition-colors text-left border-b last:border-b-0"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-xs sm:text-sm line-clamp-1 text-gray-900">
                      {event.name}
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-gray-600 flex-wrap">
                      {event.venue && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="line-clamp-1">{event.venue}</span>
                        </div>
                      )}
                      
                      {event.startDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(event.startDate)}</span>
                        </div>
                      )}
                      
                      {event.distance_km !== null && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Navigation className="w-3 h-3" />
                          <span>{event.distance_km} km</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {event.distance_km !== null && event.distance_km < 5 && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs">Nearby</Badge>
                      )}
                      {event.startDate && new Date(event.startDate) > new Date() && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs text-black">Upcoming</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
