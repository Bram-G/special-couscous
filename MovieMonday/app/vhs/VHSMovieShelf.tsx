import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import VHSTape from './VHSTape';

// Main component that manages multiple VHS tapes
const VHSMovieShelf = ({ movies }) => {
  return (
    <div className="w-full h-96">
      <Canvas shadows camera={{ position: [0, 0, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} castShadow />
        <pointLight position={[-10, -10, -10]} />
        
        {/* Display VHS tapes in a row */}
        {movies.map((movie, index) => (
          <VHSTape
            key={movie.id}
            posterUrl={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
            title={movie.title}
            position={[(index - movies.length / 2) * 3, 0, 0]}
          />
        ))}
        
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
};

export default VHSMovieShelf;