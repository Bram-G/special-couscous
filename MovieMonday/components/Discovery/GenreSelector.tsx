// components/Discovery/GenreSelector.tsx
import React, { useState } from "react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Chip } from "@heroui/react";
import { Tag, ChevronDown } from "lucide-react";

// Genre map (normally this would come from the API)
const genres = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];

interface GenreSelectorProps {
  selectedGenres: number[];
  onChange: (genres: number[]) => void;
}

const GenreSelector: React.FC<GenreSelectorProps> = ({
  selectedGenres,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleGenreToggle = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      onChange(selectedGenres.filter(id => id !== genreId));
    } else {
      onChange([...selectedGenres, genreId]);
    }
  };
  
  const clearFilters = () => {
    onChange([]);
  };
  
  // Get selected genre names for the trigger display
  const selectedGenreNames = selectedGenres.map(id => {
    const genre = genres.find(g => g.id === id);
    return genre ? genre.name : '';
  }).filter(Boolean);
  
  return (
    <div>
      <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
        <DropdownTrigger>
          <Button
            variant="flat"
            endContent={<ChevronDown className="h-4 w-4" />}
            startContent={<Tag className="h-4 w-4" />}
          >
            {selectedGenres.length > 0 
              ? `Genres (${selectedGenres.length})`
              : "Genres"}
          </Button>
        </DropdownTrigger>
        <DropdownMenu 
          aria-label="Genre selection"
          selectionMode="multiple"
          selectedKeys={new Set(selectedGenres.map(id => id.toString()))}
          onSelectionChange={keys => {
            if (keys instanceof Set) {
              const genreIds = Array.from(keys).map(Number);
              onChange(genreIds);
            }
          }}
          className="min-w-unit-56"
        >
          <DropdownItem key="header" className="opacity-100" textValue="Genre filters">
            <div className="flex justify-between items-center">
              <span className="font-medium">Filter by genre</span>
              {selectedGenres.length > 0 && (
                <Button size="sm" variant="light" onPress={clearFilters}>
                  Clear all
                </Button>
              )}
            </div>
          </DropdownItem>
          
          {genres.map(genre => (
            <DropdownItem key={genre.id.toString()} textValue={genre.name}>
              {genre.name}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      
      {/* Display selected genres as chips */}
      {selectedGenres.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedGenreNames.map(name => (
            <Chip 
              key={name} 
              onClose={() => {
                const genreId = genres.find(g => g.name === name)?.id;
                if (genreId) handleGenreToggle(genreId);
              }}
              variant="flat"
              color="primary"
              size="sm"
            >
              {name}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
};

export default GenreSelector;