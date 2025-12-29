"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  Chip,
  Spinner,
  Divider,
} from "@heroui/react";
import { Calendar, Users, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface Movie {
  id: number;
  title: string;
  poster_path?: string;
}

interface MovieMonday {
  id: number;
  date: string;
  status: string;
  pickerUserId: number;
  picker: {
    id: number;
    username: string;
  };
  movieSelections: Array<{
    id: number;
    title: string;
    tmdbMovieId: number;
    isWinner: boolean;
  }>;
}

interface AddToMovieMondayModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie | null;
  onSuccess?: () => void;
}

export default function AddToMovieMondayModal({
  isOpen,
  onClose,
  movie,
  onSuccess,
}: AddToMovieMondayModalProps) {
  const { currentGroupId, token } = useAuth();
  const [movieMondays, setMovieMondays] = useState<MovieMonday[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentGroupId) {
      fetchMovieMondays();
    }
  }, [isOpen, currentGroupId]);

  const fetchMovieMondays = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/group/${currentGroupId}?includeSelections=true&status=pending,in-progress`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Movie Mondays");
      }

      const data = await response.json();
      // Filter to only show events that don't have 3 movies yet
      const availableEvents = data.filter(
        (event: MovieMonday) =>
          event.movieSelections.length < 3 &&
          !event.movieSelections.some(
            (selection) => selection.tmdbMovieId === movie?.id
          )
      );
      setMovieMondays(availableEvents);
    } catch (err) {
      console.error("Error fetching Movie Mondays:", err);
      setError("Failed to load available Movie Mondays");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToMovieMonday = async (movieMondayId: number) => {
    if (!movie) return;

    try {
      setAdding(movieMondayId);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/movie-monday/add-movie`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          movieMondayId,
          tmdbMovieId: movie.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to add movie");
      }

      // Success!
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error adding movie:", err);
      setError(err instanceof Error ? err.message : "Failed to add movie");
    } finally {
      setAdding(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "in-progress":
        return "primary";
      case "completed":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      size="2xl"
      onClose={onClose}
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold">Add to Movie Monday</h2>
          {movie && (
            <p className="text-sm text-default-500 font-normal">
              {movie.title}
            </p>
          )}
        </ModalHeader>

        <ModalBody>
          {error && (
            <Card className="bg-danger-50 border border-danger-200 p-4 mb-4">
              <p className="text-danger-600 text-sm">{error}</p>
            </Card>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner size="lg" />
            </div>
          ) : movieMondays.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-default-300" />
                <h3 className="text-lg font-semibold mb-2">
                  No available Movie Monday events
                </h3>
                <p className="text-default-500 text-sm">
                  All upcoming Movie Monday events are full, or this movie is already
                  added to all events. Check back later or create a new event.
                </p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-default-600">
                Select which Movie Monday event to add this movie to:
              </p>

              {movieMondays.map((monday) => (
                <Card
                  key={monday.id}
                  isPressable
                  className="p-4 hover:bg-default-100 transition-colors"
                  onPress={() => handleAddToMovieMonday(monday.id)}
                  isDisabled={adding !== null}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <p className="font-semibold">{formatDate(monday.date)}</p>
                        <Chip
                          color={getStatusColor(monday.status)}
                          size="sm"
                          variant="flat"
                        >
                          {monday.status}
                        </Chip>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-default-600">
                        <Users className="w-3 h-3" />
                        <span>Picker: {monday.picker.username}</span>
                      </div>

                      {monday.movieSelections.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-default-500 mb-1">
                            Current selections ({monday.movieSelections.length}/3):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {monday.movieSelections.map((selection) => (
                              <Chip key={selection.id} size="sm" variant="flat">
                                {selection.title}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      color="primary"
                      size="sm"
                      isLoading={adding === monday.id}
                      onPress={() => handleAddToMovieMonday(monday.id)}
                    >
                      {adding === monday.id ? "Adding..." : "Add"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="default" variant="light" onPress={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}