import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, User, Settings, LogOut, UserCircle, Filter, Menu, X } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { useMapState } from './mapStateContext';

const Navbar = ({ isMapMoving = false }) => {
  const [currentText, setCurrentText] = useState('Bangalore');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const {
    userLocation,
    handleMarkerClick,
    showFilterPanel,
    setShowFilterPanel,
    activeFilters,
    filteredEvents,
    clearFilters
  } = useMapState();

  const appliedFilterCount = activeFilters
    ? Object.entries(activeFilters).reduce((total, [key, value]) => {
        if (['user_lat', 'user_lng', 'limit', 'offset'].includes(key)) {
          return total;
        }

        if (key === 'sort_by') {
          return value && value !== 'distance' ? total + 1 : total;
        }

        return value !== undefined && value !== null && value !== ''
          ? total + 1
          : total;
      }, 0)
    : 0;

  const filterMatches = activeFilters ? filteredEvents.length : null;

  // Initial load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500); // Small delay for load animation

    return () => clearTimeout(timer);
  }, []);
  
  // Toggle between Bangalore and Bengaluru every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentText(prev => prev === 'Bangalore' ? 'Bengaluru' : 'Bangalore');
        setTimeout(() => {
          setIsAnimating(false);
        }, 100);
      }, 200);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (section) => {
    // Add your navigation logic here
  };

  const handleEventSelect = (eventId) => {
    handleMarkerClick(eventId);
  };

  const handleFilterToggle = () => {
    setShowFilterPanel(!showFilterPanel);
  };

  const handleResetFilters = () => {
    clearFilters();
  };

  return (
    <nav className="fixed top-2 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className={`bg-card border border-border shadow-2xl rounded-2xl transform origin-center ${
        !isLoaded 
          ? 'scale-x-0 opacity-0' 
          : isMapMoving 
            ? 'navbar-collapse'
            : 'navbar-expand'
      }`}>
        <div className={`flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 px-4 py-2 md:h-16 transition-opacity duration-300 ${
          isMapMoving ? 'opacity-0' : 'opacity-100'
        }`}>
          {/* Top row on mobile: Logo + Mobile Menu Button */}
          <div className="flex items-center justify-between w-full md:w-auto">
            {/* Logo/Brand */}
            <div className="flex-shrink-0">
              <h1 className="text-lg md:text-xl font-bold flex items-center">
                <div className="relative inline-block overflow-hidden">
                  <span 
                    className={`text-foreground inline-block transition-all duration-300 ease-in-out ${
                      isAnimating 
                        ? 'transform -translate-y-full opacity-0' 
                        : 'transform translate-y-0 opacity-100'
                    }`}
                  >
                    {currentText}
                  </span>
                </div>
                <span className="text-accent">Now</span>
              </h1>
            </div>

            {/* Mobile Menu Toggle - only visible on mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary/60 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>

          {/* Search Bar - full width on mobile, flex-1 on desktop */}
          <div className={`w-full md:flex-1 md:max-w-2xl ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
            <SearchBar 
              onEventSelect={handleEventSelect}
              userLocation={userLocation}
            />
          </div>

          {/* Right side controls */}
          <div className={`flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end ${
            mobileMenuOpen ? 'flex' : 'hidden md:flex'
          }`}>
            {/* Filter Button - Full details on desktop, icon only on mobile */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleFilterToggle}
              aria-pressed={showFilterPanel}
              className={`group relative flex w-full md:w-auto md:min-w-[320px] items-center gap-2 md:gap-4 rounded-lg md:rounded-none border md:border-none bg-secondary/40 md:bg-transparent px-3 py-2 md:px-0 md:py-0 text-left text-sm text-card-foreground ${
                showFilterPanel ? 'opacity-100' : 'opacity-90 hover:opacity-100'
              }`}
            >
              <div className="flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2 md:p-3 text-white shadow-inner flex-shrink-0 hover:cursor-pointer">
                <Filter className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="leading-tight flex-1 md:flex-none">
                <span className="block text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground">
                  Filters
                </span>
                <span className="block text-xs md:text-sm font-semibold">
                  {appliedFilterCount > 0 ? `${appliedFilterCount} applied` : 'Refine results'}
                </span>
                {typeof filterMatches === 'number' && (
                  <span className="text-[10px] md:text-xs text-muted-foreground">
                    {filterMatches} match{filterMatches === 1 ? '' : 'es'}
                  </span>
                )}
              </div>
              {appliedFilterCount > 0 && (
                <Badge className="rounded-xl bg-slate-900 text-white text-xs">
                  {appliedFilterCount}
                </Badge>
              )}
            </Button>
            
            {appliedFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold uppercase tracking-wide text-accent hover:text-accent/80 px-2"
              >
                Reset
              </button>
            )}

            {/* Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full opacity-50 cursor-not-allowed flex-shrink-0"
                  disabled
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/avatars/user.png" alt="User" />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-48 bg-card border-border" 
                align="end" 
                sideOffset={8}
                alignOffset={-8}
                forceMount
              >
                <DropdownMenuLabel className="font-normal text-card-foreground">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      john.doe@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  className="text-card-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                  onClick={() => handleNavigation('profile')}
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-card-foreground hover:bg-secondary hover:text-foreground cursor-pointer"
                  onClick={() => handleNavigation('settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem 
                  className="text-red-400 hover:bg-red-950 hover:text-red-300 cursor-pointer"
                  onClick={() => handleNavigation('logout')}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
