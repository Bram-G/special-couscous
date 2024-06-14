
import react from 'react';
import { Card, CardHeader, CardBody, Image } from '@nextui-org/react';
import MovieCard from './MovieCard';
import { useState, useEffect } from 'react';

export default function Carousel() {
    const [popMovies, setPopMovies] = useState([]);

    function fetchPopMovies() {
        fetch('https://api.themoviedb.org/3/movie/popular?api_key=90cbd774a10d0fc91a95eec8954daa49').then((res) => res.json()).then((data) => {
            setPopMovies(data.results);
        });
        
    }

    useEffect(() => {
        fetchPopMovies();
        console.log(popMovies);
    }, [popMovies]);

    return (
        <section className="flex items-center justify-center gap-4 py-8 md:py-10">
            {popMovies.map((movie, index) => {
                return (
                    <Card className="py-4">
                        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                            <p className="text-tiny uppercase font-bold">{index+1}</p>
                            <small className="text-default-500">12 Tracks</small>
                            <h4 className="font-bold text-large">{movie.title}</h4>
                        </CardHeader>
                        <CardBody className="overflow-visible py-2">
                            <Image
                                alt="Card background"
                                className="object-cover rounded-xl"
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                width={270}
                            />
                        </CardBody>
                    </Card>
                );
            })}
        </section>
    );
}