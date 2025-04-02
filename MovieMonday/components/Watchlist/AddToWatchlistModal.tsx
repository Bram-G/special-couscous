import React, { useState } from 'react';
import { Button, useDisclosure } from "@heroui/react";
import { Calendar, Plus } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

interface AddToWatchlistButtonProps {
  movie: {
    id: number;
    title: string;
    posterPath?: string;
  };
  variant?: 'solid' | 'flat' | 'light';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  text?: string;
  onSuccess?: () => void;
}

const AddToWatchlistButton: React.FC<AddToWatchlistButtonProps> = ({
  movie,
  variant = 'solid',
  color = 'primary',
  size,
  fullWidth = false,
  className = '',
  text = 'Add to Watchlist',
  onSuccess
}) => {
  const { isAuthenticated, token } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  
  // For quick add to default watchlist
  const handleQuickAdd = async () => {
    if (!isAuthenticated || !token) return;
    
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/watchlists/quick-add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tmdbMovieId: movie.id,
          title: movie.title,
          posterPath: movie.posterPath || null
        }),
        credentials: 'include'
      });
      
      if (response.ok) {
        // Call success callback if provided
        if (onSuccess) onSuccess();
      } else {
        const error = await response.json();
        console.error('Error adding to watchlist:', error);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button
        variant={variant}
        color={color}
        size={size}
        fullWidth={fullWidth}
        className={className}
        startContent={<Plus />}
        onPress={onOpen}
        isLoading={loading}
      >
        {text}
      </Button>
      
      <AddToWatchlistModal
        isOpen={isOpen}
        onClose={onClose}
        movieDetails={{
          id: movie.id,
          title: movie.title,
          posterPath: movie.posterPath || null
        }}
        onSuccess={onSuccess}
      />
    </>
  );
};

export default AddToWatchlistButton;