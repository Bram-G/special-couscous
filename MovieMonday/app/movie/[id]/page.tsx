"use client";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { SetStateAction, useEffect, useState } from "react";
import { Chip, Image } from "@nextui-org/react";
import EmblaCarouselRec from "@/components/EmblaCarouselRec/EmblaCarouselRec";
import "./moviePage.css";

export default function MoviePage() {
  const [title, setTitle] = useState(null);
  const [overview, setOverview] = useState(null);
  const [release_date, setReleaseDate] = useState(null);
  const [poster_path, setPosterPath] = useState(null);
  const [backdrop_path, setBackdropPath] = useState(null);
  const [genres, setGenres] = useState([]);
  const [vote, setVote] = useState(null);
  const [budget, setBudget] = useState(null);
  const [productionCompanies, setProductionCompanies] = useState([]);
  const [productionLogo, setProductionLogo] = useState([]);

  useEffect(() => {
    const id = pathname.split("/").pop();
    const fetch = require("node-fetch");

    const url = `https://api.themoviedb.org/3/movie/${id}?language=en-US`;
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_Token_Auth}`,
      },
    };

    fetch(url, options)
      .then((res: { json: () => any }) => res.json())
      .then(
        (json: {
          title: SetStateAction<null>;
          overview: SetStateAction<null>;
          release_date: SetStateAction<null>;
          poster_path: SetStateAction<null>;
          backdrop_path: SetStateAction<null>;
          genres: ((prevState: never[]) => never[]) | { name: string }[];
          budget: SetStateAction<null>;
          vote_average: SetStateAction<null>;
          production_companies: any[];
        }) => {
          setTitle(json.title);
          setOverview(json.overview);
          setReleaseDate(json.release_date);
          setPosterPath(json.poster_path);
          setBackdropPath(json.backdrop_path);
          setGenres(json.genres);
          setBudget(json.budget);
          setVote(json.vote_average);
          const productionLogos = json.production_companies.map(
            (company: { logo_path: string }) => company.logo_path
          );
          const productionNames = json.production_companies.map(
            (company: { name: string }) => company.name
          );
          const genreNames = json.genres.map(
            (genre: { name: string }) => genre.name
          );
          setGenres(genreNames);
          setProductionCompanies(productionNames);
          setProductionLogo(productionLogos);
          const backdropImageUrl = `https://image.tmdb.org/t/p/original${backdrop_path}`;
    document.documentElement.style.setProperty('--dynamic-bg-image', `url(${backdropImageUrl})`);
        }
      )
      .catch((err: string) => console.error("error:" + err));
    console.log(productionCompanies);
    console.log(backdrop_path);
    
  }, []);

  const router = useRouter();
  const pathname = usePathname();
  const backdropImageUrl = `https://image.tmdb.org/t/p/original${backdrop_path}`;

  return (
    <div className="MoviePage w-full">
      <div
        className="bg-cover-dynamic"
      >
        <div className="MoviePageContainer">
          <div className="TopContainer h-1/4 w-full">
            <div className="TopLeftContainer">
              <div className="TitleText">{title}</div>
              <div className="DetailText">
                <div>{release_date}</div>
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
              src={`https://image.tmdb.org/t/p/w500${poster_path}`}
              alt="backdrop"
            />
          </div>
          <div className="MidRightContainer w-3/5">
            <div>
              {genres.map((genre, index) => (
                <Chip key={index}> {genre} </Chip>
              ))}
            </div>
            <div>{overview}</div>
            <div>{budget}</div>
            <div>
              {productionCompanies.map((company, index) => (
                <Chip key={index}> {company} </Chip>
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

// {
//   "adult": false,
//   "backdrop_path": "/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg",
//   "belongs_to_collection": {
//       "id": 1022790,
//       "name": "Inside Out Collection",
//       "poster_path": "/Apr19lGxP7gm6y2HQX0kqOXTtqC.jpg",
//       "backdrop_path": "/7U2m2dMSIfHx2gWXKq78Xj1weuH.jpg"
//   },
//   "budget": 200000000,
//   "genres": [
//       {
//           "id": 16,
//           "name": "Animation"
//       },
//       {
//           "id": 10751,
//           "name": "Family"
//       },
//       {
//           "id": 12,
//           "name": "Adventure"
//       },
//       {
//           "id": 35,
//           "name": "Comedy"
//       }
//   ],
//   "homepage": "https://movies.disney.com/inside-out-2",
//   "id": 1022789,
//   "imdb_id": "tt22022452",
//   "origin_country": [
//       "US"
//   ],
//   "original_language": "en",
//   "original_title": "Inside Out 2",
//   "overview": "Teenager Riley's mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions! Joy, Sadness, Anger, Fear and Disgust, who’ve long been running a successful operation by all accounts, aren’t sure how to feel when Anxiety shows up. And it looks like she’s not alone.",
//   "popularity": 5541.227,
//   "poster_path": "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
//   "production_companies": [
//       {
//           "id": 2,
//           "logo_path": "/wdrCwmRnLFJhEoH8GSfymY85KHT.png",
//           "name": "Walt Disney Pictures",
//           "origin_country": "US"
//       },
//       {
//           "id": 3,
//           "logo_path": "/1TjvGVDMYsj6JBxOAkUHpPEwLf7.png",
//           "name": "Pixar",
//           "origin_country": "US"
//       }
//   ],
//   "production_countries": [
//       {
//           "iso_3166_1": "US",
//           "name": "United States of America"
//       }
//   ],
//   "release_date": "2024-06-11",
//   "revenue": 1014362913,
//   "runtime": 97,
//   "spoken_languages": [
//       {
//           "english_name": "English",
//           "iso_639_1": "en",
//           "name": "English"
//       }
//   ],
//   "status": "Released",
//   "tagline": "Make room for new emotions.",
//   "title": "Inside Out 2",
//   "video": false,
//   "vote_average": 7.755,
//   "vote_count": 1127
// }
