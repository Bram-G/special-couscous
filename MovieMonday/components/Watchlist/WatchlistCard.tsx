// MovieMonday/components/Watchlist/WatchlistCard.tsx
import React from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Image,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Globe,
  Lock,
  Share2,
  Film,
  Heart,
} from "lucide-react";

interface WatchlistCategory {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  likesCount: number;
  coverImagePath?: string;
  slug: string;
  moviesCount: number;
  createdAt: string;
  updatedAt: string;
  items?: any[]; // For movie previews
}

interface WatchlistCardProps {
  watchlist: WatchlistCategory;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onView: () => void;
}

const WatchlistCard: React.FC<WatchlistCardProps> = ({
  watchlist,
  onEdit,
  onDelete,
  onShare,
  onView,
}) => {
  // Create a grid of poster images or placeholders
  const renderPosterGrid = () => {
    const maxPosters = 4;
    const posters = watchlist.items || [];
    const placeholders = Array(Math.max(0, maxPosters - posters.length)).fill(
      null,
    );

    return (
      <div className="grid grid-cols-2 gap-1 h-48">
        {posters.slice(0, maxPosters).map((item, index) => (
          <div
            key={index}
            className="aspect-[2/3] bg-default-100 overflow-hidden rounded"
          >
            {item?.posterPath ? (
              <Image
                removeWrapper
                alt="Movie poster"
                className="w-full h-full object-cover"
                src={`https://image.tmdb.org/t/p/w200${item.posterPath}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-default-200">
                <Film className="w-8 h-8 text-default-400" />
              </div>
            )}
          </div>
        ))}
        {placeholders.map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="aspect-[2/3] bg-default-100 rounded flex items-center justify-center"
          >
            <Film className="w-8 h-8 text-default-300" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardBody className="p-0 overflow-hidden">
        {/* Poster grid or cover image */}
        {watchlist.coverImagePath ? (
          <div className="h-48 overflow-hidden">
            <Image
              removeWrapper
              alt={watchlist.name}
              className="w-full h-full object-cover"
              src={watchlist.coverImagePath}
            />
          </div>
        ) : (
          renderPosterGrid()
        )}

        {/* Overlay gradient for better text readability */}
        <div className="px-4 pt-3 pb-2 relative">
          <div className="flex justify-between items-start mb-1">
            <div>
              <h3 className="font-bold text-lg line-clamp-1">
                {watchlist.name}
              </h3>
              {watchlist.description && (
                <p className="text-default-500 text-sm line-clamp-2 mt-1">
                  {watchlist.description}
                </p>
              )}
            </div>
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly className="rounded-full" variant="light">
                  <MoreHorizontal size={18} />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Watchlist actions">
                <DropdownItem
                  key="view"
                  startContent={<Eye size={16} />}
                  onPress={onView}
                >
                  View Watchlist
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  startContent={<Edit size={16} />}
                  onPress={onEdit}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="share"
                  startContent={<Share2 size={16} />}
                  onPress={onShare}
                >
                  Share Watchlist
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<Trash2 size={16} />}
                  onPress={onDelete}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          <div className="flex items-center justify-between mt-3">
            <Chip
              color={watchlist.isPublic ? "success" : "default"}
              size="sm"
              startContent={
                watchlist.isPublic ? <Globe size={14} /> : <Lock size={14} />
              }
              variant="flat"
            >
              {watchlist.isPublic ? "Public" : "Private"}
            </Chip>

            <div className="flex gap-3">
              <div className="flex items-center text-sm">
                <Film className="h-4 w-4 mr-1 text-default-500" />
                <span>{watchlist.moviesCount}</span>
              </div>

              {watchlist.isPublic && (
                <div className="flex items-center text-sm">
                  <Heart className="h-4 w-4 mr-1 text-danger" />
                  <span>{watchlist.likesCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardBody>
      <CardFooter className="pt-0">
        <Button
          fullWidth
          color="primary"
          startContent={<Eye size={16} />}
          variant="flat"
          onPress={onView}
        >
          View Watchlist
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WatchlistCard;
