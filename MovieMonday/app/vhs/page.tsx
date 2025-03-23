'use client'

import React, { useEffect, useState } from 'react';
import MinimalVHSDemo from './MinimalVHSDemo';

export default function VHSPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  // Only render on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Sample movie data
  const sampleMovies = [
    {
      id: 1,
      title: 'The Matrix',
      posterPath: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg'
    },
    {
      id: 2,
      title: 'Pulp Fiction',
      posterPath: '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg'
    },
    {
      id: 3,
      title: 'The Shawshank Redemption',
      posterPath: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg'
    }
  ];

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">VHS Movie Collection</h1>
      
      <div className="mb-10">
        <MinimalVHSDemo movies={sampleMovies} />
      </div>
      
      <div className="max-w-2xl mx-auto bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">About This Demo</h2>
        <p className="mb-4">
          This is a minimal demo showing a VHS tape visualization.
        </p>
      </div>
    </div>
  );
}