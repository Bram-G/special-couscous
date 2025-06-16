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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
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
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CrownIcon } from "lucide-react";
import confetti from "canvas-confetti";

import { useAuth } from "@/contexts/AuthContext";

type ButtonVariant =
  | "shadow"
  | "flat"
  | "light"
  | "solid"
  | "bordered"
  | "faded"
  | "ghost";
type ButtonColor =
  | "primary"
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "danger";

interface DashboardCalendarProps {
  slidesPerView?: number;
  onDateSelect?: (date: Date) => void;
  groupMembers?: { id: string; username: string; email: string }[];
  groupId?: string;
}

interface EventDetails {
  meals: string[];
  cocktails: string[];
  desserts: string[];
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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
  const [selectedMonday, setSelectedMonday] = useState<MovieMonday | null>(
    null,
  );
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [movieMondayMap, setMovieMondayMap] = useState<
    Map<string, MovieMonday>
  >(new Map());
  const [savingDetails, setSavingDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCocktail, setNewCocktail] = useState<string>("");

  // Event details state
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    meals: [],
    cocktails: [],
    desserts: [],
    notes: "",
  });

  const [editableDetails, setEditableDetails] = useState<EventDetails>({
    meals: [],
    cocktails: [],
    desserts: [],
    notes: "",
  });

  // Animation and UI state
  const [animationDirection, setAnimationDirection] = useState<
    "left" | "right" | null
  >(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Confirmation modal for unsaved changes
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingDateSelection, setPendingDateSelection] = useState<Date | null>(
    null,
  );

  // Cocktail suggestions
  const [cocktailSuggestions, setCocktailSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const [newMeal, setNewMeal] = useState<string>("");
  const [newDessert, setNewDessert] = useState<string>("");
  const [mealSuggestions, setMealSuggestions] = useState<string[]>([]);
  const [dessertSuggestions, setDessertSuggestions] = useState<string[]>([]);
  const [activeSuggestionType, setActiveSuggestionType] = useState<
    "cocktail" | "meal" | "dessert" | null
  >(null);

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
            `${API_BASE_URL}/api/movie-monday/${formattedDate}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (response.ok) {
            const data = await response.json();

            setMovieMondayMap(
              (prev) => new Map(prev.set(date.toISOString(), data)),
            );
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

    // Fetch all suggestion types
    const fetchSuggestions = async () => {
      try {
        // Fetch cocktail suggestions
        const cocktailResponse = await fetch(
          "${API_BASE_URL}/api/movie-monday/cocktails",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (cocktailResponse.ok) {
          const data = await cocktailResponse.json();

          if (Array.isArray(data)) {
            setCocktailSuggestions(data);
          } else {
            console.warn("Received non-array cocktail suggestions:", data);
            setCocktailSuggestions([]);
          }
        }

        // Fetch meal suggestions
        const mealResponse = await fetch(
          `${API_BASE_URL}/api/movie-monday/meals`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (mealResponse.ok) {
          const data = await mealResponse.json();

          if (Array.isArray(data)) {
            setMealSuggestions(data);
          } else {
            console.warn("Received non-array meal suggestions:", data);
            setMealSuggestions([]);
          }
        }

        // Fetch dessert suggestions
        const dessertResponse = await fetch(
          `${API_BASE_URL}/api/movie-monday/desserts`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (dessertResponse.ok) {
          const data = await dessertResponse.json();

          if (Array.isArray(data)) {
            setDessertSuggestions(data);
          } else {
            console.warn("Received non-array dessert suggestions:", data);
            setDessertSuggestions([]);
          }
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setCocktailSuggestions([]);
        setMealSuggestions([]);
        setDessertSuggestions([]);
      }
    };

    fetchSuggestions();
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

  // Check for unsaved changes
  const hasUnsavedChanges = (): boolean => {
    if (!isEditing) return false;

    // Compare the current editable details with the original event details
    return (
      JSON.stringify(editableDetails.meals) !==
        JSON.stringify(eventDetails.meals) ||
      JSON.stringify(editableDetails.cocktails) !==
        JSON.stringify(eventDetails.cocktails) ||
      JSON.stringify(editableDetails.desserts) !==
        JSON.stringify(eventDetails.desserts) ||
      editableDetails.notes !== eventDetails.notes
    );
  };

  // Handle clicking on a date in the calendar with unsaved changes check
  const handleDateClick = async (date: Date) => {
    // If there are unsaved changes, show confirmation dialog
    if (isEditing && hasUnsavedChanges()) {
      setPendingDateSelection(date);
      setShowUnsavedChangesModal(true);

      return;
    }

    // Otherwise proceed with date selection
    proceedWithDateSelection(date);
  };

  // Proceed with date selection after handling unsaved changes
  const proceedWithDateSelection = async (date: Date) => {
    setSelectedDate(date);
    setLoading(true);
    // Reset editing state when changing dates
    setIsEditing(false);

    try {
      // Format date as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/${formattedDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();

        setSelectedMonday(data);
        setMovieMondayMap(
          new Map(movieMondayMap.set(date.toISOString(), data)),
        );

        // Set event details based on response
        if (data.eventDetails) {
          setEventDetails({
            meals: Array.isArray(data.eventDetails.meals)
              ? [...data.eventDetails.meals]
              : data.eventDetails.meals
                ? [data.eventDetails.meals]
                : [],
            cocktails: data.eventDetails.cocktails || [],
            desserts: Array.isArray(data.eventDetails.desserts)
              ? [...data.eventDetails.desserts]
              : data.eventDetails.desserts
                ? [data.eventDetails.desserts]
                : [],
            notes: data.eventDetails.notes || "",
          });
        } else {
          // Reset event details if none exist
          setEventDetails({
            meals: [],
            cocktails: [],
            desserts: [],
            notes: "",
          });
        }

        // Reset the editable details too
        setEditableDetails({
          meals: [],
          cocktails: [],
          desserts: [],
          notes: "",
        });
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
      ([key, _]) => formatDateForAPI(new Date(key)) === formattedDate,
    )?.[1];

    const isSelected =
      selectedDate && formatDateForAPI(selectedDate) === formattedDate;

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

  // Handle input change with suggestions
  const handleInputWithSuggestions = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cocktail" | "meal" | "dessert",
    suggestions: string[],
  ) => {
    const value = e.target.value;

    // Update the appropriate state based on type
    switch (type) {
      case "cocktail":
        setNewCocktail(value);
        break;
      case "meal":
        setNewMeal(value);
        break;
      case "dessert":
        setNewDessert(value);
        break;
    }

    // Set the active suggestion type
    setActiveSuggestionType(type);

    // Filter and show suggestions if there's input
    if (value.trim()) {
      if (Array.isArray(suggestions)) {
        const filtered = suggestions.filter((item) =>
          item.toLowerCase().includes(value.toLowerCase()),
        );

        setFilteredSuggestions(filtered);
      } else {
        console.warn(`${type} suggestions is not an array:`, suggestions);
        setFilteredSuggestions([]);
      }
    } else {
      setFilteredSuggestions([]);
    }
  };

  // Specific handlers for each input type
  const handleCocktailInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    handleInputWithSuggestions(e, "cocktail", cocktailSuggestions);
  };

  const handleMealInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputWithSuggestions(e, "meal", mealSuggestions);
  };

  const handleDessertInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputWithSuggestions(e, "dessert", dessertSuggestions);
  };

  const addItemToCategory = (
    type: "cocktail" | "meal" | "dessert",
    value: string,
  ) => {
    if (!value.trim()) return;

    switch (type) {
      case "cocktail":
        setEditableDetails((prev) => ({
          ...prev,
          cocktails: [...prev.cocktails, value.trim()],
        }));
        setNewCocktail("");
        break;
      case "meal":
        setEditableDetails((prev) => ({
          ...prev,
          meals: [...prev.meals, value.trim()],
        }));
        setNewMeal("");
        break;
      case "dessert":
        setEditableDetails((prev) => ({
          ...prev,
          desserts: [...prev.desserts, value.trim()],
        }));
        setNewDessert("");
        break;
    }

    // Clear filtered suggestions
    setFilteredSuggestions([]);
    setActiveSuggestionType(null);
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
        `${API_BASE_URL}/api/movie-monday/create`,
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
        },
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

  // Start editing event details
  const startEditing = () => {
    setIsEditing(true);
    setEditableDetails({
      meals: Array.isArray(selectedMonday?.eventDetails?.meals)
        ? [...selectedMonday.eventDetails.meals]
        : selectedMonday?.eventDetails?.meals
          ? [selectedMonday.eventDetails.meals]
          : [],
      cocktails: selectedMonday?.eventDetails?.cocktails || [],
      desserts: Array.isArray(selectedMonday?.eventDetails?.desserts)
        ? [...selectedMonday.eventDetails.desserts]
        : selectedMonday?.eventDetails?.desserts
          ? [selectedMonday.eventDetails.desserts]
          : [],
      notes: selectedMonday?.eventDetails?.notes || "",
    });
  };

  // Cancel editing and discard changes
  const cancelEditing = () => {
    setIsEditing(false);
    setNewCocktail("");
    setNewMeal("");
    setNewDessert("");
    setFilteredSuggestions([]);
    setActiveSuggestionType(null);
  };

  // Save all event details
  const handleSaveAll = async () => {
    if (!selectedMonday || !token) return;

    setSavingDetails(true);
    try {
      // Send updated event details to the server
      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/${selectedMonday.id}/event-details`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editableDetails),
        },
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
        `${API_BASE_URL}/api/movie-monday/update-picker`,
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
        },
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
        `${API_BASE_URL}/api/movie-monday/${selectedMonday.id}/movies/${movieSelectionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
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
        `${API_BASE_URL}/api/movie-monday/${selectedMonday.id}/set-winner`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ movieSelectionId }),
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Only trigger confetti if the movie was set as a winner (not when removing winner status)
        if (data.isWinner) {
          // Trigger confetti animation
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }

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

  // Confirm discard changes
  const confirmDiscardChanges = () => {
    // Close the modal
    setShowUnsavedChangesModal(false);

    // If there's a pending date selection, process it now
    if (pendingDateSelection) {
      proceedWithDateSelection(pendingDateSelection);
      setPendingDateSelection(null);
    }
  };

  // Cancel discard changes
  const cancelDiscardChanges = () => {
    setShowUnsavedChangesModal(false);
    setPendingDateSelection(null);
  };

  // Calendar navigation functions
  const handlePrevious = () => {
    // Check for unsaved changes before navigation
    if (isEditing && hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);

      return;
    }

    setAnimationDirection("right");
    const newDates = mondayDates.map((date) => {
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
    // Check for unsaved changes before navigation
    if (isEditing && hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);

      return;
    }

    setAnimationDirection("left");
    const newDates = mondayDates.map((date) => {
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
    // Check for unsaved changes before jumping
    if (isEditing && hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);

      return;
    }

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
                <Button className="text-sm" variant="flat">
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
                      .findIndex(
                        (d) =>
                          d.getMonth() !== date.getMonth() ||
                          d.getFullYear() !== date.getFullYear(),
                      );

                    const width =
                      monthDatesCount === -1
                        ? ((mondayDates.length - idx) / mondayDates.length) *
                          100
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
                        <div className="h-px bg-gray-300 w-[95%] mx-auto mt-1" />
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
                aria-label="Previous weeks"
                className="min-w-unit-12 h-16"
                variant="light"
                onPress={handlePrevious}
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

                  const isNewMonth = isMonthStart(date, index, mondayDates);

                  return (
                    <div key={date.toISOString()} className="flex-1 flex">
                      {isNewMonth && index > 0 && (
                        <div className="w-px bg-default-300 self-stretch mx-1" />
                      )}
                      <Tooltip content={statusDescription}>
                        <Button
                          className="h-16 w-full flex flex-col items-center justify-center"
                          color={dateStatus.color}
                          variant={dateStatus.variant}
                          onPress={() => handleDateClick(date)}
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
                aria-label="Next weeks"
                className="min-w-unit-12 h-16"
                variant="light"
                onPress={handleNext}
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

              <Button
                color="primary"
                endContent={<ExternalLink className="h-4 w-4" />}
                isDisabled={
                  !selectedMonday || selectedMonday.status === "not_created"
                }
                variant="light"
                onPress={() =>
                  selectedMonday?.id &&
                  router.push(`/movie-monday/${selectedMonday.id}`)
                }
              >
                Full Analytics
              </Button>
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
                  isLoading={loading}
                  startContent={<Plus className="h-4 w-4" />}
                  onPress={() =>
                    selectedDate && handleCreateMovieMonday(selectedDate)
                  }
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
                  const movieSelections =
                    selectedMonday?.movieSelections?.sort(
                      (a, b) => a.id - b.id,
                    ) || [];
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
                              alt={movie.title}
                              className="object-cover w-full h-full"
                              src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
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
                              <Button
                                className={
                                  movie.isWinner
                                    ? "bg-warning-500 hover:bg-warning-600"
                                    : ""
                                }
                                color={movie.isWinner ? "warning" : "primary"}
                                startContent={<CrownIcon className="h-4 w-4" />}
                                variant={movie.isWinner ? "solid" : "solid"}
                                onPress={() => handleSetWinner(movie.id)}
                              >
                                {movie.isWinner
                                  ? "Remove Win"
                                  : "Set as Winner"}
                              </Button>
                              <Button
                                isIconOnly
                                color="danger"
                                variant="light"
                                onPress={() => handleRemoveMovie(movie.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                            aria-label="Edit details"
                            variant="light"
                            onPress={startEditing}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              color="danger"
                              startContent={<X className="h-4 w-4" />}
                              variant="light"
                              onPress={cancelEditing}
                            >
                              Cancel
                            </Button>
                            <Button
                              color="primary"
                              isLoading={savingDetails}
                              startContent={<Save className="h-4 w-4" />}
                              onPress={handleSaveAll}
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
                              <Button className="capitalize" variant="flat">
                                {selectedMonday?.picker?.username ||
                                  "Select Picker"}
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              disallowEmptySelection
                              aria-label="Select picker"
                              selectedKeys={
                                new Set([selectedMonday?.pickerUserId || ""])
                              }
                              selectionMode="single"
                              onSelectionChange={(keys) => {
                                if (keys instanceof Set && keys.size > 0) {
                                  const selected =
                                    Array.from(keys)[0].toString();

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
                          {/* Dinner input with suggestions */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-left block">
                              Dinner
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  placeholder="What meal did you serve? (press Enter after each)"
                                  startContent={
                                    <Utensils className="text-primary h-4 w-4" />
                                  }
                                  value={newMeal}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      if (activeSuggestionType === "meal") {
                                        setActiveSuggestionType(null);
                                      }
                                    }, 200);
                                  }}
                                  onChange={handleMealInputChange}
                                  onFocus={() => {
                                    setActiveSuggestionType("meal");
                                    if (newMeal.trim()) {
                                      handleMealInputChange({
                                        target: { value: newMeal },
                                      } as React.ChangeEvent<HTMLInputElement>);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && newMeal.trim()) {
                                      e.preventDefault();
                                      addItemToCategory("meal", newMeal);
                                    }
                                  }}
                                />

                                {/* Meal suggestions dropdown */}
                                {activeSuggestionType === "meal" &&
                                  filteredSuggestions.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full bg-background border border-default-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                      {filteredSuggestions.map(
                                        (suggestion, index) => (
                                          <div
                                            key={index}
                                            className="px-4 py-2 hover:bg-default-100 cursor-pointer"
                                            onMouseDown={() => {
                                              addItemToCategory(
                                                "meal",
                                                suggestion,
                                              );
                                            }}
                                          >
                                            {suggestion}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </div>

                              {/* Add meal button */}
                              <Button
                                isIconOnly
                                color="primary"
                                onPress={() => {
                                  if (newMeal.trim()) {
                                    addItemToCategory("meal", newMeal);
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Display meal chips */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Array.isArray(editableDetails.meals) &&
                                editableDetails.meals.map((meal, index) => (
                                  <Chip
                                    key={`${meal}-${index}`}
                                    color="primary"
                                    variant="flat"
                                    onClose={() => {
                                      setEditableDetails((prev) => ({
                                        ...prev,
                                        meals: Array.isArray(prev.meals)
                                          ? prev.meals.filter(
                                              (_, i) => i !== index,
                                            )
                                          : [],
                                      }));
                                    }}
                                  >
                                    {meal}
                                  </Chip>
                                ))}
                            </div>
                          </div>

                          {/* Desserts input with suggestions */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-left block">
                              Desserts
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  placeholder="What desserts did you serve? (press Enter after each)"
                                  startContent={
                                    <Cake className="text-danger h-4 w-4" />
                                  }
                                  value={newDessert}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      if (activeSuggestionType === "dessert") {
                                        setActiveSuggestionType(null);
                                      }
                                    }, 200);
                                  }}
                                  onChange={handleDessertInputChange}
                                  onFocus={() => {
                                    setActiveSuggestionType("dessert");
                                    if (newDessert.trim()) {
                                      handleDessertInputChange({
                                        target: { value: newDessert },
                                      } as React.ChangeEvent<HTMLInputElement>);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "Enter" &&
                                      newDessert.trim()
                                    ) {
                                      e.preventDefault();
                                      addItemToCategory("dessert", newDessert);
                                    }
                                  }}
                                />

                                {/* Dessert suggestions dropdown */}
                                {activeSuggestionType === "dessert" &&
                                  filteredSuggestions.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full bg-background border border-default-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                      {filteredSuggestions.map(
                                        (suggestion, index) => (
                                          <div
                                            key={index}
                                            className="px-4 py-2 hover:bg-default-100 cursor-pointer"
                                            onMouseDown={() => {
                                              addItemToCategory(
                                                "dessert",
                                                suggestion,
                                              );
                                            }}
                                          >
                                            {suggestion}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </div>

                              {/* Add dessert button */}
                              <Button
                                isIconOnly
                                color="danger"
                                onPress={() => {
                                  if (newDessert.trim()) {
                                    addItemToCategory("dessert", newDessert);
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Display dessert chips */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Array.isArray(editableDetails.desserts) &&
                                editableDetails.desserts.map(
                                  (dessert, index) => (
                                    <Chip
                                      key={`${dessert}-${index}`}
                                      color="danger"
                                      variant="flat"
                                      onClose={() => {
                                        setEditableDetails((prev) => ({
                                          ...prev,
                                          desserts: Array.isArray(prev.desserts)
                                            ? prev.desserts.filter(
                                                (_, i) => i !== index,
                                              )
                                            : [],
                                        }));
                                      }}
                                    >
                                      {dessert}
                                    </Chip>
                                  ),
                                )}
                            </div>
                          </div>

                          {/* Cocktail input with autocomplete */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-left block">
                              Cocktails
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Input
                                  placeholder="Add a cocktail (press Enter after each)"
                                  startContent={
                                    <Wine className="text-secondary h-4 w-4" />
                                  }
                                  value={newCocktail}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      if (activeSuggestionType === "cocktail") {
                                        setActiveSuggestionType(null);
                                      }
                                    }, 200);
                                  }}
                                  onChange={handleCocktailInputChange}
                                  onFocus={() => {
                                    setActiveSuggestionType("cocktail");
                                    if (newCocktail.trim()) {
                                      handleCocktailInputChange({
                                        target: { value: newCocktail },
                                      } as React.ChangeEvent<HTMLInputElement>);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "Enter" &&
                                      newCocktail.trim()
                                    ) {
                                      e.preventDefault();
                                      addItemToCategory(
                                        "cocktail",
                                        newCocktail,
                                      );
                                    }
                                  }}
                                />

                                {/* Cocktail suggestions dropdown */}
                                {activeSuggestionType === "cocktail" &&
                                  filteredSuggestions.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full bg-background border border-default-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                      {filteredSuggestions.map(
                                        (suggestion, index) => (
                                          <div
                                            key={index}
                                            className="px-4 py-2 hover:bg-default-100 cursor-pointer"
                                            onMouseDown={() => {
                                              addItemToCategory(
                                                "cocktail",
                                                suggestion,
                                              );
                                            }}
                                          >
                                            {suggestion}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                              </div>

                              {/* Add cocktail button */}
                              <Button
                                isIconOnly
                                color="secondary"
                                onPress={() => {
                                  if (newCocktail.trim()) {
                                    addItemToCategory("cocktail", newCocktail);
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Display cocktail chips */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {editableDetails.cocktails.map(
                                (cocktail, index) => (
                                  <Chip
                                    key={`${cocktail}-${index}`}
                                    color="secondary"
                                    variant="flat"
                                    onClose={() => {
                                      setEditableDetails((prev) => ({
                                        ...prev,
                                        cocktails: prev.cocktails.filter(
                                          (_, i) => i !== index,
                                        ),
                                      }));
                                    }}
                                  >
                                    {cocktail}
                                  </Chip>
                                ),
                              )}
                            </div>
                          </div>

                          {/* Notes textarea */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-left block">
                              Notes
                            </label>
                            <Textarea
                              className="min-h-24"
                              placeholder="Add any notes about this event..."
                              value={editableDetails.notes}
                              onChange={(e) =>
                                setEditableDetails((prev) => ({
                                  ...prev,
                                  notes: e.target.value,
                                }))
                              }
                            />
                          </div>
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
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Array.isArray(
                                  selectedMonday?.eventDetails?.meals,
                                ) &&
                                selectedMonday?.eventDetails?.meals.length ? (
                                  selectedMonday.eventDetails.meals.map(
                                    (meal, index) => (
                                      <Chip
                                        key={`${meal}-${index}`}
                                        color="primary"
                                        size="sm"
                                        variant="flat"
                                      >
                                        {meal}
                                      </Chip>
                                    ),
                                  )
                                ) : (
                                  <p className="text-default-700 text-sm">
                                    No meal recorded yet
                                  </p>
                                )}
                              </div>
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
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Array.isArray(
                                  selectedMonday?.eventDetails?.desserts,
                                ) &&
                                selectedMonday?.eventDetails?.desserts
                                  .length ? (
                                  selectedMonday.eventDetails.desserts.map(
                                    (dessert, index) => (
                                      <Chip
                                        key={`${dessert}-${index}`}
                                        color="danger"
                                        size="sm"
                                        variant="flat"
                                      >
                                        {dessert}
                                      </Chip>
                                    ),
                                  )
                                ) : (
                                  <p className="text-default-700 text-sm">
                                    No desserts recorded yet
                                  </p>
                                )}
                              </div>
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
                                {selectedMonday?.eventDetails?.cocktails
                                  ?.length ? (
                                  selectedMonday.eventDetails.cocktails.map(
                                    (cocktail, index) => (
                                      <Chip
                                        key={`${cocktail}-${index}`}
                                        color="secondary"
                                        size="sm"
                                        variant="flat"
                                      >
                                        {cocktail}
                                      </Chip>
                                    ),
                                  )
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
                                {selectedMonday?.eventDetails?.notes ||
                                  "No notes recorded yet"}
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

      {/* Unsaved Changes Confirmation Modal */}
      <Modal isOpen={showUnsavedChangesModal} onClose={cancelDiscardChanges}>
        <ModalContent>
          <ModalHeader className="flex gap-2 items-center">
            <AlertTriangle className="text-warning h-6 w-6" />
            <span>Unsaved Changes</span>
          </ModalHeader>
          <ModalBody>
            <p>
              You have unsaved changes to the event details. What would you like
              to do?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={confirmDiscardChanges}
            >
              Discard Changes
            </Button>
            <Button color="primary" onPress={cancelDiscardChanges}>
              Continue Editing
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DashboardCalendar;
