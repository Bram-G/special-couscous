"use client";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {Button, ButtonGroup} from "@heroui/button";
import { useEffect, useState } from "react";
import { Chip, Image } from "@nextui-org/react";
import EmblaCarouselRec from "@/components/EmblaCarouselRec/EmblaCarouselRec";
import "./moviePage.css";

// Define interfaces for the data types
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

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const id = pathname.split("/").pop();
    const fetchMovieDetails = async () => {
      try {
        const url = `https://api.themoviedb.org/3/movie/${id}?language=en-US`;
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
        
        // Map genres to an array of genre names
        const genreNames = json.genres.map((genre) => genre.name);
        setGenres(genreNames);
        
        setBudget(json.budget);
        setVote(json.vote_average);
        
        // Map production companies to names and logos
        const productionNames = json.production_companies.map(
          (company) => company.name
        );
        const productionLogos = json.production_companies.map(
          (company) => company.logo_path
        );
        
        setProductionCompanies(productionNames);
        setProductionLogo(productionLogos);

        // Set dynamic background image
        if (json.backdrop_path) {
          const backdropImageUrl = `https://image.tmdb.org/t/p/original${json.backdrop_path}`;
          document.documentElement.style.setProperty('--dynamic-bg-image', `url(${backdropImageUrl})`);
        }
      } catch (error) {
        console.error("Error fetching movie details:", error);
      }
    };

    if (id) {
      fetchMovieDetails();
    }
  }, [pathname]);

  // Only generate backdropImageUrl if backdropPath exists
  const backdropImageUrl = backdropPath 
    ? `https://image.tmdb.org/t/p/original${backdropPath}` 
    : '';

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
        <div className="MidContainer">
          <div className="w-1/4 h-full">
            <Image
              className="w-full h-full"
              isBlurred
              src={posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : ''}
              alt="Movie Poster"
            />
          </div>
          <div className="MidRightContainer w-3/5">
            <div><h1>Genres:</h1>
              {genres.map((genre, index) => (
                <Chip key={index}>{genre}</Chip>
              ))}
            </div>
            <div><h1>Description:</h1> {overview}</div>
            <div> <h1>Budget:</h1> {budget?.toLocaleString()}</div>
            <Button color="primary">Add to Watch List </Button>
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
    </div>
  );
}