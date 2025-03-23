import React, { useState, useEffect } from "react";
import { EmblaOptionsType } from "embla-carousel";
import {
  PrevButton,
  NextButton,
  usePrevNextButtons,
} from "./EmblaCarouselArrowButtons";
import useEmblaCarousel from "embla-carousel-react";
import "./embla.css";
import VHSMovieItem from "../VHS/VHSMovieItem";
import VHSModeToggle from "../VHS/VHSModeToggle";

type PropType = {
  slides: number[];
  options?: EmblaOptionsType;
};

const EmblaCarousel: React.FC<PropType> = (props) => {
  const [popMovies, setPopMovies] = useState([]);
  const [vhsMode, setVhsMode] = useState(false);
  const [isVHSSupported, setIsVHSSupported] = useState(false);
  
  // Check browser support and load user preference
  useEffect(() => {
    // Check if WebGL is supported
    const checkWebGLSupport = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return false;
        
        // Basic capability check
        const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowPowerDevice = isMobile && !(/iPad|Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        return gl && !isLowPowerDevice && !prefersReducedMotion;
      } catch (e) {
        console.error('Error checking WebGL support:', e);
        return false;
      }
    };
    
    // Set if VHS mode is supported
    const supported = checkWebGLSupport();
    setIsVHSSupported(supported);
    
    // Load user preference, or default based on device capability
    try {
      const savedPreference = localStorage.getItem('vhs3dMode');
      if (savedPreference !== null) {
        setVhsMode(savedPreference === 'true' && supported);
      } else {
        // Default to enabled on supported desktop, disabled on mobile
        setVhsMode(supported && window.innerWidth >= 768);
      }
    } catch (e) {
      // If localStorage is not available, default to disabled
      setVhsMode(false);
    }
    
    // Preload Three.js if VHS mode is supported
    if (supported) {
      // Use requestIdleCallback if available, otherwise setTimeout
      const preloadResources = () => {
        // Preload Three.js
        import('three').catch(err => {
          console.error('Error preloading Three.js:', err);
        });
      };
      
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(preloadResources, { timeout: 5000 });
      } else {
        setTimeout(preloadResources, 3000);
      }
    }
  }, []);

  // Save preference when it changes
  useEffect(() => {
    try {
      localStorage.setItem('vhs3dMode', vhsMode.toString());
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [vhsMode]);

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
  
  // Toggle VHS mode
  const handleToggleVHSMode = () => {
    setVhsMode(!vhsMode);
  };
  
  // Handle movie click
  const handleMovieClick = (movieId) => {
    window.location.href = `/movie/${movieId}`;
  };

  return (
    <section className="embla">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Popular Movies</h2>
        {isVHSSupported && (
          <VHSModeToggle enabled={vhsMode} onChange={handleToggleVHSMode} />
        )}
      </div>
      
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {popMovies.map((movie, index) => (
            <div key={movie.id} className="embla__slide w-1/3 flex flex-col">
              <VHSMovieItem 
                movie={movie}
                enable3D={vhsMode && isVHSSupported}
                width={240}
                height={320}
                onMovieClick={handleMovieClick}
              />
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