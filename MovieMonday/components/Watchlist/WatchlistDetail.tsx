"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit,
  Eye,
  Film,
  Globe,
  Grid,
  Heart,
  List,
  Lock,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  Trash2,
  UserCircle,
  Star,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Link from 'next/link';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import MoveToWatchlistModal from './MoveToWatchlistModal';
import { useAuth } from '@/contexts/AuthContext';

// Types
interface WatchlistItem {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath: string;
  sortOrder: number;
  addedAt: string;
  userNote?: string;
  userRating?: number;
  watched: boolean;
  watchedDate?: string;
  isWinner: boolean;
}

interface WatchlistCategory {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  likesCount: number;
  coverImagePath?: string;
  slug: string;
  items: WatchlistItem[];
  userHasLiked: boolean;
  owner: {
    id: string;
    username: string;
  };
}

// Sortable Item Component
const SortableItem = ({
  id,
  item,
  viewMode,
  onMovieClick,
  onDeleteClick,
}: {
  id: number;
  item: WatchlistItem;
  viewMode: "grid" | "list";
  onMovieClick: (item: WatchlistItem) => void;
  onDeleteClick: (id: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (viewMode === "grid") {
    return (
      <div
        ref={setNodeRef}
        className="relative aspect-[2/3] bg-default-100 rounded-md overflow-hidden cursor-move group"
        style={style}
        {...attributes}
        {...listeners}
      >
        {item.posterPath ? (
          <Image
            removeWrapper
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            src={`https://image.tmdb.org/t/p/w300${item.posterPath}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-default-200">
            <Film className="w-12 h-12 text-default-400" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <h4 className="text-white font-medium truncate">{item.title}</h4>
          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-1">
              {item.watched && (
                <Tooltip content="Watched">
                  <div className="p-1 bg-success rounded-full">
                    <Eye className="h-3 w-3 text-white" />
                  </div>
                </Tooltip>
              )}
              {item.isWinner && (
                <Tooltip content="Movie Monday Winner">
                  <div className="p-1 bg-warning rounded-full">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                </Tooltip>
              )}
            </div>

            <div className="flex gap-1">
              <Button
                isIconOnly
                className="bg-white/20 backdrop-blur-sm"
                size="sm"
                variant="flat"
                onPress={() => onMovieClick(item)}
              >
                <Eye className="h-3 w-3 text-white" />
              </Button>
              <Button
                isIconOnly
                className="bg-white/20 backdrop-blur-sm"
                size="sm"
                variant="flat"
                onPress={() => onDeleteClick(item.id)}
              >
                <Trash2 className="h-3 w-3 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    // List view
    return (
      <div
        ref={setNodeRef}
        className="flex items-center p-3 bg-default-50 rounded-md mb-2 cursor-move border border-default-200 group hover:border-primary"
        style={style}
        {...attributes}
        {...listeners}
      >
        <div className="h-16 w-12 mr-3 flex-shrink-0 overflow-hidden rounded">
          {item.posterPath ? (
            <Image
              removeWrapper
              alt={item.title}
              className="h-full w-full object-cover"
              src={`https://image.tmdb.org/t/p/w92${item.posterPath}`}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-default-200">
              <Film className="w-6 h-6 text-default-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{item.title}</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {item.watched && (
              <Chip color="success" size="sm" variant="flat">
                Watched
              </Chip>
            )}
            {item.isWinner && (
              <Chip color="warning" size="sm" variant="flat">
                Winner
              </Chip>
            )}
          </div>
        </div>

        <div className="flex ml-2">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => onMovieClick(item)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            isIconOnly
            color="danger"
            size="sm"
            variant="light"
            onPress={() => onDeleteClick(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
};

const WatchlistDetail = () => {
  const router = useRouter();
  const params = useParams();
  const { token, isAuthenticated } = useAuth();

  // State
  const [watchlist, setWatchlist] = useState<WatchlistCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditable, setIsEditable] = useState(false);
  const [reordering, setReordering] = useState(false);
  const {
    isOpen: isMovieDetailOpen,
    onOpen: onMovieDetailOpen,
    onClose: onMovieDetailClose,
  } = useDisclosure();
  const [selectedMovie, setSelectedMovie] = useState<WatchlistItem | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<number | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movieToMove, setMovieToMove] = useState<WatchlistItem | null>(null);

  const slug = params?.slug as string;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  useEffect(() => {
    fetchWatchlistDetails();
  }, [slug, token]);

  // Fetch watchlist details
  const fetchWatchlistDetails = async () => {
    if (!slug) return;

    try {
      setLoading(true);

      // API endpoint
      const url = `http://localhost:8000/api/watchlists/categories/${slug}`;
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add authorization if logged in
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });

      if (response.ok) {
        const data = await response.json();

        setWatchlist(data);
        // Check if current user is the owner
        setIsEditable(
          isAuthenticated && data.owner.id === token ? data.owner.id : false,
        );
      } else if (response.status === 404) {
        router.push("/not-found");
      } else {
        // Other error
        console.error("Failed to fetch watchlist details");
      }
    } catch (error) {
      console.error("Error fetching watchlist details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle DnD end
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!active || !over || active.id === over.id) {
      return;
    }

    // Find the items being reordered
    const activeItem = watchlist?.items.find((item) => item.id === active.id);
    const overItem = watchlist?.items.find((item) => item.id === over.id);

    if (!activeItem || !overItem || !watchlist) {
      return;
    }

    // Calculate new sort orders
    const items = [...watchlist.items];
    const activeIndex = items.findIndex((item) => item.id === active.id);
    const overIndex = items.findIndex((item) => item.id === over.id);

    // Move the item
    const [removedItem] = items.splice(activeIndex, 1);

    items.splice(overIndex, 0, removedItem);

    // Update the sort orders
    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));

    // Update local state immediately for smooth UX
    setWatchlist({
      ...watchlist,
      items: updatedItems,
    });

    // Save the new order to the server
    if (token) {
      setReordering(true);
      try {
        const response = await fetch(
          `http://localhost:8000/api/watchlists/categories/${watchlist.id}/reorder`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              items: updatedItems.map((item) => ({
                id: item.id,
                sortOrder: item.sortOrder,
              })),
            }),
          },
        );

        if (!response.ok) {
          // If server update fails, revert to original order
          console.error("Failed to update watchlist order");
          fetchWatchlistDetails(); // Refresh from server
        }
      } catch (error) {
        console.error("Error updating watchlist order:", error);
        fetchWatchlistDetails(); // Refresh from server
      } finally {
        setReordering(false);
      }
    }
  };

  const handleMovieClick = (movie: WatchlistItem) => {
    setSelectedMovie(movie);
    onMovieDetailOpen();
  };

  const handleDeleteMovie = (id: number) => {
    setMovieToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteMovie = async () => {
    if (!token || !watchlist || movieToDelete === null) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/watchlists/categories/${watchlist.id}/movies/${movieToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        // Update local state
        setWatchlist({
          ...watchlist,
          items: watchlist.items.filter((item) => item.id !== movieToDelete),
        });
        setShowDeleteModal(false);
        setMovieToDelete(null);
      } else {
        console.error("Failed to delete movie from watchlist");
      }
    } catch (error) {
      console.error("Error deleting movie from watchlist:", error);
    }
  };

  const handleToggleLike = async () => {
    if (!token || !watchlist) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/watchlists/categories/${watchlist.id}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setWatchlist({
          ...watchlist,
          userHasLiked: data.liked,
          likesCount: data.likesCount,
        });
      } else {
        console.error("Failed to toggle like");
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleShareWatchlist = () => {
    if (!watchlist || !watchlist.isPublic) return;

    // Create a shareable URL
    const shareUrl = `${window.location.origin}/watchlist/${watchlist.slug}`;

    // Use the Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: watchlist.name,
          text:
            watchlist.description ||
            `Check out this watchlist: ${watchlist.name}`,
          url: shareUrl,
        })
        .catch((error) => {
          console.log("Error sharing:", error);
          // Fallback to copying to clipboard
          copyToClipboard(shareUrl);
        });
    } else {
      // Fallback for browsers that don't support the Web Share API
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };
  const handleMoveMovie = (item: WatchlistItem) => {
    setMovieToMove(item);
    setShowMoveModal(true);
  };

  // Filter movies based on search query
  const filteredMovies =
    watchlist?.items.filter((item) => {
      if (!searchQuery) return true;
      return item.title.toLowerCase().includes(searchQuery.toLowerCase());
    }) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!watchlist) {
    return (
      <div className="text-center py-12">
        <p>Watchlist not found or you don't have permission to view it.</p>
        <Button
          as={Link}
          href="/watchlists"
          variant="flat"
          color="primary"
          className="mt-4"
        >
          Go to My Watchlists
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button isIconOnly variant="light" onPress={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{watchlist.name}</h1>
            <div className="flex items-center gap-2 text-sm text-default-500">
              <div className="flex items-center">
                <UserCircle className="mr-1" size={14} />
                <span>{watchlist.owner.username}</span>
              </div>
              <div className="flex items-center">
                <Film className="mr-1" size={14} />
                <span>{watchlist.items.length} movies</span>
              </div>
              <Chip
                color={watchlist.isPublic ? "success" : "default"}
                size="sm"
                startContent={watchlist.isPublic ? <Globe size={12} /> : <Lock size={12} />}
                variant="flat"
              >
                {watchlist.isPublic ? "Public" : "Private"}
              </Chip>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isAuthenticated && (
            <Button
              color={watchlist.userHasLiked ? "danger" : "default"}
              startContent={<Heart size={18} className={watchlist.userHasLiked ? "fill-current" : ""} />}
              variant={watchlist.userHasLiked ? "solid" : "flat"}
              onPress={handleToggleLike}
            >
              {watchlist.likesCount}
            </Button>
          )}

          {watchlist.isPublic && (
            <Button
              startContent={<Share2 size={18} />}
              variant="flat"
              onPress={handleShareWatchlist}
            >
              Share
            </Button>
          )}

          {isEditable && (
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly variant="flat">
                  <MoreHorizontal size={18} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Watchlist actions">
                <DropdownItem
                  key="edit"
                  startContent={<Edit size={16} />}
                  onPress={() =>
                    router.push(`/watchlists/edit/${watchlist.slug}`)
                  }
                >
                  Edit Watchlist Settings
                </DropdownItem>
                <DropdownItem
                  key="add"
                  startContent={<Plus size={16} />}
                  onPress={() =>
                    router.push(`/discover?addToWatchlist=${watchlist.id}`)
                  }
                >
                  Add Movies
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </div>

      {/* Description */}
      {watchlist.description && (
        <p className="text-default-700">{watchlist.description}</p>
      )}

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex gap-2">
          <Button
            isIconOnly
            color={viewMode === 'grid' ? "primary" : "default"}
            variant={viewMode === 'grid' ? "solid" : "flat"}
            onPress={() => setViewMode('grid')}
          >
            <Grid size={18} />
          </Button>
          <Button
            isIconOnly
            color={viewMode === 'list' ? "primary" : "default"}
            variant={viewMode === 'list' ? "solid" : "flat"}
            onPress={() => setViewMode('list')}
          >
            <List size={18} />
          </Button>

          <div className="flex-1 sm:max-w-md">
            <Input
              placeholder="Search movies..."
              size="sm"
              startContent={<Search size={16} className="text-default-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isEditable && reordering && (
          <div className="text-sm text-default-500">
            <Spinner className="mr-2" size="sm" />
            Saving changes...
          </div>
        )}
      </div>

      {/* Movies */}
      {watchlist.items.length === 0 ? (
        <div className="text-center py-12">
          <Film className="mx-auto text-default-300 mb-4" size={48} />
          <p className="text-xl font-medium mb-2">
            No movies in this watchlist yet
          </p>
          {isEditable && (
            <Button
              className="mt-4"
              color="primary"
              startContent={<Plus size={16} />}
              onPress={() => router.push(`/discover?addToWatchlist=${watchlist.id}`)}
            >
              Add Movies
            </Button>
          )}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="text-center py-12">
          <p>No movies match your search.</p>
          <Button
            className="mt-4"
            variant="flat"
            onPress={() => setSearchQuery('')}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement]}
          sensors={sensors}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredMovies.map((item) => item.id)}
            strategy={
              viewMode === "grid"
                ? horizontalListSortingStrategy
                : verticalListSortingStrategy
            }
          >
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  : "space-y-2"
              }
            >
              {filteredMovies.map((item) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  item={item}
                  viewMode={viewMode}
                  onDeleteClick={isEditable ? handleDeleteMovie : () => {}}
                  onMovieClick={handleMovieClick}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Movie Detail Modal */}
      <Modal isOpen={isMovieDetailOpen} size="lg" onClose={onMovieDetailClose}>
        <ModalContent>
          {selectedMovie && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {selectedMovie.title}
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="md:w-1/3">
                    {selectedMovie.posterPath ? (
                      <Image
                        alt={selectedMovie.title}
                        className="w-full rounded-md"
                        src={`https://image.tmdb.org/t/p/w300${selectedMovie.posterPath}`}
                      />
                    ) : (
                      <div className="aspect-[2/3] bg-default-200 rounded-md flex items-center justify-center">
                        <Film className="text-default-400" size={48} />
                      </div>
                    )}
                  </div>
                  <div className="md:w-2/3">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold">
                          {selectedMovie.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedMovie.watched && (
                            <Chip color="success" variant="flat">
                              Watched
                            </Chip>
                          )}
                          {selectedMovie.isWinner && (
                            <Chip color="warning" variant="flat">
                              Movie Monday Winner
                            </Chip>
                          )}
                        </div>
                      </div>

                      {selectedMovie.userNote && (
                        <div>
                          <h4 className="font-medium text-sm text-default-500 mb-1">
                            Your Notes
                          </h4>
                          <p>{selectedMovie.userNote}</p>
                        </div>
                      )}

                      {selectedMovie.userRating && (
                        <div>
                          <h4 className="font-medium text-sm text-default-500 mb-1">
                            Your Rating
                          </h4>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={i < selectedMovie.userRating ? "text-warning fill-current" : "text-default-300"}
                                size={20}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium text-sm text-default-500 mb-1">
                          Added to Watchlist
                        </h4>
                        <p>
                          {new Date(selectedMovie.addedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {selectedMovie.watched && selectedMovie.watchedDate && (
                        <div>
                          <h4 className="font-medium text-sm text-default-500 mb-1">
                            Watched Date
                          </h4>
                          <p>
                            {new Date(
                              selectedMovie.watchedDate,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {isEditable && (
                        <div className="pt-4">
                          <Button
                            as={Link}
                            color="primary"
                            href={`/watchlists/${watchlist.id}/edit-movie/${selectedMovie.id}`}
                            startContent={<Edit size={16} />}
                            variant="flat"
                          >
                            Edit Details
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  as={Link}
                  endContent={<ExternalLink size={16} />}
                  href={`/movie/${selectedMovie.tmdbMovieId}`}
                  variant="light"
                >
                  View Full Details
                </Button>
                <Button color="primary" onPress={onMovieDetailClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <ModalContent>
          <ModalHeader>Remove Movie</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to remove this movie from the watchlist?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button color="danger" onPress={confirmDeleteMovie}>
              Remove
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default WatchlistDetail;
