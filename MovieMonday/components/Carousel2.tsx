import react from "react";
import { Card, CardHeader, CardBody, Image } from "@heroui/react";
import MovieCard from "./MovieCard";
import { useState, useEffect } from "react";
import { EmblaOptionsType } from "embla-carousel";
import EmblaCarousel from "./EmblaCarousel/EmblaCarousel";

export default function Carousel() {
  const [popMovies, setPopMovies] = useState([]);

  const OPTIONS: EmblaOptionsType = { slidesToScroll: "auto" };
  const SLIDE_COUNT = popMovies.length;
  const SLIDES = Array.from(Array(SLIDE_COUNT).keys())



  return (
    <div>
      <EmblaCarousel slides={SLIDES} options={OPTIONS}/>
      
    </div>
  );
}
