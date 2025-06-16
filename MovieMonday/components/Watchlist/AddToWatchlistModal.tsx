import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Checkbox,
  Input,
  Divider,
} from "@heroui/react";
import { Plus, X } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

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
  onSuccess,
}) => {
  const { token } = useAuth();
  const [watchlists, setWatchlists] = useState<WatchlistCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedWatchlists, setSelectedWatchlists] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showNewWatchlistForm, setShowNewWatchlistForm] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [newWatchlistDescription, setNewWatchlistDescription] = useState("");
  const [newWatchlistIsPublic, setNewWatchlistIsPublic] = useState(false);
  const [createWatchlistLoading, setCreateWatchlistLoading] = useState(false);
  const [movieWatchlistStatus, setMovieWatchlistStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [processingWatchlists, setProcessingWatchlists] = useState<{
    [key: string]: boolean;
  }>({});

  // Fetch watchlists when the modal opens
  useEffect(() => {
    if (isOpen && token) {
      fetchWatchlists();
      checkMovieWatchlistStatus();
    }
  }, [isOpen, token]);

  const fetchWatchlists = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8000/api/watchlists/categories",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();

        setWatchlists(data);
      } else {
        setError("Failed to fetch watchlists");
      }
    } catch (err) {
      console.error("Error fetching watchlists:", err);
      setError("An error occurred while loading your watchlists");
    } finally {
      setLoading(false);
    }
  };

  // Check which watchlists already contain this movie
  const checkMovieWatchlistStatus = async () => {
    if (!token || !movieDetails.id) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/watchlists/status/${movieDetails.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();

        if (data.inWatchlist && data.watchlists) {
          // Create a map of watchlist IDs to status
          const statusMap = {};

          data.watchlists.forEach((w) => {
            statusMap[w.watchlistId] = true;
          });
          setMovieWatchlistStatus(statusMap);

          // Set initial selections based on current status
          setSelectedWatchlists(
            data.watchlists.map((w) => w.watchlistId.toString()),
          );
        }
      }
    } catch (error) {
      console.error("Error checking movie watchlist status:", error);
    }
  };

  const handleToggleWatchlist = async (
    watchlistId: string,
    isSelected: boolean,
  ) => {
    if (!token) return;

    // Mark as processing
    setProcessingWatchlists((prev) => ({
      ...prev,
      [watchlistId]: true,
    }));

    try {
      if (isSelected) {
        // Add to watchlist
        const response = await fetch(
          `http://localhost:8000/api/watchlists/categories/${watchlistId}/movies`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tmdbMovieId: movieDetails.id,
              title: movieDetails.title,
              posterPath: movieDetails.posterPath,
            }),
          },
        );

        if (response.ok) {
          // Update local state
          setMovieWatchlistStatus((prev) => ({
            ...prev,
            [watchlistId]: true,
          }));

          // Refresh full status if needed
          checkMovieWatchlistStatus();
        }
      } else {
        // Find the watchlist item ID
        const statusResponse = await fetch(
          `http://localhost:8000/api/watchlists/status/${movieDetails.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          const watchlistInfo = statusData.watchlists?.find(
            (w) => w.watchlistId.toString() === watchlistId,
          );

          if (watchlistInfo) {
            // Remove from watchlist
            const deleteResponse = await fetch(
              `http://localhost:8000/api/watchlists/categories/${watchlistId}/movies/${watchlistInfo.itemId}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              },
            );

            if (deleteResponse.ok) {
              // Update local state
              setMovieWatchlistStatus((prev) => {
                const newState = { ...prev };

                delete newState[watchlistId];

                return newState;
              });

              // Refresh full status
              checkMovieWatchlistStatus();
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
    } finally {
      // Clear processing state
      setProcessingWatchlists((prev) => {
        const newState = { ...prev };

        delete newState[watchlistId];

        return newState;
      });
    }
  };

  const handleAddToWatchlists = async () => {
    if (!token || !selectedWatchlists.length || !movieDetails) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(
        `http://localhost:8000/api/watchlists/add-to-watchlists`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tmdbMovieId: movieDetails.id,
            title: movieDetails.title,
            posterPath: movieDetails.posterPath,
            categoryIds: selectedWatchlists.map((id) => parseInt(id)),
          }),
        },
      );

      if (response.ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const errorData = await response.json();

        setError(errorData.message || "Failed to add movie to watchlists");
      }
    } catch (err) {
      console.error("Error adding to watchlists:", err);
      setError("An error occurred while adding the movie");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateWatchlist = async () => {
    if (!token || !newWatchlistName.trim()) return;

    try {
      setCreateWatchlistLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8000/api/watchlists/categories",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newWatchlistName.trim(),
            description: newWatchlistDescription.trim() || undefined,
            isPublic: newWatchlistIsPublic,
          }),
        },
      );

      if (response.ok) {
        const newWatchlist = await response.json();

        // Add the new watchlist to the list and select it
        setWatchlists((prev) => [...prev, newWatchlist]);
        setSelectedWatchlists((prev) => [...prev, newWatchlist.id.toString()]);

        // Reset form and hide it
        setNewWatchlistName("");
        setNewWatchlistDescription("");
        setNewWatchlistIsPublic(false);
        setShowNewWatchlistForm(false);

        // Add movie to the new watchlist
        await handleToggleWatchlist(newWatchlist.id.toString(), true);
      } else {
        const errorData = await response.json();

        setError(errorData.message || "Failed to create watchlist");
      }
    } catch (err) {
      console.error("Error creating watchlist:", err);
      setError("An error occurred while creating the watchlist");
    } finally {
      setCreateWatchlistLoading(false);
    }
  };

  // Reset state when modal is closed
  const handleOnClose = () => {
    setError(null);
    setShowNewWatchlistForm(false);
    setNewWatchlistName("");
    setNewWatchlistDescription("");
    setNewWatchlistIsPublic(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="md" onClose={handleOnClose}>
      <ModalContent>
        <ModalHeader>Manage Watchlists</ModalHeader>
        <ModalBody>
          {error && (
            <div className="bg-danger-50 text-danger p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          ) : watchlists.length === 0 && !showNewWatchlistForm ? (
            <div className="text-center py-4">
              <p className="text-default-500 mb-4">
                You don't have any watchlists yet.
              </p>
              <Button
                color="primary"
                startContent={<Plus />}
                variant="flat"
                onPress={() => setShowNewWatchlistForm(true)}
              >
                Create Your First Watchlist
              </Button>
            </div>
          ) : (
            <>
              {!showNewWatchlistForm ? (
                <>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {watchlists.map((watchlist) => (
                      <div
                        key={watchlist.id}
                        className={`flex items-center p-2 border ${
                          selectedWatchlists.includes(watchlist.id.toString())
                            ? "border-primary bg-primary-50 dark:bg-primary-900/20"
                            : "border-default-200"
                        } rounded-md`}
                      >
                        <Checkbox
                          isDisabled={
                            processingWatchlists[watchlist.id.toString()]
                          }
                          isSelected={selectedWatchlists.includes(
                            watchlist.id.toString(),
                          )}
                          value={watchlist.id.toString()}
                          onValueChange={(isSelected) => {
                            if (isSelected) {
                              setSelectedWatchlists((prev) => [
                                ...prev,
                                watchlist.id.toString(),
                              ]);
                            } else {
                              setSelectedWatchlists((prev) =>
                                prev.filter(
                                  (id) => id !== watchlist.id.toString(),
                                ),
                              );
                            }
                            handleToggleWatchlist(
                              watchlist.id.toString(),
                              isSelected,
                            );
                          }}
                        >
                          <div className="flex justify-between gap-2 items-center w-full">
                            <span className="text-sm font-medium">
                              {watchlist.name}
                            </span>
                            <span className="text-xs text-default-500 ml-auto">
                              {watchlist.moviesCount} movies
                            </span>
                          </div>
                        </Checkbox>
                        {processingWatchlists[watchlist.id.toString()] && (
                          <Spinner className="ml-2" size="sm" />
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    className="mt-4 w-full"
                    startContent={<Plus />}
                    variant="flat"
                    onPress={() => setShowNewWatchlistForm(true)}
                  >
                    Create New Watchlist
                  </Button>
                </>
              ) : (
                <>
                  <Divider className="my-4" />
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">
                      Create New Watchlist
                    </h3>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => setShowNewWatchlistForm(false)}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <Input
                      isRequired
                      label="Name"
                      placeholder="My Favorites"
                      value={newWatchlistName}
                      variant="bordered"
                      onChange={(e) => setNewWatchlistName(e.target.value)}
                    />

                    <Input
                      label="Description (optional)"
                      placeholder="A collection of my favorite movies"
                      value={newWatchlistDescription}
                      variant="bordered"
                      onChange={(e) =>
                        setNewWatchlistDescription(e.target.value)
                      }
                    />

                    <Checkbox
                      isSelected={newWatchlistIsPublic}
                      onValueChange={setNewWatchlistIsPublic}
                    >
                      Make watchlist public
                    </Checkbox>

                    <div className="flex gap-2 mt-4">
                      <Button
                        className="flex-1"
                        variant="flat"
                        onPress={() => setShowNewWatchlistForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1"
                        color="primary"
                        isDisabled={!newWatchlistName.trim()}
                        isLoading={createWatchlistLoading}
                        startContent={<Plus size={16} />}
                        onPress={handleCreateWatchlist}
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
          {!showNewWatchlistForm && (
            <>
              <Button variant="flat" onPress={handleOnClose}>
                Close
              </Button>
              <Button
                color="primary"
                isDisabled={!selectedWatchlists.length || loading}
                isLoading={submitting}
                startContent={<Plus size={16} />}
                onPress={handleAddToWatchlists}
              >
                Apply Changes
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddToWatchlistModal;
