import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Image,
  Input,
  Textarea,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Chip,
} from "@heroui/react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trophy,
  Edit2,
  Save,
  X,
  Trash2,
  Calendar as CalendarIcon,
  Cake,
  Utensils, 
  Wine, 
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CrownIcon } from "lucide-react";
import confetti from "canvas-confetti";

type ButtonVariant = "shadow" | "flat" | "light" | "solid" | "bordered" | "faded" | "ghost";
type ButtonColor = "primary" | "default" | "secondary" | "success" | "warning" | "danger";

interface DashboardCalendarProps {
  slidesPerView?: number;
  onDateSelect?: (date: Date) => void;
  groupMembers?: { id: string; username: string; email: string }[];
  groupId?: string;
}

interface EventDetails {
  meals: string;
  cocktails: string[];
  desserts: string; // Added desserts property
  notes: string;
}

interface MovieMonday {
  id: number;
  date: string;
  pickerUserId: string;
  status: "not_created" | "pending" | "in-progress" | "completed";
  movieSelections: MovieSelection[];
  eventDetails?: {
    meals: string;
    cocktails: string[];
    desserts?: string; // Made optional since it might not exist in older data
    notes: string;
  };
  picker: {
    id: string;
    username: string;
  } | null;
}

interface MovieSelection {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath: string;
  isWinner: boolean;
}

interface DateButtonStatus {
  status: string;
  variant: ButtonVariant;
  color: ButtonColor;
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  slidesPerView = 5,
  onDateSelect,
  groupMembers = [],
  groupId,
}) => {
  const { token } = useAuth();
  const router = useRouter();
  
  // State management
  const [mondayDates, setMondayDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonday, setSelectedMonday] = useState<MovieMonday | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [movieMondayMap, setMovieMondayMap] = useState<Map<string, MovieMonday>>(new Map());
  const [savingDetails, setSavingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCocktail, setNewCocktail] = useState<string>("");
  
  // Event details state
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    meals: "",
    cocktails: [],
    desserts: "",
    notes: "",
  });
  
  const [editableDetails, setEditableDetails] = useState<EventDetails>({
    meals: "",
    cocktails: [],
    desserts: "",
    notes: "",
  });
  
  // Animation and UI state
  const [animationDirection, setAnimationDirection] = useState<"left" | "right" | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  // Cocktail suggestions
  const [cocktailSuggestions, setCocktailSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  // Initialize calendar and fetch data
  useEffect(() => {
    const dates = initializeMondays();
    setMondayDates(dates);
    
    const today = new Date();
    const firstMonday = getNextMonday(today);
    handleDateClick(firstMonday);

    if (token) {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      setCurrentUserId(decodedToken.id);
    }
  }, [token]);

  // Fetch cocktail suggestions and preload date data when dates change
  useEffect(() => {

    // Preload data for all visible dates
    const fetchAllDates = async () => {
      const promises = mondayDates.map(async (date) => {
        try {
          const formattedDate = formatDateForAPI(date);
          const response = await fetch(
            `http://localhost:8000/api/movie-monday/${formattedDate}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (response.ok) {
            const data = await response.json();
            setMovieMondayMap(prev => new Map(prev.set(date.toISOString(), data)));
          }
        } catch (error) {
          console.error(`Error fetching data for ${date}:`, error);
        }
      });

      await Promise.all(promises);
    };
    
    fetchAllDates();
  }, [mondayDates, token]);

  useEffect(() => {
    if (!token) return;
  
    // Fetch cocktail suggestions
    const fetchCocktailSuggestions = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/movie-monday/cocktails",
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );
  
        if (response.ok) {
          const data = await response.json();
          console.log("Loaded cocktail suggestions:", data); // Debug log
          
          // Ensure data is an array before setting state
          if (Array.isArray(data)) {
            setCocktailSuggestions(data);
          } else {
            console.warn('Received non-array cocktail suggestions:', data);
            setCocktailSuggestions([]);
          }
        }
      } catch (error) {
        console.error("Error fetching cocktail suggestions:", error);
        // Set to empty array on error
        setCocktailSuggestions([]);
      }
    };
  
    fetchCocktailSuggestions();
  }, [token]);

  // Helper function to get the next Monday
  const getNextMonday = (date: Date): Date => {
    const nextMonday = new Date(date);
    nextMonday.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

    const daysUntilMonday = (8 - nextMonday.getDay()) % 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);

    return nextMonday;
  };

  // Initialize Mondays for the calendar
  const initializeMondays = (): Date[] => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon
    const firstMonday = getNextMonday(today);
    const mondays: Date[] = [firstMonday];

    for (let i = 1; i < slidesPerView; i++) {
      const nextDate = new Date(firstMonday);
      nextDate.setDate(firstMonday.getDate() + i * 7);
      mondays.push(nextDate);
    }

    return mondays;
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Format date for API requests (YYYY-MM-DD)
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Handle clicking on a date in the calendar
  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setLoading(true);
    
    try {
      // Format date as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const response = await fetch(
        `http://localhost:8000/api/movie-monday/${formattedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedMonday(data);
        setMovieMondayMap(new Map(movieMondayMap.set(date.toISOString(), data)));

        // Set event details based on response
        if (data.eventDetails) {
          setEventDetails({
            meals: data.eventDetails.meals || "",
            cocktails: data.eventDetails.cocktails || [],
            desserts: data.eventDetails.desserts || "",
            notes: data.eventDetails.notes || "",
          });
        } else {
          // Reset event details if none exist
          setEventDetails({
            meals: "",
            cocktails: [],
            desserts: "",
            notes: "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching movie monday details:", error);
    } finally {
      setLoading(false);
    }
  };

  // Determine status and appearance of date buttons
  const getDateButtonStatus = (date: Date): DateButtonStatus => {
    const formattedDate = formatDateForAPI(date);
    const movieMonday = Array.from(movieMondayMap.entries()).find(
      ([key, _]) => formatDateForAPI(new Date(key)) === formattedDate
    )?.[1];

    const isSelected = selectedDate && formatDateForAPI(selectedDate) === formattedDate;

    if (!movieMonday || movieMonday.status === "not_created") {
      return {
        status: "empty",
        variant: isSelected ? "solid" : "light",
        color: isSelected ? "primary" : "default",
      };
    }

    if (movieMonday.status === "completed") {
      return {
        status: "completed",
        variant: isSelected ? "solid" : "light",
        color: "success",
      };
    } else if (movieMonday.status === "in-progress") {
      return {
        status: "in-progress",
        variant: isSelected ? "solid" : "light",
        color: "primary",
      };
    } else {
      return {
        status: "pending",
        variant: isSelected ? "solid" : "light",
        color: "warning",
      };
    }
  };

  // Check if a date is the start of a month
  const isMonthStart = (date: Date, index: number, dates: Date[]): boolean => {
    if (index === 0) return true;
    const prevDate = dates[index - 1];
    return (
      date.getMonth() !== prevDate.getMonth() ||
      date.getFullYear() !== prevDate.getFullYear()
    );
  };

  // Handle cocktail input change with suggestions
  const handleCocktailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCocktail(value);
  
    // Only show suggestions if there's input
    if (value.trim()) {
      // Make sure cocktailSuggestions is an array before filtering
      if (Array.isArray(cocktailSuggestions)) {
        const filtered = cocktailSuggestions.filter(cocktail =>
          cocktail.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        console.warn('cocktailSuggestions is not an array:', cocktailSuggestions);
        setFilteredSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Create a new MovieMonday
  const handleCreateMovieMonday = async (date: Date) => {
    if (!token || !groupId) {
      console.error("Missing required data:", { token: !!token, groupId });
      return;
    }

    setLoading(true);

    try {
      // Format date as YYYY-MM-DD
      const dateString = date.toISOString().split("T")[0];

      const response = await fetch(
        "http://localhost:8000/api/movie-monday/create",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            date: dateString,
            groupId: groupId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to create MovieMonday:", errorData);
        return;
      }

      await handleDateClick(date); // Refresh data for this date
    } catch (error) {
      console.error("Error creating MovieMonday:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save all event details
  const handleSaveAll = async () => {
    if (!selectedMonday || !token) return;

    setSavingDetails(true);
    try {
      // Send updated event details to the server
      const response = await fetch(
        `http://localhost:8000/api/movie-monday/${selectedMonday.id}/event-details`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editableDetails),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save event details");
      }

      // Refresh data and exit edit mode
      if (selectedDate) {
        await handleDateClick(selectedDate);
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving details:", error);
    } finally {
      setSavingDetails(false);
    }
  };

  // Update the picker for a MovieMonday
  const handlePickerChange = async (newPickerId: string) => {
    if (!selectedMonday || !token) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/movie-monday/update-picker`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            movieMondayId: selectedMonday.id,
            pickerUserId: newPickerId,
          }),
        }
      );

      if (response.ok && selectedDate) {
        await handleDateClick(selectedDate); // Refresh data
      }
    } catch (error) {
      console.error("Error updating picker:", error);
    }
  };

  // Remove a movie from selections
  const handleRemoveMovie = async (movieSelectionId: number) => {
    if (!selectedMonday || !token) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/movie-monday/${selectedMonday.id}/movies/${movieSelectionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok && selectedDate) {
        handleDateClick(selectedDate); // Refresh data
      }
    } catch (error) {
      console.error("Error removing movie:", error);
    }
  };

  // Set a movie as the winner
  const handleSetWinner = async (movieSelectionId: number) => {
    if (!selectedMonday || !token) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/movie-monday/${selectedMonday.id}/set-winner`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ movieSelectionId }),
        }
      );

      if (response.ok) {
        // Trigger confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Refresh data
        if (selectedDate) {
          handleDateClick(selectedDate);
        }
      }
    } catch (error) {
      console.error("Error setting winner:", error);
    }
  };

  // Navigate to a movie's details page
  const handleMovieClick = (movieId: number) => {
    router.push(`/movie/${movieId}`);
  };

  // Calendar navigation functions
  const handlePrevious = () => {
    setAnimationDirection("right");
    const newDates = mondayDates.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() - 7 * slidesPerView);
      return newDate;
    });
    
    setTimeout(() => {
      setMondayDates(newDates);
      setAnimationDirection(null);
    }, 50);
  };

  const handleNext = () => {
    setAnimationDirection("left");
    const newDates = mondayDates.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + 7 * slidesPerView);
      return newDate;
    });
    
    setTimeout(() => {
      setMondayDates(newDates);
      setAnimationDirection(null);
    }, 50);
  };

  // Jump to a specific month
  const jumpToMonth = (year: number, month: number) => {
    const today = new Date();
    // Find the first Monday of the specified month
    const firstDay = new Date(year, month, 1);
    const daysUntilMonday = (8 - firstDay.getDay()) % 7;
    const firstMonday = new Date(year, month, 1 + daysUntilMonday);

    // Create new dates array
    const newDates = [];
    const startDate = firstMonday > today ? getNextMonday(today) : firstMonday;
    
    for (let i = 0; i < slidesPerView; i++) {
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() + i * 7);
      newDates.push(newDate);
    }
    
    setMondayDates(newDates);
    setShowMonthPicker(false);
  };

  // Generate month options for dropdown
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    // Add months from current year and previous years
    for (let year = currentYear; year >= currentYear - 2; year--) {
      for (let month = 11; month >= 0; month--) {
        if (year === currentYear && month > currentDate.getMonth()) {
          continue; // Skip future months
        }
        months.push({ year, month });
      }
    }

    return months;
  };

  const monthOptions = generateMonthOptions();

  // Render the component
  return (
    <div className="space-y-4 w-full">
      {/* Calendar Header - Navigation */}
      <Card className="w-full p-4 sticky top-0 z-10 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            <h3 className="text-lg font-semibold">Movie Monday Calendar</h3>
          </div>

          <div>
            {/* Month/Year Dropdown */}
            <Dropdown
              isOpen={showMonthPicker}
              onOpenChange={setShowMonthPicker}
            >
              <DropdownTrigger>
                <Button variant="flat" className="text-sm">
                  Jump to Month
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Select month"
                className="max-h-96 overflow-y-auto"
                onAction={(key) => {
                  const [year, month] = key.toString().split("-").map(Number);
                  jumpToMonth(year, month);
                }}
              >
                {monthOptions.map(({ year, month }) => (
                  <DropdownItem key={`${year}-${month}`} className="text-sm">
                    {new Date(year, month, 1).toLocaleDateString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* Calendar with side navigation */}
        <div className="flex items-center">
          <div className="flex-1 flex flex-col">
            {/* Month labels with increased spacing */}
            <div className="flex mb-2 w-full justify-center">
              <div className="flex mb-6 relative pt-2 w-5/6 justify-between">
                {mondayDates.map((date, idx) => {
                  if (isMonthStart(date, idx, mondayDates)) {
                    // Calculate width based on how many dates in this month
                    const monthDatesCount = mondayDates
                      .slice(idx)
                      .findIndex(d => 
                        d.getMonth() !== date.getMonth() || 
                        d.getFullYear() !== date.getFullYear()
                      );
                      
                    const width = monthDatesCount === -1
                      ? ((mondayDates.length - idx) / mondayDates.length) * 100
                      : (monthDatesCount / mondayDates.length) * 100;

                    return (
                      <div
                        key={`month-${date.toISOString()}`}
                        className="text-sm font-medium text-default-600 absolute"
                        style={{
                          left: `${(idx / mondayDates.length) * 100}%`,
                          width: `${width}%`,
                        }}
                      >
                        {date.toLocaleDateString("default", {
                          month: "long",
                          year: "numeric",
                        })}
                        <div className="h-px bg-gray-300 w-[95%] mx-auto mt-1"></div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Calendar Days in single row */}
            <div className="flex items-center justify-between">
              {/* Left Arrow */}
              <Button
                isIconOnly
                variant="light"
                onPress={handlePrevious}
                aria-label="Previous weeks"
                className="min-w-unit-12 h-16"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <div
                className={`flex w-full transition-transform duration-300 m-2 w-5/6 ${
                  animationDirection === "left"
                    ? "translate-x-[-3%] opacity-50"
                    : animationDirection === "right"
                      ? "translate-x-[3%] opacity-50"
                      : ""
                }`}
              >
                {mondayDates.map((date, index) => {
                  const dateStatus = getDateButtonStatus(date);
                  let statusDescription = "No event scheduled";

                  if (dateStatus.status === "completed") {
                    statusDescription = "Event completed";
                  } else if (dateStatus.status === "in-progress") {
                    statusDescription = "Event in progress";
                  } else if (dateStatus.status === "pending") {
                    statusDescription = "Event pending";
                  }

                  // Add month separator
                  const isNewMonth = isMonthStart(date, index, mondayDates);

                  return (
                    <div key={date.toISOString()} className="flex-1 flex">
                      {isNewMonth && index > 0 && (
                        <div className="w-px bg-default-300 self-stretch mx-1"></div>
                      )}
                      <Tooltip content={statusDescription}>
                        <Button
                          variant={dateStatus.variant}
                          color={dateStatus.color}
                          onPress={() => handleDateClick(date)}
                          className="h-16 w-full flex flex-col items-center justify-center"
                        >
                          <span className="text-sm">
                            {date.toLocaleDateString("default", {
                              weekday: "short",
                            })}
                          </span>
                          <span className="text-lg font-bold">
                            {date.getDate()}
                          </span>
                        </Button>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
              {/* Right Arrow */}
              <Button
                isIconOnly
                variant="light"
                onPress={handleNext}
                aria-label="Next weeks"
                className="min-w-unit-12 h-16"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {selectedDate && (
        <Card className="w-full">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Movies for{" "}
                {selectedDate.toLocaleDateString("default", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h3>
            </div>
          </div>

          {/* Content based on loading and data state */}
          {loading ? (
            // Loading spinner
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : selectedMonday?.status === "not_created" ? (
            // Create MovieMonday button if none exists
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="text-default-500">
                No Movie Monday scheduled for this date
              </p>
              {groupId ? (
                <Button
                  color="primary"
                  onPress={() => selectedDate && handleCreateMovieMonday(selectedDate)}
                  startContent={<Plus className="h-4 w-4" />}
                  isLoading={loading}
                >
                  Create Movie Monday
                </Button>
              ) : (
                <p className="text-sm text-default-400">
                  Join or create a group to schedule Movie Mondays
                </p>
              )}
            </div>
          ) : (
            // Movie and event details display
            <div className="flex gap-4 p-4">
              {/* Movie Cards Section */}
              <div className="w-3/5 grid grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => {
                  const movieSelections = selectedMonday?.movieSelections?.sort((a, b) => a.id - b.id) || [];
                  const movie = movieSelections[index];
                  
                  return (
                    <Card
                      key={index}
                      className={`w-full h-80 relative group overflow-hidden ${
                        movie?.isWinner
                          ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50"
                          : ""
                      }`}
                    >
                      {movie ? (
                        <div className="relative h-full">
                          {/* Movie poster area */}
                          <div
                            className="absolute inset-0 z-0 cursor-pointer"
                            onClick={() => handleMovieClick(movie.tmdbMovieId)}
                          >
                            <Image
                              src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                              alt={movie.title}
                              className="object-cover w-full h-full"
                            />
                          </div>

                          {/* Action panel */}
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-black/80 
                                      transform translate-y-full group-hover:translate-y-0 
                                      transition-transform duration-300 ease-in-out z-10
                                      flex flex-col items-center justify-center p-3 h-1/3"
                          >
                            <p className="text-white text-center font-medium mb-2 truncate w-full">
                              {movie.title}
                            </p>
                            <div className="flex gap-2">
                              {movie.isWinner ? (
                                <Button
                                  color="warning"
                                  variant="light"
                                  isIconOnly
                                  className="text-yellow-400"
                                  onPress={() => handleSetWinner(movie.id)}
                                >
                                  <Trophy className="h-8 w-8" />
                                  <span className="sr-only">Remove Winner Status</span>
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    color="warning"
                                    variant="solid"
                                    onPress={() => handleSetWinner(movie.id)}
                                    className="bg-warning-500 hover:bg-warning-600"
                                    startContent={<CrownIcon className="h-4 w-4" />}
                                  />
                                  <Button
                                    color="danger"
                                    variant="light"
                                    isIconOnly
                                    onPress={() => handleRemoveMovie(movie.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Winner indicator */}
                          {movie.isWinner && (
                            <div className="absolute top-2 right-2 z-20">
                              <div className="bg-yellow-500 text-white rounded-full p-1">
                                <Trophy className="h-5 w-5" />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-default-400">Empty Slot</p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
              
              {/* Event Details Section */}
              <div className="w-2/5">
                <Card className="p-4 h-full">
                  <div className="flex flex-col h-full">
                    {/* Header with edit/save buttons */}
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">Event Details</h3>
                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <Button
                            isIconOnly
                            variant="light"
                            onPress={() => {
                              setIsEditing(true);
                              setEditableDetails({
                                meals: selectedMonday?.eventDetails?.meals || "",
                                cocktails: selectedMonday?.eventDetails?.cocktails || [],
                                desserts: selectedMonday?.eventDetails?.desserts || "",
                                notes: selectedMonday?.eventDetails?.notes || "",
                              });
                            }}
                            aria-label="Edit details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              color="danger"
                              variant="light"
                              onPress={() => setIsEditing(false)}
                              startContent={<X className="h-4 w-4" />}
                            >
                              Cancel
                            </Button>
                            <Button
                              color="primary"
                              onPress={handleSaveAll}
                              isLoading={savingDetails}
                              startContent={<Save className="h-4 w-4" />}
                            >
                              Save All
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {/* Picker selection */}
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Picker:</span>
                        {isEditing ? (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button variant="flat" className="capitalize">
                                {selectedMonday?.picker?.username || "Select Picker"}
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label="Select picker"
                              selectionMode="single"
                              disallowEmptySelection
                              selectedKeys={new Set([selectedMonday?.pickerUserId || ""])}
                              onSelectionChange={(keys) => {
                                if (keys instanceof Set && keys.size > 0) {
                                  const selected = Array.from(keys)[0].toString();
                                  handlePickerChange(selected);
                                }
                              }}
                            >
                              {groupMembers?.map((member) => (
                                <DropdownItem key={member.id}>
                                  {member.username}
                                </DropdownItem>
                              ))}
                            </DropdownMenu>
                          </Dropdown>
                        ) : (
                          <span>
                            {selectedMonday?.picker?.username || "Not assigned"}
                          </span>
                        )}
                      </div>

                      {/* Event details - Edit mode */}
                      {isEditing ? (
                        <div className="space-y-4">
                          {/* Dinner input */}
                          <Input
                            label="Dinner"
                            placeholder="What meal did you serve?"
                            value={editableDetails.meals}
                            onChange={(e) =>
                              setEditableDetails((prev) => ({
                                ...prev,
                                meals: e.target.value,
                              }))
                            }
                            startContent={<Utensils className="text-primary h-4 w-4" />}
                          />

                          {/* Desserts input */}
                          <Input
                            label="Desserts"
                            placeholder="What desserts did you serve?"
                            value={editableDetails.desserts || ""}
                            onChange={(e) =>
                              setEditableDetails((prev) => ({
                                ...prev,
                                desserts: e.target.value,
                              }))
                            }
                            startContent={<Cake className="text-danger h-4 w-4" />}
                          />

                          {/* Cocktail input with autocomplete */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Cocktails</label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  placeholder="Add a cocktail (press Enter to add)"
                                  value={newCocktail}
                                  onChange={handleCocktailInputChange}
                                  onFocus={() => {
                                    if (newCocktail.trim() && cocktailSuggestions.length) {
                                      setShowSuggestions(true);
                                    }
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => setShowSuggestions(false), 200);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && newCocktail.trim()) {
                                      e.preventDefault();
                                      setEditableDetails((prev) => ({
                                        ...prev,
                                        cocktails: [...prev.cocktails, newCocktail.trim()],
                                      }));
                                      setNewCocktail("");
                                      setShowSuggestions(false);
                                    }
                                  }}
                                  startContent={<Wine className="text-secondary h-4 w-4" />}
                                />

                                {/* Cocktail suggestions dropdown */}
                                {showSuggestions && filteredSuggestions.length > 0 && (
                                  <div className="absolute z-50 mt-1 w-full bg-background border border-default-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {filteredSuggestions.map((suggestion, index) => (
                                      <div
                                        key={index}
                                        className="px-4 py-2 hover:bg-default-100 cursor-pointer"
                                        onMouseDown={() => {
                                          setEditableDetails((prev) => ({
                                            ...prev,
                                            cocktails: [...prev.cocktails, suggestion],
                                          }));
                                          setNewCocktail("");
                                          setShowSuggestions(false);
                                        }}
                                      >
                                        {suggestion}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {/* Add cocktail button */}
                              <Button
                                isIconOnly
                                color="secondary"
                                onPress={() => {
                                  if (newCocktail.trim()) {
                                    setEditableDetails((prev) => ({
                                      ...prev,
                                      cocktails: [...prev.cocktails, newCocktail.trim()],
                                    }));
                                    setNewCocktail("");
                                    setShowSuggestions(false);
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Display cocktail chips */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {editableDetails.cocktails.map((cocktail, index) => (
                                <Chip
                                  key={`${cocktail}-${index}`}
                                  onClose={() => {
                                    setEditableDetails(prev => ({
                                      ...prev,
                                      cocktails: prev.cocktails.filter((_, i) => i !== index)
                                    }));
                                  }}
                                  variant="flat"
                                  color="secondary"
                                >
                                  {cocktail}
                                </Chip>
                              ))}
                            </div>
                          </div>

                          {/* Notes textarea */}
                          <Textarea
                            label="Notes"
                            placeholder="Any other details about the evening..."
                            value={editableDetails.notes}
                            onChange={(e) =>
                              setEditableDetails((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                            minRows={2}
                            maxRows={3}
                            startContent={<FileText className="text-warning h-4 w-4" />}
                          />
                        </div>
                      ) : (
                        /* Event details - Display mode */
                        <div className="space-y-4">
                          {/* Dinner display */}
                          <div className="flex items-center gap-2 py-1 px-2 rounded-md bg-default-50">
                            <div className="text-primary flex items-center">
                              <Utensils className="h-6 w-6" />
                            </div>
                            <div className="text-left ml-2 flex-1">
                              <h4 className="font-medium text-primary-600 text-sm">
                                Dinner
                              </h4>
                              <p className="text-default-700 text-sm">
                                {selectedMonday?.eventDetails?.meals || "No meal recorded yet"}
                              </p>
                            </div>
                          </div>

                          {/* Desserts display */}
                          <div className="flex items-center gap-2 py-1 px-2 rounded-md bg-default-50">
                            <div className="text-danger flex items-center">
                              <Cake className="h-6 w-6" />
                            </div>
                            <div className="text-left ml-2 flex-1">
                              <h4 className="font-medium text-danger-600 text-sm">
                                Desserts
                              </h4>
                              <p className="text-default-700 text-sm">
                                {selectedMonday?.eventDetails?.desserts || "No desserts recorded yet"}
                              </p>
                            </div>
                          </div>

                          {/* Cocktails display with chips */}
                          <div className="flex items-center gap-2 py-1 px-2 rounded-md bg-default-50">
                            <div className="text-secondary flex items-center">
                              <Wine className="h-6 w-6" />
                            </div>
                            <div className="text-left ml-2 flex-1">
                              <h4 className="font-medium text-secondary-600 text-sm">
                                Cocktails
                              </h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedMonday?.eventDetails?.cocktails?.length ? (
                                  selectedMonday.eventDetails.cocktails.map((cocktail, index) => (
                                    <Chip
                                      key={`${cocktail}-${index}`}
                                      size="sm"
                                      variant="flat"
                                      color="secondary"
                                    >
                                      {cocktail}
                                    </Chip>
                                  ))
                                ) : (
                                  <p className="text-default-700 text-sm">
                                    No cocktails recorded yet
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Notes display */}
                          <div className="flex items-center gap-2 py-1 px-2 rounded-md bg-default-50">
                            <div className="text-warning flex items-center">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div className="text-left ml-2 flex-1">
                              <h4 className="font-medium text-warning-600 text-sm">
                                Notes
                              </h4>
                              <p className="text-default-700 text-sm">
                                {selectedMonday?.eventDetails?.notes || "No notes recorded yet"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default DashboardCalendar;