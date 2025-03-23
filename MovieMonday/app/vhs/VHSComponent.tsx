'use client'

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import dynamic from 'next/dynamic';

// Dynamically import the VHSTape component with no SSR
const VHSTape = dynamic(() => import('./VHSTape'), { ssr: false });

interface VHSComponentProps {
  movies: {
    id: number;
    title: string;
    posterPath: string;
  }[];
}

const VHSComponent: React.FC<VHSComponentProps> = ({ movies }) => {
  return (
    <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      <Canvas shadows camera={{ position: [0, 0, 15], fov: 50 }}>
        <color attach="background" args={['#111']} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} />
        
        <Suspense fallback={null}>
          {movies.map((movie, index) => (
            <VHSTape
              key={movie.id}
              posterUrl={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
              title={movie.title}
              position={[(index - movies.length / 2) * 3, 0, 0]}
            />
          ))}
        </Suspense>
        
        <OrbitControls enableZoom={true} enablePan={true} />
      </Canvas>
    </div>
  );
};

export default VHSComponent;