// components/Watchlist/MoveToWatchlistModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  RadioGroup,
  Radio,
  Spinner,
  Input
} from "@heroui/react";
import { ArrowRightCircle, Plus, Search } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

interface WatchlistCategory {
  id: number;
  name: string;
  moviesCount: number;
}

interface MoveToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWatchlistId: number;
  movieItem: {
    id: number;
    tmdbMovieId: number;
    title: string;
    posterPath: string;
  };
  onSuccess?: () => void;
}

const MoveToWatchlistModal: React.FC<MoveToWatchlistModalProps> = ({
  isOpen,
  onClose,
  currentWatchlistId,
  movieItem,
  onSuccess
}) => {
  const { token } = useAuth();
  const [watchlists, setWatchlists] = useState<WatchlistCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWatchlist, setSelectedWatchlist] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [creatingWatchlist, setCreatingWatchlist] = useState(false);
  
  // Fetch user's watchlists
  useEffect(() => {
    if (isOpen && token) {
      fetchWatchlists();
    }
  }, [isOpen, token]);
  
  const fetchWatchlists = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/api/watchlists/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out the current watchlist
        const filteredWatchlists = data.filter(w => w.id !== currentWatchlistId);
        setWatchlists(filteredWatchlists);
      } else {
        setError('Failed to fetch watchlists');
      }
    } catch (err) {
      setError('An error occurred while fetching watchlists');
      console.error('Error fetching watchlists:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Move the movie to selected watchlist
  const handleMoveMovie = async () => {
    if (!token || !movieItem || !selectedWatchlist) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // First copy the movie to the new watchlist
      const copyResponse = await fetch('http://localhost:8000/api/watchlists/copy-movie', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceItemId: movieItem.id,
          targetCategoryId: parseInt(selectedWatchlist)
        })
      });
      
      if (!copyResponse.ok) {
        const errorData = await copyResponse.json();
        
        // If the movie already exists in the target watchlist, we can continue
        // with removing it from the current watchlist
        if (errorData.message !== 'Movie already exists in target watchlist') {
          throw new Error(errorData.message || 'Failed to copy movie');
        }
      }
      
      // Now remove from the current watchlist
      const deleteResponse = await fetch(`http://localhost:8000/api/watchlists/categories/${currentWatchlistId}/movies/${movieItem.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!deleteResponse.ok) {
        throw new Error('Failed to remove movie from current watchlist');
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError('An error occurred while moving the movie');
      console.error('Error moving movie:', err);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Create a new watchlist
  const handleCreateWatchlist = async () => {
    if (!token || !newWatchlistName.trim()) return;
    
    try {
      setCreatingWatchlist(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/api/watchlists/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newWatchlistName.trim(),
          isPublic: false
        })
      });
      
      if (response.ok) {
        const newWatchlist = await response.json();
        
        // Add the new watchlist to the list and select it
        setWatchlists(prev => [...prev, newWatchlist]);
        setSelectedWatchlist(newWatchlist.id.toString());
        
        // Reset create form
        setNewWatchlistName('');
        setShowCreateNew(false);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create watchlist');
      }
    } catch (err) {
      setError('An error occurred while creating the watchlist');
      console.error('Error creating watchlist:', err);
    } finally {
      setCreatingWatchlist(false);
    }
  };
  
  // Filter watchlists based on search query
  const filteredWatchlists = watchlists.filter(watchlist => 
    watchlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="center">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Move "{movieItem?.title}" to another watchlist
        </ModalHeader>
        
        <ModalBody>
          {error && (
            <div className="bg-danger-50 text-danger-600 p-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          ) : watchlists.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-default-500 mb-4">You don't have any other watchlists yet.</p>
              <Input
                label="New Watchlist Name"
                placeholder="E.g. My Favorites"
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                isDisabled={creatingWatchlist}
              />
              <Button
                color="primary"
                className="mt-4 w-full"
                onPress={handleCreateWatchlist}
                isLoading={creatingWatchlist}
                isDisabled={!newWatchlistName.trim()}
              >
                Create Watchlist
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-default-500 mb-2">
                Select a watchlist to move this movie to:
              </p>
              
              <Input
                placeholder="Search watchlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search size={16} className="text-default-400" />}
                size="sm"
                className="mb-4"
              />
              
              <RadioGroup
                value={selectedWatchlist}
                onValueChange={setSelectedWatchlist}
                className="gap-2"
              >
                {filteredWatchlists.map((watchlist) => (
                  <Radio 
                    key={watchlist.id} 
                    value={watchlist.id.toString()}
                    className="p-2 border border-default-200 rounded-md w-full"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span>{watchlist.name}</span>
                      <span className="text-xs text-default-500">{watchlist.moviesCount} movies</span>
                    </div>
                  </Radio>
                ))}
              </RadioGroup>
              
              <Button
                variant="flat"
                startContent={<Plus size={16} />}
                onPress={() => setShowCreateNew(true)}
                className="mt-4 w-full"
                isDisabled={showCreateNew}
              >
                Create New Watchlist
              </Button>
              
              {showCreateNew && (
                <div className="mt-4">
                  <Input
                    label="New Watchlist Name"
                    placeholder="Enter watchlist name"
                    value={newWatchlistName}
                    onChange={(e) => setNewWatchlistName(e.target.value)}
                    isDisabled={creatingWatchlist}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="flat"
                      onPress={() => {
                        setShowCreateNew(false);
                        setNewWatchlistName('');
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      color="primary"
                      onPress={handleCreateWatchlist}
                      isLoading={creatingWatchlist}
                      isDisabled={!newWatchlistName.trim()}
                      className="flex-1"
                    >
                      Create
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button
            variant="flat"
            onPress={onClose}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleMoveMovie}
            isLoading={submitting}
            isDisabled={!selectedWatchlist || loading}
            startContent={<ArrowRightCircle size={16} />}
          >
            Move
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MoveToWatchlistModal;