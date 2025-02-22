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
import { Card, CardHeader, CardBody, Image } from "@heroui/react";

type PropType = {
  slides: number[];
  options?: EmblaOptionsType;
};

const EmblaCarouselRec: React.FC<PropType> = (props): React.ReactNode => {
  const [recMoviesList, setRecMoviesList] = useState([]);
  function recMovies() {
    const id = window.location.pathname.split("/").pop();
    const options = {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_Token_Auth}`,
      },
    };

    if (id) {
      const recommendationsUrl = `https://api.themoviedb.org/3/movie/${id}/recommendations?&language=en-US&page=1`;

      fetch(recommendationsUrl, options)
        .then((res: { json: () => any }) => res.json())
        .then((data) => {
          console.log(data.results);
          setRecMoviesList(data.results);
        })
        // Process the recommendations here
        // For example, set state with the recommendations data
        .catch((err: any) =>
          console.error("Error fetching recommendations:", err)
        );
    }
  }

  useEffect(() => {
    recMovies();
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
          {recMoviesList.map(
            (movie: { id: any; poster_path: any; title: any }, index: any) => (
              <div key={movie.id} className="embla__slide w-1/3 flex flex-col">
                <a href={`/movie/${movie.id}`}>
                  <Image
                    isBlurred
                    width={240}
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  />
                  <div className="glassCover">
                    <h1>{movie.title}</h1>
                  </div>
                </a>
              </div>
            )
          )}
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

export default EmblaCarouselRec;
