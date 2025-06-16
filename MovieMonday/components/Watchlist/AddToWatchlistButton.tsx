import React, { useState } from "react";
import { Button, useDisclosure, Tooltip } from "@heroui/react";
import { Plus, Check } from "lucide-react";
import { useRouter } from "next/navigation";

import AddToWatchlistModal from "./AddToWatchlistModal";

import { useAuth } from "@/contexts/AuthContext";
import useWatchlistStatus from "@/hooks/useWatchlistStatus";

interface MovieDetails {
  id: number;
  title: string;
  posterPath?: string | null;
}

interface AddToWatchlistButtonProps {
  movie: MovieDetails;
  variant?: "solid" | "flat" | "light" | "ghost" | "bordered";
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "default";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  className?: string;
  text?: string;
  showText?: boolean;
  onSuccess?: () => void;
}

const AddToWatchlistButton: React.FC<AddToWatchlistButtonProps> = ({
  movie,
  variant = "solid",
  color = "primary",
  size,
  fullWidth = false,
  className = "",
  text = "Add to Watchlist",
  showText = true,
  onSuccess,
}) => {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showSuccessTooltip, setShowSuccessTooltip] = useState(false);

  // Use our custom hook to check if this movie is already in a watchlist
  const { inWatchlist, refresh, isLoading } = useWatchlistStatus(movie.id);

  // Handle button click based on auth status
  const handleClick = () => {
    if (!isAuthenticated) {
      // Store the current URL for redirection after login
      localStorage.setItem("redirectAfterLogin", window.location.pathname);
      router.push("/login");

      return;
    }

    // Open the watchlist modal
    onOpen();
  };

  // Determine the button's appearance based on whether the movie is in a watchlist
  const getButtonProps = () => {
    if (isLoading) {
      return {
        color: "default" as const,
        startContent: (
          <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin" />
        ),
        children: showText ? "Loading..." : null,
      };
    }

    if (inWatchlist) {
      return {
        color: "success" as const,
        startContent: <Check className="h-4 w-4" />,
        children: showText ? "In Watchlist" : null,
      };
    }

    return {
      color,
      startContent: <Plus className="h-4 w-4" />,
      children: showText ? text : null,
    };
  };

  const buttonProps = getButtonProps();

  return (
    <>
      <Tooltip
        content={inWatchlist ? "Manage watchlists" : "Add to watchlist"}
        isOpen={showSuccessTooltip}
      >
        <Button
          className={className}
          color={buttonProps.color}
          fullWidth={fullWidth}
          isIconOnly={!showText}
          size={size}
          startContent={buttonProps.startContent}
          variant={variant}
          onPress={handleClick}
        >
          {buttonProps.children}
        </Button>
      </Tooltip>

      <AddToWatchlistModal
        isOpen={isOpen}
        movieDetails={movie}
        onClose={() => {
          onClose();
          // Show success tooltip briefly after closing the modal
          setShowSuccessTooltip(true);
          setTimeout(() => {
            setShowSuccessTooltip(false);
          }, 1500);
          // Refresh the watchlist status
          refresh();
          if (onSuccess) onSuccess();
        }}
        onSuccess={() => {
          refresh();
          if (onSuccess) onSuccess();
        }}
      />
    </>
  );
};

export default AddToWatchlistButton;
