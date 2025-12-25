import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "@heroui/react";
import { Calendar } from "lucide-react";

interface MovieMondayData {
  id: number;
  date: string;
  status: string;
  movieSelections: Array<{
    id: number;
    tmdbMovieId: number;
    title: string;
  }>;
  picker: {
    id: string;
    username: string;
  };
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
interface MovieMondaySelectorProps {
  isOpen: boolean;
  onOpenChange: () => void;
  onSelect: (movieMondayId: number) => Promise<void>;
  token: string | null;
}

const MovieMondaySelector = ({
  isOpen,
  onOpenChange,
  onSelect,
  token,
}: MovieMondaySelectorProps) => {
  const [movieMondays, setMovieMondays] = useState<MovieMondayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addingMovie, setAddingMovie] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      fetchMovieMondays();
    }
  }, [isOpen, token]);

  const fetchMovieMondays = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/available`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter movie mondays with less than 3 movies
        const availableMondays = data.filter(
          (mm: MovieMondayData) => mm.movieSelections.length < 3
        );

        setMovieMondays(availableMondays);
      }
    } catch (error) {
      console.error("Error fetching movie mondays:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async () => {
    if (!selectedId) return;

    setAddingMovie(true);
    try {
      await onSelect(selectedId);
      // Show success message
      onOpenChange();
    } catch (error) {
      // Show error message
      console.error("Failed to add movie:", error);
      // You might want to add error notification here
    } finally {
      setAddingMovie(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Add to Movie Monday
            </ModalHeader>
            <ModalBody>
              {loading ? (
                <div className="flex justify-center p-4">
                  <Spinner size="lg" />
                </div>
              ) : movieMondays.length === 0 ? (
                <p className="text-center text-default-500">
                  No available Movie Mondays found. Create a new Movie Monday
                  first!
                </p>
              ) : (
                <div className="space-y-2">
                  {movieMondays.map((mm) => (
                    <Button
                      key={mm.id}
                      className="w-full justify-start"
                      startContent={<Calendar className="h-4 w-4" />}
                      variant={selectedId === mm.id ? "solid" : "light"}
                      onPress={() => setSelectedId(mm.id)}
                    >
                      <div className="flex flex-col items-start">
                        <span>{formatDate(mm.date)}</span>
                        <span className="text-xs text-default-500">
                          {3 - mm.movieSelections.length} slots available
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                isDisabled={!selectedId}
                isLoading={addingMovie}
                onPress={handleSelect}
              >
                Add Movie
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default MovieMondaySelector;
