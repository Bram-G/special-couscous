// MovieMonday/components/Watchlist/AddToWatchlistModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  CheckboxGroup,
  Spinner,
  Input,
  Divider
} from "@heroui/react";
import { List, Plus, Search } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

interface WatchlistCategory {
  id: number;
  name: string;
  description?: string;
  moviesCount: number;
}

interface AddToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieDetails: {
    id: number;
    title: string;
    posterPath: string;
  };
  onSuccess?: () => void;
}

const AddToWatchlistModal: React.FC<AddToWatchlistModalProps> = ({
  isOpen,
  onClose,
  movieDetails,
  onSuccess
}) => {
  const { token } = useAuth();
  const [watchlists, setWatchlists] = useState<WatchlistCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWatchlists, setSelectedWatchlists] = useState<string[]>([]);
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
        setWatchlists(data);
        
        // If there's only one watchlist, select it by default
        if (data.length === 1) {
          setSelectedWatchlists([data[0].id.toString()]);
        }
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
  
  // Handle form submission to add movie to selected watchlists
  const handleSubmit = async () => {
    if (!token || !movieDetails || selectedWatchlists.length === 0) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/api/watchlists/add-to-watchlists', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tmdbMovieId: movieDetails.id,
          title: movieDetails.title,
          posterPath: movieDetails.posterPath,
          categoryIds: selectedWatchlists.map(id => parseInt(id))
        })
      });
      
      if (response.ok) {
        // Success!
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to add movie to watchlists');
      }
    } catch (err) {
      setError('An error occurred while adding the movie');
      console.error('Error adding movie to watchlists:', err);
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
        setSelectedWatchlists(prev => [...prev, newWatchlist.id.toString()]);
        
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
          Add "{movieDetails?.title}" to Watchlist
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
              <p className="text-default-500 mb-4">You don't have any watchlists yet.</p>
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
              <Input
                placeholder="Search watchlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Search size={16} className="text-default-400" />}
                size="sm"
                className="mb-4"
              />
              
              <CheckboxGroup
                value={selectedWatchlists}
                onChange={(values) => setSelectedWatchlists(values as string[])}
                className="gap-2"
              >
                {filteredWatchlists.map((watchlist) => (
                  <Checkbox 
                    key={watchlist.id} 
                    value={watchlist.id.toString()}
                    className="p-2 border border-default-200 rounded-md w-full"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span>{watchlist.name}</span>
                      <span className="text-xs text-default-500">{watchlist.moviesCount} movies</span>
                    </div>
                  </Checkbox>
                ))}
              </CheckboxGroup>
              
              {!showCreateNew ? (
                <Button
                  variant="flat"
                  startContent={<Plus size={16} />}
                  onPress={() => setShowCreateNew(true)}
                  className="mt-4 w-full"
                >
                  Create New Watchlist
                </Button>
              ) : (
                <div className="mt-4 space-y-2">
                  <Divider />
                  <p className="text-sm font-medium">Create New Watchlist</p>
                  <Input
                    placeholder="Watchlist name"
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
            onPress={handleSubmit}
            isLoading={submitting}
            isDisabled={selectedWatchlists.length === 0 || loading}
          >
            Add to Watchlists
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddToWatchlistModal;