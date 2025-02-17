import React from "react";
import { EmblaOptionsType } from "embla-carousel";
import {
  PrevButton,
  NextButton,
  usePrevNextButtons,
} from "./EmblaCarouselArrowButtons";
import useEmblaCarousel from "embla-carousel-react";
import "./embla.css";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardBody, Image } from "@nextui-org/react";

type PropType = {
  slides: number[];
  options?: EmblaOptionsType;
};

const EmblaCarousel: React.FC<PropType> = (props) => {
  const [popMovies, setPopMovies] = useState([]);
  function fetchPopMovies() {
    fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_API_Key}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log(data.results);
        setPopMovies(data.results);
      });
  }

  useEffect(() => {
    fetchPopMovies();
  }, []);

  const { slides, options } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  return (
    <section className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {popMovies.map((movie, index) => (
            <div key={movie.id} className="embla__slide w-1/3 flex flex-col">
              <a href={`/movie/${movie.id}`}>
              <Image isBlurred width={240} src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}/>
              </a>

            </div>

          ))}
        </div>
      </div>

      <div className="embla__controls">
        <div className="embla__buttons">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>
      </div>
    </section>
  );
};

export default EmblaCarousel;
