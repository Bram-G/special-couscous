import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  ButtonGroup,
  useDisclosure,
  Checkbox,
  Spinner
} from "@heroui/react";
import { Heart, ChevronDown, Check, Plus, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AddToWatchlistModal from './AddToWatchlistModal';

interface WatchlistCategory {
  id: number;
  name: string;
  watchlistItemId?: number;
}

interface MovieDetails {
  id: number;
  title: string;
  posterPath?: string | null;
}

interface WatchlistSplitButtonProps {
  movie: MovieDetails;
  onSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

const WatchlistSplitButton: React.FC<WatchlistSplitButtonProps> = ({
  movie,
  onSuccess,
  size = 'md',
  fullWidth = false,
  className = ''
}) => {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [watchlists, setWatchlists] = useState<WatchlistCategory[]>([]);
  const [loadingWatchlists, setLoadingWatchlists] = useState(false);
  const [selectedWatchlists, setSelectedWatchlists] = useState<Record<string, boolean>>({});
  const [processingWatchlists, setProcessingWatchlists] = useState<Record<string, boolean>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Fetch movie watchlist status
  useEffect(() => {
    if (!isAuthenticated || !token || !movie.id) {
      setCheckingStatus(false);
      return;
    }
    
    const fetchWatchlistStatus = async () => {
      setCheckingStatus(true);
      try {
        const response = await fetch(
          `http://localhost:8000/api/watchlists/status/${movie.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          setInWatchlist(data.inWatchlist);
          
          // Build selected watchlists map
          if (data.watchlists && data.watchlists.length > 0) {
            const selectedMap = {};
            data.watchlists.forEach(w => {
              selectedMap[w.watchlistId] = true;
            });
            setSelectedWatchlists(selectedMap);
          }
        }
      } catch (error) {
        console.error('Error checking watchlist status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };
    
    fetchWatchlistStatus();
  }, [movie.id, token, isAuthenticated]);
  
  // Fetch all watchlists
  const fetchWatchlists = async () => {
    if (!token) return;
    
    setLoadingWatchlists(true);
    try {
      const response = await fetch('http://localhost:8000/api/watchlists/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Get watchlist item IDs if movie is in any watchlist
        if (inWatchlist) {
          const statusResponse = await fetch(
            `http://localhost:8000/api/watchlists/status/${movie.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            
            if (statusData.watchlists) {
              // Map item IDs to watchlists
              const enhancedWatchlists = data.map(w => {
                const matchedWatchlist = statusData.watchlists.find(
                  sw => sw.watchlistId === w.id
                );
                if (matchedWatchlist) {
                  return {
                    ...w,
                    watchlistItemId: matchedWatchlist.itemId
                  };
                }
                return w;
              });
              
              setWatchlists(enhancedWatchlists);
              return;
            }
          }
        }
        
        setWatchlists(data);
      }
    } catch (error) {
      console.error('Error fetching watchlists:', error);
    } finally {
      setLoadingWatchlists(false);
    }
  };
  
  // Handle quick add (main button click)
  const handleQuickAdd = async () => {
    if (!isAuthenticated) {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      router.push('/login');
      return;
    }
    
    // If already in watchlist, just open dropdown
    if (inWatchlist) {
      setDropdownOpen(true);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/watchlists/quick-add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tmdbMovieId: movie.id,
          title: movie.title,
          posterPath: movie.posterPath
        })
      });
      
      if (response.ok) {
        setInWatchlist(true);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle watchlist toggle
  const handleWatchlistToggle = async (watchlistId: string, checked: boolean) => {
    if (!token) return;
    
    // Mark as processing
    setProcessingWatchlists(prev => ({
      ...prev,
      [watchlistId]: true
    }));
    
    try {
      if (checked) {
        // Add to watchlist
        const response = await fetch(`http://localhost:8000/api/watchlists/categories/${watchlistId}/movies`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tmdbMovieId: movie.id,
            title: movie.title,
            posterPath: movie.posterPath
          })
        });
        
        if (response.ok) {
          // Update selected status
          setSelectedWatchlists(prev => ({
            ...prev,
            [watchlistId]: true
          }));
          
          // Update in-watchlist status
          setInWatchlist(true);
          
          // Refresh watchlist item ID
          fetchWatchlists();
          
          if (onSuccess) onSuccess();
        }
      } else {
        // Find watchlist item ID
        const watchlist = watchlists.find(w => w.id.toString() === watchlistId);
        if (watchlist && watchlist.watchlistItemId) {
          // Remove from watchlist
          const response = await fetch(
            `http://localhost:8000/api/watchlists/categories/${watchlistId}/movies/${watchlist.watchlistItemId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.ok) {
            // Update selected status
            setSelectedWatchlists(prev => {
              const newState = { ...prev };
              delete newState[watchlistId];
              return newState;
            });
            
            // Check if we still have any watchlists
            const responseData = await response.json();
            setInWatchlist(responseData.inWatchlist);
            
            if (onSuccess) onSuccess();
          }
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    } finally {
      // Clear processing state
      setProcessingWatchlists(prev => {
        const newState = { ...prev };
        delete newState[watchlistId];
        return newState;
      });
    }
  };
  
  // Handle dropdown open - fetch watchlists
  const handleDropdownOpenChange = (open: boolean) => {
    // Don't allow opening dropdown if modal is open
    if (isOpen && open) {
      return;
    }
    
    setDropdownOpen(open);
    
    if (open && watchlists.length === 0) {
      fetchWatchlists();
    }
  };
  
  // Handle opening the Create Watchlist modal
  const handleOpenModal = () => {
    // Close dropdown first
    setDropdownOpen(false);
    // Then open modal
    onOpen();
  };
  
  // Handle closing the modal
  const handleCloseModal = () => {
    onClose();
    // Refresh watchlists after modal closes
    fetchWatchlists();
  };
  
  return (
    <>
      <ButtonGroup className={className} fullWidth={fullWidth}>
        <Button
          color={inWatchlist ? "success" : "primary"}
          size={size}
          isLoading={loading || checkingStatus}
          startContent={inWatchlist ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
          onPress={handleQuickAdd}
          fullWidth
          isDisabled={isOpen} // Disable main button when modal is open
        >
          {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
        </Button>
        
        <Dropdown isOpen={dropdownOpen && !isOpen} onOpenChange={handleDropdownOpenChange}>
          <DropdownTrigger>
            <Button
              id="watchlist-dropdown-trigger"
              color={inWatchlist ? "success" : "primary"}
              size={size}
              isIconOnly
              isDisabled={isOpen} // Disable dropdown trigger when modal is open
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Watchlist options" closeOnSelect={false}>
            {loadingWatchlists ? (
              <DropdownItem key="loading" textValue="Loading watchlists">
                <div className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Loading watchlists...</span>
                </div>
              </DropdownItem>
            ) : watchlists.length === 0 ? (
              <DropdownItem key="no-watchlists" textValue="No watchlists found">
                <div className="text-default-500">No watchlists found</div>
              </DropdownItem>
            ) : (
              watchlists.map(watchlist => {
                const watchlistId = watchlist.id.toString();
                const isSelected = !!selectedWatchlists[watchlistId];
                const isProcessing = !!processingWatchlists[watchlistId];
                
                return (
                  <DropdownItem 
                    key={watchlistId}
                    textValue={watchlist.name}
                    isReadOnly
                  >
                    <div className="flex items-center gap-2 w-full py-1">
                      <Checkbox
                        isSelected={isSelected}
                        isDisabled={isProcessing}
                        onValueChange={(checked) => handleWatchlistToggle(watchlistId, checked)}
                      />
                      <span className="flex-1">{watchlist.name}</span>
                      {isProcessing && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                    </div>
                  </DropdownItem>
                );
              })
            )}
            
            <DropdownItem key="divider" textValue="Divider" isReadOnly className="h-px bg-default-200 my-1 p-0" />
            
            <DropdownItem 
              key="create-new" 
              textValue="Create New Watchlist"
              description="Create a new watchlist"
              startContent={<Plus className="h-4 w-4" />}
              onPress={handleOpenModal}
            >
              Create New Watchlist
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </ButtonGroup>
      
      <AddToWatchlistModal
        isOpen={isOpen}
        onClose={handleCloseModal}
        movieDetails={movie}
        onSuccess={() => {
          setInWatchlist(true);
          fetchWatchlists();
          if (onSuccess) onSuccess();
        }}
      />
    </>
  );
};

export default WatchlistSplitButton;