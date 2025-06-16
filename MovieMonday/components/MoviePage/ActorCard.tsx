import React from "react";
import { Avatar, Tooltip } from "@heroui/react";
import { Trophy, Film } from "lucide-react";

// Type definitions for props
interface ActorStats {
  appearances: number;
  wins: number;
  movies?: Array<{
    id: number;
    title: string;
    posterPath?: string;
    isWinner?: boolean;
  }>;
}

interface ActorCardProps {
  actor: {
    id: number;
    name: string;
    character?: string;
    profile_path?: string;
  };
  stats: ActorStats | null;
  onClick: (actor: any) => void;
}

const ActorCard = ({ actor, stats, onClick }: ActorCardProps) => {
  // Determine if actor has any stats
  const hasStats = stats && stats.appearances > 0;

  return (
    <div
      className="flex flex-col items-center text-center cursor-pointer transition-transform hover:scale-105"
      onClick={() => onClick(actor)}
    >
      {/* Use a fixed height container for the entire card to ensure consistent layout */}
      <div className="h-36 flex flex-col items-center">
        {/* Avatar with fixed position */}
        <Avatar
          className="w-16 h-16 mb-2"
          name={actor.name}
          src={
            actor.profile_path
              ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
              : null
          }
        />

        {/* Stats badge - positioned consistently regardless of presence */}
        <div className="h-6 mb-1">
          {hasStats && (
            <div className="flex rounded-full overflow-hidden border border-default-200">
              <Tooltip
                content={`${stats.appearances} Movie Monday appearances`}
              >
                <div className="bg-primary px-2 py-0.5 text-white text-xs font-medium flex items-center">
                  <Film className="h-3 w-3 mr-1" />
                  {stats.appearances}
                </div>
              </Tooltip>

              {stats.wins > 0 && (
                <Tooltip
                  content={`${stats.wins} winning Movie Monday selections`}
                >
                  <div className="bg-warning px-2 py-0.5 text-white text-xs font-medium flex items-center">
                    <Trophy className="h-3 w-3 mr-1" />
                    {stats.wins}
                  </div>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {/* Actor name and character - fixed height containers */}
        <div className="h-5 flex items-center">
          <p className="font-medium text-sm line-clamp-1">{actor.name}</p>
        </div>

        <div className="h-4 flex items-center">
          <p className="text-xs text-default-500 line-clamp-1">
            {actor.character || ""}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActorCard;
