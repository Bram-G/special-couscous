"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Spinner,
} from "@heroui/react";
import { Search, Film, Plus } from "lucide-react";
import debounce from "lodash/debounce";

import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TmdbMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date?: string;
}

export interface AddedMovieSelection {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath: string | null;
  isWinner: boolean;
}

interface AddMovieSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieMondayId: number;
  onAdded: (movieSelection: AddedMovieSelection) => void;
}

export default function AddMovieSearchModal({
  isOpen,
  onClose,
  movieMondayId,
  onAdded,
}: AddMovieSearchModalProps) {
  const { token } = useAuth();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<TmdbMovie[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset state whenever the modal is opened.
  useEffect(() => {
    if (isOpen) {
      setTerm("");
      setResults([]);
      setSearching(false);
      setAddingId(null);
      setError(null);
    }
  }, [isOpen]);

  const runSearch = useRef(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setSearching(false);

        return;
      }

      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
            query,
          )}&include_adult=false&language=en-US&page=1&api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
        );

        if (!res.ok) throw new Error(`TMDB error ${res.status}`);

        const data = await res.json();

        setResults((data.results || []).slice(0, 8));
      } catch (err) {
        console.error("Movie search failed:", err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300),
  ).current;

  const handleTermChange = (value: string) => {
    setTerm(value);
    setError(null);

    if (value.trim()) {
      setSearching(true);
      runSearch(value);
    } else {
      setResults([]);
      setSearching(false);
    }
  };

  const handleAdd = async (movie: TmdbMovie) => {
    setAddingId(movie.id);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/movie-monday/add-movie`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          movieMondayId,
          tmdbMovieId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to add movie");
      }

      onAdded({
        id: data.movieSelection?.id,
        tmdbMovieId: movie.id,
        title: data.movieSelection?.title || movie.title,
        posterPath:
          data.movieSelection?.posterPath ?? movie.poster_path ?? null,
        isWinner: false,
      });
      onClose();
    } catch (err) {
      console.error("Add movie failed:", err);
      setError(err instanceof Error ? err.message : "Failed to add movie");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="lg" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">Add a movie</ModalHeader>
        <ModalBody>
          <Input
            placeholder="Search movies..."
            startContent={<Search className="h-4 w-4 text-default-400" />}
            value={term}
            onValueChange={handleTermChange}
          />

          {error ? <p className="text-danger text-sm">{error}</p> : null}

          {searching ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : results.length > 0 ? (
            <div className="flex flex-col divide-y divide-default-100">
              {results.map((movie) => (
                <div key={movie.id} className="flex items-center gap-3 py-2">
                  <div className="relative w-10 h-[60px] flex-shrink-0 rounded-md overflow-hidden bg-default-200">
                    {movie.poster_path ? (
                      <img
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-4 h-4 text-default-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {movie.title}
                    </p>
                    <p className="text-xs text-default-500">
                      {movie.release_date
                        ? new Date(movie.release_date).getFullYear()
                        : "Unknown"}
                    </p>
                  </div>

                  <Button
                    color="primary"
                    isLoading={addingId === movie.id}
                    isDisabled={addingId !== null}
                    size="sm"
                    startContent={
                      addingId === movie.id ? undefined : (
                        <Plus className="h-4 w-4" />
                      )
                    }
                    onPress={() => handleAdd(movie)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          ) : term.trim() ? (
            <p className="text-center text-sm text-default-500 py-6">
              No results found
            </p>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
