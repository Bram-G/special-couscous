"use client";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Image } from "@nextui-org/react";

export default function MoviePage() {
  const [title, setTitle] = useState(null);
  const [overview, setOverview] = useState(null);
  const [release_date, setReleaseDate] = useState(null);
  const [poster_path, setPosterPath] = useState(null);
  const [backdrop_path, setBackdropPath] = useState(null);
  const [genres, setGenres] = useState(null);
  const [vote, setVote] = useState(null);

  useEffect(() => {
    console.log(process.env.NEXT_PUBLIC_Token_Auth);
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
      .then((res) => res.json())
      .then((json) => {
        setTitle(json.title);
        setOverview(json.overview);
        setReleaseDate(json.release_date);
        setPosterPath(json.poster_path);
        setBackdropPath(json.backdrop_path);
        setGenres(json.genres);
        setVote(json.vote_average);
        console.log(json);
      })
      .catch((err) => console.error("error:" + err));
  }, []);

  const router = useRouter();
  const pathname = usePathname();

  return (
    <div>
      <h1>{title}</h1>
      <p>{overview}</p>
      <Image
        isBlurred
        src={`https://image.tmdb.org/t/p/w500${backdrop_path}`}
        alt="backdrop"
      />
      <p>{release_date}</p>
      <Image
        isBlurred
        src={`https://image.tmdb.org/t/p/w500${poster_path}`}
        alt="poster"
      />
      <p>{vote}</p>
    </div>
  );
}
