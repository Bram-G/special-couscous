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
  MoreVertical,
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
    desserts?: string;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

  // Track which movie card has its action menu open (by movie selection id)
  const [activeMovieMenu, setActiveMovieMenu] = useState<number | null>(null);

  // Jump to Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState<Date>(new Date());

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

    const fetchSuggestions = async () => {
      try {
        const cocktailResponse = await fetch(
          `${API_BASE_URL}/api/movie-monday/cocktails`,
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
            setCocktailSuggestions([]);
          }
        }

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
            setMealSuggestions([]);
          }
        }

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

    nextMonday.setHours(12, 0, 0, 0);

    const daysUntilMonday = (8 - nextMonday.getDay()) % 7;

    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);

    return nextMonday;
  };

  // Initialize Mondays for the calendar
  const initializeMondays = (): Date[] => {
    const today = new Date();

    today.setHours(12, 0, 0, 0);
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
    if (isEditing && hasUnsavedChanges()) {
      setPendingDateSelection(date);
      setShowUnsavedChangesModal(true);

      return;
    }

    proceedWithDateSelection(date);
  };

  // Proceed with date selection after handling unsaved changes
  const proceedWithDateSelection = async (date: Date) => {
    setSelectedDate(date);
    setLoading(true);
    setIsEditing(false);

    try {
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
          setEventDetails({
            meals: [],
            cocktails: [],
            desserts: [],
            notes: "",
          });
        }

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

    setActiveSuggestionType(type);

    if (value.trim()) {
      if (Array.isArray(suggestions)) {
        const filtered = suggestions.filter((item) =>
          item.toLowerCase().includes(value.toLowerCase()),
        );

        setFilteredSuggestions(filtered);
      } else {
        setFilteredSuggestions([]);
      }
    } else {
      setFilteredSuggestions([]);
    }
  };

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

    setFilteredSuggestions([]);
    setActiveSuggestionType(null);
  };

  // Create a new MovieMonday
  const handleCreateMovieMonday = async (date: Date) => {
    if (!token || !groupId) {
      return;
    }

    setLoading(true);

    try {
      const dateString = date.toISOString().split("T")[0];

      const response = await fetch(`${API_BASE_URL}/api/movie-monday/create`, {
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
      });

      if (!response.ok) {
        const errorData = await response.json();

        console.error("Failed to create MovieMonday:", errorData);

        return;
      }

      await handleDateClick(date);
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
        await handleDateClick(selectedDate);
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
        handleDateClick(selectedDate);
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

        if (data.isWinner) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }

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
    setShowUnsavedChangesModal(false);

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

  // Calendar navigation
  const handlePrevious = () => {
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

  // Jump to a specific Monday date
  const jumpToDate = (date: Date) => {
    if (isEditing && hasUnsavedChanges()) {
      setShowUnsavedChangesModal(true);

      return;
    }

    const newDates: Date[] = [];

    for (let i = 0; i < slidesPerView; i++) {
      const d = new Date(date);

      d.setDate(date.getDate() + i * 7);
      newDates.push(d);
    }

    setMondayDates(newDates);
    setShowDatePicker(false);
    handleDateClick(date);
  };

  // Generate all calendar day cells for the date-picker month view
  // FIX: this was missing from the previous version, causing the crash
  const generateCalendarDays = (monthDate: Date): (Date | null)[] => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Pad start so the grid aligns to Sunday = column 0
    const startPad = firstDay.getDay();
    const days: (Date | null)[] = Array(startPad).fill(null);

    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  // Generate month options for dropdown (kept for reference, no longer used in UI)
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    for (let year = currentYear; year >= currentYear - 2; year--) {
      for (let month = 11; month >= 0; month--) {
        if (year === currentYear && month > currentDate.getMonth()) {
          continue;
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
            <Button
              className="text-sm"
              variant="flat"
              onPress={() => {
                setDatePickerMonth(new Date());
                setShowDatePicker(true);
              }}
            >
              Jump to Date
            </Button>
          </div>
        </div>

        {/* Calendar with side navigation */}
        <div className="flex items-center">
          <div className="flex-1 flex flex-col">
            {/* Month labels */}
            <div className="flex mb-2 w-full justify-center">
              <div className="flex mb-6 relative pt-2 w-5/6 justify-between">
                {mondayDates.map((date, idx) => {
                  if (isMonthStart(date, idx, mondayDates)) {
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

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : selectedMonday?.status === "not_created" ? (
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
            <div className="flex flex-col md:flex-row gap-4 p-4">

              {/* Movie Cards Section */}
              <div className="w-full md:w-3/5 grid grid-cols-3 gap-2 md:gap-4">
                {[0, 1, 2].map((index) => {
                  const movieSelections =
                    selectedMonday?.movieSelections?.sort(
                      (a, b) => a.id - b.id,
                    ) || [];
                  const movie = movieSelections[index];

                  return (
                    <div
                      key={index}
                      className="relative w-full"
                      style={{ aspectRatio: "2/3" }}
                    >
                      <Card
                        className={`absolute inset-0 overflow-hidden ${
                          movie?.isWinner
                            ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50"
                            : ""
                        }`}
                      >
                        {movie ? (
                          <div className="relative h-full">

                            {/* Poster — tapping navigates to movie page */}
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

                            {/* Always-visible ⋮ action menu (top-right) */}
                            <div className="absolute top-1.5 right-1.5 z-20">
                              <Dropdown
                                isOpen={activeMovieMenu === movie.id}
                                onOpenChange={(open) =>
                                  setActiveMovieMenu(open ? movie.id : null)
                                }
                              >
                                <DropdownTrigger>
                                  <Button
                                    isIconOnly
                                    className="bg-black/60 backdrop-blur-sm min-w-7 w-7 h-7"
                                    size="sm"
                                    variant="flat"
                                    onPress={() => {
                                      setActiveMovieMenu((prev) =>
                                        prev === movie.id ? null : movie.id,
                                      );
                                    }}
                                  >
                                    <MoreVertical className="h-4 w-4 text-white" />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Movie actions">
                                  <DropdownItem
                                    key="winner"
                                    startContent={
                                      <CrownIcon className="h-4 w-4" />
                                    }
                                    onPress={() => {
                                      setActiveMovieMenu(null);
                                      handleSetWinner(movie.id);
                                    }}
                                  >
                                    {movie.isWinner
                                      ? "Remove Winner"
                                      : "Set as Winner"}
                                  </DropdownItem>
                                  <DropdownItem
                                    key="remove"
                                    className="text-danger"
                                    color="danger"
                                    startContent={
                                      <Trash2 className="h-4 w-4" />
                                    }
                                    onPress={() => {
                                      setActiveMovieMenu(null);
                                      handleRemoveMovie(movie.id);
                                    }}
                                  >
                                    Remove Movie
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </div>

                            {/* Winner trophy badge (top-left, always visible) */}
                            {movie.isWinner && (
                              <div className="absolute top-1.5 left-1.5 z-20">
                                <div className="bg-yellow-500 text-white rounded-full p-1">
                                  <Trophy className="h-3.5 w-3.5" />
                                </div>
                              </div>
                            )}

                            {/* Title bar at bottom */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 z-10 pointer-events-none">
                              <p className="text-white text-xs font-medium truncate text-center">
                                {movie.title}
                              </p>
                            </div>

                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-default-400 text-xs">Empty</p>
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                })}
              </div>

              {/* Event Details Section */}
              <div className="w-full md:w-2/5">
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
                          {/* Dinner input */}
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

                          {/* Desserts input */}
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
                                      if (
                                        activeSuggestionType === "dessert"
                                      ) {
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
                                          desserts: Array.isArray(
                                            prev.desserts,
                                          )
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

                          {/* Cocktails input */}
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
                                      if (
                                        activeSuggestionType === "cocktail"
                                      ) {
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
                        /* Display mode */
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

                          {/* Cocktails display */}
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

      {/* Jump to Date — Monday-only calendar picker */}
      <Modal
        isOpen={showDatePicker}
        size="sm"
        onClose={() => setShowDatePicker(false)}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>Jump to Date</span>
            <p className="text-xs font-normal text-default-500">
              Only Mondays are selectable
            </p>
          </ModalHeader>
          <ModalBody className="pb-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => {
                  const prev = new Date(datePickerMonth);

                  prev.setMonth(prev.getMonth() - 1);
                  setDatePickerMonth(prev);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-semibold">
                {datePickerMonth.toLocaleDateString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => {
                  const next = new Date(datePickerMonth);

                  next.setMonth(next.getMonth() + 1);
                  setDatePickerMonth(next);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div
                  key={d}
                  className={`text-center text-xs font-semibold pb-1 ${
                    d === "Mo" ? "text-primary" : "text-default-400"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {generateCalendarDays(datePickerMonth).map((day, idx) => {
                if (!day) {
                  return <div key={`pad-${idx}`} />;
                }
                const isMonday = day.getDay() === 1;
                const isToday =
                  day.toDateString() === new Date().toDateString();
                const isSelected =
                  selectedDate &&
                  day.toDateString() === selectedDate.toDateString();

                return (
                  <button
                    key={day.toISOString()}
                    disabled={!isMonday}
                    className={`
                      h-9 w-full rounded-lg text-sm font-medium transition-colors
                      ${
                        isSelected
                          ? "bg-primary text-white"
                          : isMonday
                            ? isToday
                              ? "bg-primary/20 text-primary hover:bg-primary hover:text-white"
                              : "text-primary hover:bg-primary/20"
                            : "text-default-300 cursor-not-allowed"
                      }
                    `}
                    onClick={() => isMonday && jumpToDate(day)}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DashboardCalendar;