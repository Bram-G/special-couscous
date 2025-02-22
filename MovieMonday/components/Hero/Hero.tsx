import React from "react";
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Link,
  Image,
  Button,
} from "@heroui/react";
import "./Hero.css";

interface Movie {
  id: number;
  backdrop_path: string;
  poster_path: string;
  title: string;
  release_date: string;
  vote_average: number;
}

export default function Hero() {
  const [popMovies5, setPopMovies5] = useState<Movie[]>([]);

  function fetchPopMovies() {
    fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_API_Key}`
    )
      .then((res) => res.json())
      .then((data: { results: Movie[] }) => {
        console.log(data.results);
        const top5 = data.results.slice(0, 5);
        setPopMovies5(top5);
        console.log(top5);
      });
  }

  useEffect(() => {
    fetchPopMovies();
  }, []);

  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);

  const handleNextSlide = () => {
    setCurrentMovieIndex((prevIndex) => (prevIndex + 1) % popMovies5.length);
  };

  const handlePrevSlide = () => {
    setCurrentMovieIndex((prevIndex) =>
      prevIndex === 0 ? popMovies5.length - 1 : prevIndex - 1
    );
  };

  return (
    <section>
      <div
        className="w-full bg-cover bg-center relative heroImageBG"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original/${popMovies5[currentMovieIndex]?.backdrop_path})`,
        }}
        onClick={() =>
          (window.location.href = `/movie/${popMovies5[currentMovieIndex]?.id}`)
        }
      >
        <button
          className="absolute top-1/2 left-2 transform -translate-y-1/2 text-white rounded-full p-2 NextPrevButton"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevSlide();
          }}
        >
          <svg aria-hidden="true" fill="#ffffff" height="50px" width="50px" viewBox="0 0 512 512" transform="matrix(-1, 0, 0, 1, 0, 0)">
            <path xmlns="http://www.w3.org/2000/svg" d="M256,0C114.62,0,0,114.62,0,256s114.62,256,256,256s256-114.62,256-256S397.38,0,256,0z M256,486.4 C128.956,486.4,25.6,383.044,25.6,256S128.956,25.6,256,25.6S486.4,128.956,486.4,256S383.044,486.4,256,486.4z"/>
            <path xmlns="http://www.w3.org/2000/svg" d="M341.854,246.955l-128-128.009c-5.001-5.001-13.099-5.001-18.099,0c-5.001,5-5.001,13.099,0,18.099L314.701,256 L195.746,374.946c-5.001,5-5.001,13.099,0,18.099c2.5,2.509,5.777,3.755,9.054,3.755c3.277,0,6.554-1.246,9.054-3.746l128-128 C346.854,260.053,346.854,251.955,341.854,246.955z"/>
          </svg>
        </button>
        <button
          className="absolute top-1/2 right-2 transform -translate-y-1/2 text-white rounded-full p-2 NextPrevButton"
          onClick={(e) => {
            e.stopPropagation();
            handleNextSlide();
          }}
        >
          <svg aria-hidden="true" fill="#ffffff" height="50px" width="50px" viewBox="0 0 512 512">
            <path xmlns="http://www.w3.org/2000/svg" d="M256,0C114.62,0,0,114.62,0,256s114.62,256,256,256s256-114.62,256-256S397.38,0,256,0z M256,486.4 C128.956,486.4,25.6,383.044,25.6,256S128.956,25.6,256,25.6S486.4,128.956,486.4,256S383.044,486.4,256,486.4z"/>
            <path xmlns="http://www.w3.org/2000/svg" d="M341.854,246.955l-128-128.009c-5.001-5.001-13.099-5.001-18.099,0c-5.001,5-5.001,13.099,0,18.099L314.701,256 L195.746,374.946c-5.001,5-5.001,13.099,0,18.099c2.5,2.509,5.777,3.755,9.054,3.755c3.277,0,6.554-1.246,9.054-3.746l128-128 C346.854,260.053,346.854,251.955,341.854,246.955z"/>
          </svg>
        </button>
        <img
          className="absolute bottom-4 left-20 w-40 object-cover posterImageHero"
          src={`https://image.tmdb.org/t/p/w200/${popMovies5[currentMovieIndex]?.poster_path}`}
          alt={popMovies5[currentMovieIndex]?.title}
        />
        <div className="absolute bottom-4 left-64 text-white text-2xl heroText">
          <div className="HeroInfo ">
            {popMovies5[currentMovieIndex]?.title}
          </div>
          <div className="HeroInfoSmall ">
            {new Date(
              popMovies5[currentMovieIndex]?.release_date
            ).toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}{" "}
            | {popMovies5[currentMovieIndex]?.vote_average.toFixed(1)} ★
          </div>
        </div>
      </div>
    </section>
  );
}