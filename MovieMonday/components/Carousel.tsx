
import react from 'react';
import { Card, CardHeader, CardBody, Image } from '@nextui-org/react';
import MovieCard from './MovieCard';
import { useState, useEffect } from 'react';
import Slider from "react-slick";

export default function Carousel() {
    const [popMovies, setPopMovies] = useState([]);

    function fetchPopMovies() {
        fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_API_Key}`).then((res) => res.json()).then((data) => {
            console.log(data.results);
            setPopMovies(data.results);
        });
        
    }

        const settings = {
          dots: true,
          infinite: true,
          speed: 500,
          slidesToShow: 5,
          slidesToScroll: 3
        }

    useEffect(() => {
        fetchPopMovies();
    }, []);

    return (
        <div>
            <Slider {...settings}>
            {popMovies.map((movie, index) => {
                return (
                    <div className='flex flex-row'>

                    <Card className="w-1/3 py-4 h-400 flex">
                        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                            <p className="text-tiny uppercase font-bold">{index+1}</p>
                            <small className="text-default-500">12 Tracks</small>
                            <h4 className="font-bold text-large">{movie.title}</h4>
                        </CardHeader>
                        <CardBody className="overflow-visible py-2">
                            <a href={`/movie/${movie.id}`}>
                            <Image
                                alt="Card background"
                                className="object-cover rounded-xl"
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                width={270}
                                />
                            </a>
                        </CardBody>
                    </Card>
                                </div>
                );
                })}
            </Slider>
        </div>
    );
}