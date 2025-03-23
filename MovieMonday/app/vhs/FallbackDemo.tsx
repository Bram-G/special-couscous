'use client'

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';

// This is a fallback demo that doesn't use Three.js at all
// Instead, it simply creates a CSS 3D-like effect with regular DOM elements
const FallbackVHSDemo = ({ movies }) => {
  return (
    <div className="w-full py-8 bg-gray-900 rounded-lg overflow-hidden">
      <h3 className="text-white text-center mb-6">VHS Collection</h3>
      
      <div className="flex justify-center items-center gap-8 overflow-x-auto py-4 px-8">
        {movies.map((movie) => (
          <div 
            key={movie.id} 
            className="min-w-[200px] perspective-500 transform-gpu"
          >
            <div className="relative h-[300px] w-[200px] transform-style-3d animate-rotate-y">
              {/* VHS Front (with movie poster) */}
              <div className="absolute inset-0 backface-hidden bg-gray-800 rounded-md shadow-lg">
                <div className="w-full h-4/5 bg-black">
                  <div className="relative w-full h-full overflow-hidden">
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                      alt={movie.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="p-2 text-white">
                  <p className="text-sm font-medium truncate">{movie.title}</p>
                </div>
              </div>
              
              {/* VHS Back */}
              <div className="absolute inset-0 backface-hidden bg-gray-800 rounded-md shadow-lg rotate-y-180">
                <div className="p-4 h-full flex flex-col">
                  <div className="flex-1 bg-black mb-2"></div>
                  <div className="h-1/4 bg-gray-900 flex items-center justify-center">
                    <p className="text-white text-xs">{movie.title}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-gray-400 text-sm text-center mt-6">
        This is a fallback demo using CSS 3D effects instead of Three.js
      </p>
    </div>
  );
};

export default FallbackVHSDemo;