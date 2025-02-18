"use client";

import MovieMondaySelector from "@/components/MovieMondaySelector";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Button, ButtonGroup } from "@nextui-org/react";
import { useEffect, useState } from "react";
import { Chip, Image } from "@nextui-org/react";
import { useAuth } from "@/contexts/AuthContext";
import EmblaCarouselRec from "@/components/EmblaCarouselRec/EmblaCarouselRec";
import "./moviePage.css";

interface WatchLaterMovie {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath: string;
}
interface Genre {
  id: number;
  name: string;
}

interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

interface MovieDetails {
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  genres: Genre[];
  budget: number;
  vote_average: number;
  production_companies: ProductionCompany[];
}

export default function MoviePage() {
  const [title, setTitle] = useState<string | null>(null);
  const [overview, setOverview] = useState<string | null>(null);
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [posterPath, setPosterPath] = useState<string | null>(null);
  const [backdropPath, setBackdropPath] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [vote, setVote] = useState<number | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [productionCompanies, setProductionCompanies] = useState<string[]>([]);
  const [productionLogo, setProductionLogo] = useState<(string | null)[]>([]);
  const [isInWatchLater, setIsInWatchLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMovieMondayModal, setShowMovieMondayModal] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuth();

  const movieId = pathname.split("/").pop();

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const url = `https://api.themoviedb.org/3/movie/${movieId}?language=en-US`;
        const options = {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_Token_Auth}`,
          },
        };

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json: MovieDetails = await response.json();

        setTitle(json.title);
        setOverview(json.overview);
        setReleaseDate(json.release_date);
        setPosterPath(json.poster_path);
        setBackdropPath(json.backdrop_path);

        const genreNames = json.genres.map((genre) => genre.name);
        setGenres(genreNames);

        setBudget(json.budget);
        setVote(json.vote_average);

        const productionNames = json.production_companies.map(
          (company) => company.name
        );
        const productionLogos = json.production_companies.map(
          (company) => company.logo_path
        );

        setProductionCompanies(productionNames);
        setProductionLogo(productionLogos);

        if (json.backdrop_path) {
          const backdropImageUrl = `https://image.tmdb.org/t/p/original${json.backdrop_path}`;
          document.documentElement.style.setProperty(
            "--dynamic-bg-image",
            `url(${backdropImageUrl})`
          );
        }

        // Check watch later status
        if (token) {
          checkWatchLaterStatus();
        }
      } catch (error) {
        console.error("Error fetching movie details:", error);
      }
    };

    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId, token]);

  const handleAddToMovieMonday = async (movieMondayId: number) => {
    if (!token || !movieId || !title) {
      console.error('Missing required data:', { token: !!token, movieId, title });
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:8000/api/movie-monday/add-movie`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieMondayId,
          tmdbMovieId: parseInt(movieId as string),
          title,
          posterPath
        })
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add movie to Movie Monday');
      }
  
      // Show success message
      // You might want to add a toast or notification here
      console.log('Movie added successfully:', data);
    } catch (error) {
      console.error('Error adding movie to Movie Monday:', error);
      // You might want to add error notification here
      throw error; // Re-throw to be handled by the modal
    }
  };

  const checkWatchLaterStatus = async () => {
    if (!token || !movieId) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/movie-monday/watch-later/status/${movieId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsInWatchLater(data.isInWatchLater);
      }
    } catch (error) {
      console.error("Error checking watch later status:", error);
    }
  };

  const toggleWatchLater = async () => {
    if (!token || !movieId || loading) return;

    setLoading(true);
    try {
      if (isInWatchLater) {
        // Find the watch later entry first
        const watchLaterResponse = await fetch(
          "http://localhost:8000/api/movie-monday/watch-later",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!watchLaterResponse.ok) {
          throw new Error(`HTTP error! status: ${watchLaterResponse.status}`);
        }

        const watchLaterData = await watchLaterResponse.json();
        console.log("Watch Later Data:", watchLaterData); // Debug the response

        // Ensure we're working with an array
        const watchLaterList: WatchLaterMovie[] = Array.isArray(watchLaterData)
          ? watchLaterData
          : [];
        const movieEntry = watchLaterList.find(
          (item) => item.tmdbMovieId === parseInt(movieId as string)
        );

        if (movieEntry) {
          // Remove from watch later using the entry's id
          const deleteResponse = await fetch(
            `http://localhost:8000/api/movie-monday/watch-later/${movieEntry.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!deleteResponse.ok) {
            throw new Error(`Failed to delete movie: ${deleteResponse.status}`);
          }
        } else {
          console.warn("Movie not found in watch later list");
        }
      } else {
        // Add to watch later
        const addResponse = await fetch(
          "http://localhost:8000/api/movie-monday/watch-later",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tmdbMovieId: parseInt(movieId as string),
              title,
              posterPath,
            }),
          }
        );

        if (!addResponse.ok) {
          throw new Error(`Failed to add movie: ${addResponse.status}`);
        }
      }

      setIsInWatchLater(!isInWatchLater);
    } catch (error) {
      console.error("Error toggling watch later:", error);
      // You might want to add some user feedback here
    } finally {
      setLoading(false);
    }
  };

  const backdropImageUrl = backdropPath
    ? `https://image.tmdb.org/t/p/original${backdropPath}`
    : "";

  return (
    <div className="MoviePage w-full">
      <div className="bg-cover-dynamic">
        <div className="MoviePageContainer">
          <div className="TopContainer h-1/4 w-full">
            <div className="TopLeftContainer">
              <div className="TitleText">{title}</div>
              <div className="DetailText">
                <div>{releaseDate}</div>
                <div>{vote}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="MidContainer rounded-large">
          <div className="w-1/4 h-full">
            <Image
              className="w-full h-full"
              isBlurred
              src={
                posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : ""
              }
              alt="Movie Poster"
            />
          </div>
          <div className="MidRightContainer w-3/5">
            <div>
              <h1>Genres:</h1>
              {genres.map((genre, index) => (
                <Chip key={index}>{genre}</Chip>
              ))}
            </div>
            <div>
              <h1>Description:</h1> {overview}
            </div>
            <div>
              <h1>Budget:</h1> {budget?.toLocaleString()}
            </div>

            <div className="flex gap-2">
              <Button
                color={isInWatchLater ? "success" : "primary"}
                onPress={toggleWatchLater}
                isLoading={loading}
              >
                {isInWatchLater
                  ? "Remove from Watch Later"
                  : "Add to Watch Later"}
              </Button>

              {token && (
                <Button
                  color="secondary"
                  onPress={() => setShowMovieMondayModal(true)}
                >
                  Add to Movie Monday
                </Button>
              )}
            </div>

            <div>
              {productionCompanies.map((company, index) => (
                <Chip key={index}>{company}</Chip>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="BottomContainer">
        <div className="ActorContainer"></div>
        <div className="RecommendedContainer">
          <EmblaCarouselRec slides={[]} />
        </div>
      </div>
      <MovieMondaySelector
        isOpen={showMovieMondayModal}
        onOpenChange={() => setShowMovieMondayModal(false)}
        onSelect={handleAddToMovieMonday}
        token={token}
      />
    </div>
  );
}
