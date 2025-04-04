// MovieMonday/components/Watchlist/AddToWatchlistButton.tsx
import React, { useState } from 'react';
import { Button, useDisclosure, Tooltip } from "@heroui/react";
import { Heart, Plus, Check, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AddToWatchlistModal from './AddToWatchlistModal';
import useWatchlistStatus from '@/hooks/useWatchlistStatus';

interface MovieDetails {
  id: number;
  title: string;
  posterPath?: string | null;
}

interface AddToWatchlistButtonProps {
  movie: MovieDetails;
  variant?: 'solid' | 'flat' | 'light' | 'ghost' | 'bordered';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  text?: string;
  showText?: boolean;
  onSuccess?: () => void;
  useQuickAdd?: boolean;
}

const AddToWatchlistButton: React.FC<AddToWatchlistButtonProps> = ({
  movie,
  variant = 'solid',
  color = 'primary',
  size,
  fullWidth = false,
  className = '',
  text = 'Add to Watchlist',
  showText = true,
  onSuccess,
  useQuickAdd = false
}) => {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [showSuccessTooltip, setShowSuccessTooltip] = useState(false);
  
  // Use our custom hook to check if this movie is already in a watchlist
  const { inWatchlist, refresh, isLoading } = useWatchlistStatus(movie.id);
  
  // Handle quick add to default watchlist
  const handleQuickAdd = async () => {
    if (!isAuthenticated || !token) {
      // Store the current URL for redirection after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      router.push('/login');
      return;
    }
    
    // If the movie is already in a watchlist, show the modal instead
    if (inWatchlist) {
      onOpen();
      return;
    }
    
    try {
      setQuickAddLoading(true);
      
      const response = await fetch('http://localhost:8000/api/watchlists/quick-add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tmdbMovieId: movie.id,
          title: movie.title,
          posterPath: movie.posterPath
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        // Update the status
        await refresh();
        
        // Show success tooltip
        setShowSuccessTooltip(true);
        setTimeout(() => {
          setShowSuccessTooltip(false);
        }, 2000);
        
        // Call success handler if provided
        if (onSuccess) onSuccess();
      } else {
        // If there's an error, fall back to the modal
        onOpen();
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      // Fall back to the modal on error
      onOpen();
    } finally {
      setQuickAddLoading(false);
    }
  };
  
  // Handle button click based on auth status and quick add preference
  const handleClick = () => {
    if (!isAuthenticated) {
      // Store the current URL for redirection after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      router.push('/login');
      return;
    }
    
    if (useQuickAdd) {
      handleQuickAdd();
    } else {
      onOpen();
    }
  };
  
  // Determine the button's appearance based on whether the movie is in a watchlist
  const getButtonProps = () => {
    if (isLoading) {
      return {
        color: 'default' as const,
        startContent: <Loader2 className="h-4 w-4 animate-spin" />,
        children: showText ? 'Loading...' : null
      };
    }
    
    if (inWatchlist) {
      return {
        color: 'success' as const,
        startContent: <Check className="h-4 w-4" />,
        children: showText ? 'In Watchlist' : null
      };
    }
    
    return {
      color,
      startContent: showText ? <Heart className="h-4 w-4" /> : <Plus className="h-4 w-4" />,
      children: showText ? text : null
    };
  };
  
  const buttonProps = getButtonProps();
  
  return (
    <>
      <Tooltip 
        content={showSuccessTooltip ? "Added to watchlist!" : inWatchlist ? "View in watchlist" : "Add to watchlist"}
        isOpen={showSuccessTooltip}
      >
        <Button
          variant={variant}
          color={buttonProps.color}
          size={size}
          fullWidth={fullWidth}
          className={className}
          startContent={buttonProps.startContent}
          isIconOnly={!showText}
          onPress={handleClick}
          isLoading={quickAddLoading}
        >
          {buttonProps.children}
        </Button>
      </Tooltip>
      
      <AddToWatchlistModal
        isOpen={isOpen}
        onClose={onClose}
        movieDetails={movie}
        onSuccess={() => {
          refresh();
          if (onSuccess) onSuccess();
        }}
      />
    </>
  );
};

export default AddToWatchlistButton;