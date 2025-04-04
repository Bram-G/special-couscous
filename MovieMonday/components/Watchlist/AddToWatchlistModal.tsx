// MovieMonday/components/Watchlist/AddToWatchlistModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  RadioGroup,
  Radio,
  useDisclosure,
  Input,
  Divider,
  Checkbox
} from "@heroui/react";
import { Plus, Heart, ArrowRightCircle } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

interface WatchlistCategory {
  id: number;
  name: string;
  description?: string;
  moviesCount: number;
}

interface MovieDetails {
  id: number;
  title: string;
  posterPath?: string | null;
}

interface AddToWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieDetails: MovieDetails;
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
  const [selectedWatchlist, setSelectedWatchlist] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewWatchlistForm, setShowNewWatchlistForm] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDescription, setNewWatchlistDescription] = useState('');
  const [newWatchlistIsPublic, setNewWatchlistIsPublic] = useState(false);
  const [createWatchlistLoading, setCreateWatchlistLoading] = useState(false);

  // Fetch watchlists when the modal opens
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
        
        // If there's at least one watchlist, select the first one by default
        if (data.length > 0) {
          setSelectedWatchlist(data[0].id.toString());
        }
      } else {
        setError('Failed to fetch watchlists');
      }
    } catch (err) {
      console.error('Error fetching watchlists:', err);
      setError('An error occurred while loading your watchlists');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async () => {
    if (!token || !selectedWatchlist || !movieDetails) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`http://localhost:8000/api/watchlists/categories/${selectedWatchlist}/movies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tmdbMovieId: movieDetails.id,
          title: movieDetails.title,
          posterPath: movieDetails.posterPath
        })
      });

      if (response.ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        
        // Special handling for already-in-watchlist case
        if (response.status === 409) {
          setError('This movie is already in the selected watchlist');
        } else {
          setError(errorData.message || 'Failed to add movie to watchlist');
        }
      }
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      setError('An error occurred while adding the movie');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateWatchlist = async () => {
    if (!token || !newWatchlistName.trim()) return;

    try {
      setCreateWatchlistLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8000/api/watchlists/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newWatchlistName.trim(),
          description: newWatchlistDescription.trim() || undefined,
          isPublic: newWatchlistIsPublic
        })
      });

      if (response.ok) {
        const newWatchlist = await response.json();
        
        // Add the new watchlist to the list and select it
        setWatchlists(prev => [...prev, newWatchlist]);
        setSelectedWatchlist(newWatchlist.id.toString());
        
        // Reset form and hide it
        setNewWatchlistName('');
        setNewWatchlistDescription('');
        setNewWatchlistIsPublic(false);
        setShowNewWatchlistForm(false);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create watchlist');
      }
    } catch (err) {
      console.error('Error creating watchlist:', err);
      setError('An error occurred while creating the watchlist');
    } finally {
      setCreateWatchlistLoading(false);
    }
  };

  // Reset state when modal is closed
  const handleOnClose = () => {
    setError(null);
    setShowNewWatchlistForm(false);
    setNewWatchlistName('');
    setNewWatchlistDescription('');
    setNewWatchlistIsPublic(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleOnClose} size="md">
      <ModalContent>
        <ModalHeader>Add to Watchlist</ModalHeader>
        <ModalBody>
          {error && (
            <div className="bg-danger-50 text-danger p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          <p className="mb-4">
            <strong>{movieDetails?.title}</strong>
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          ) : watchlists.length === 0 && !showNewWatchlistForm ? (
            <div className="text-center py-4">
              <p className="text-default-500 mb-4">You don't have any watchlists yet.</p>
              <Button 
                color="primary"
                variant="flat"
                onPress={() => setShowNewWatchlistForm(true)}
                startContent={<Plus />}
              >
                Create Your First Watchlist
              </Button>
            </div>
          ) : (
            <>
              {!showNewWatchlistForm && (
                <>
                  <p className="text-sm font-medium mb-2">Select a watchlist:</p>
                  <RadioGroup
                    value={selectedWatchlist}
                    onValueChange={setSelectedWatchlist}
                    className="gap-2"
                  >
                    {watchlists.map((watchlist) => (
                      <Radio 
                        key={watchlist.id} 
                        value={watchlist.id.toString()}
                        description={`${watchlist.moviesCount} movies`}
                      >
                        {watchlist.name}
                      </Radio>
                    ))}
                  </RadioGroup>
                  
                  <Button
                    className="mt-4 w-full"
                    variant="flat"
                    startContent={<Plus />}
                    onPress={() => setShowNewWatchlistForm(true)}
                  >
                    Create New Watchlist
                  </Button>
                </>
              )}

              {showNewWatchlistForm && (
                <>
                  <Divider className="my-4" />
                  <h3 className="text-md font-medium mb-3">Create New Watchlist</h3>
                  <div className="space-y-4">
                    <Input
                      label="Name"
                      placeholder="My Favorites"
                      value={newWatchlistName}
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                      variant="bordered"
                      isRequired
                    />
                    
                    <Input
                      label="Description (optional)"
                      placeholder="A collection of my favorite movies"
                      value={newWatchlistDescription}
                      onChange={(e) => setNewWatchlistDescription(e.target.value)}
                      variant="bordered"
                    />
                    
                    <Checkbox 
                      isSelected={newWatchlistIsPublic}
                      onValueChange={setNewWatchlistIsPublic}
                    >
                      Make watchlist public
                    </Checkbox>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="flat"
                        className="flex-1"
                        onPress={() => setShowNewWatchlistForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        color="primary"
                        className="flex-1"
                        onPress={handleCreateWatchlist}
                        isLoading={createWatchlistLoading}
                        isDisabled={!newWatchlistName.trim()}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={handleOnClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleAddToWatchlist}
            isLoading={submitting}
            isDisabled={!selectedWatchlist || loading || showNewWatchlistForm}
            startContent={<Heart />}
          >
            Add to Watchlist
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddToWatchlistModal;