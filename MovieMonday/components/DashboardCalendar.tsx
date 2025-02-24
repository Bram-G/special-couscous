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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CrownIcon } from "lucide-react";
import confetti from "canvas-confetti";

interface DashboardCalendarProps {
  slidesPerView?: number;
  onDateSelect?: (date: Date) => void;
  groupMembers?: { id: string; username: string; email: string }[];
  groupId?: string;
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

interface EventDetails {
  meals: string;
  cocktails: string[];
  notes: string;
}

interface EventDetails {
  meals: string;
  cocktails: string;
  notes: string;
}
const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  slidesPerView = 6,
  onDateSelect,
  groupMembers = [],
  groupId,
}) => {
  const { token } = useAuth();
  const [mondayDates, setMondayDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonday, setSelectedMonday] = useState<MovieMonday | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [editingPicker, setEditingPicker] = useState(false);
  const [movieMondayMap, setMovieMondayMap] = useState<
    Map<string, MovieMonday>
  >(new Map());
  const [savingDetails, setSavingDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    meals: "",
    cocktails: [],
    notes: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editableDetails, setEditableDetails] = useState<EventDetails>({
    meals: "",
    cocktails: [],
    notes: "",
  });

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
            date: selectedDate?.toISOString(),
            movieMondayId: selectedMonday.id,
            pickerUserId: newPickerId,
          }),
        }
      );

      if (response.ok) {
        // Refresh the entire movie monday data to ensure we have the latest state
        if (selectedDate) {
          await handleDateClick(selectedDate);
        }
        setEditingPicker(false);
      }
    } catch (error) {
      console.error("Error updating picker:", error);
    }
  };

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

  const getNextMonday = (date: Date): Date => {
    // Create date with time set to noon to avoid timezone issues
    const nextMonday = new Date(date);
    nextMonday.setHours(12, 0, 0, 0);

    // Calculate days until next Monday
    const daysUntilMonday = (8 - nextMonday.getDay()) % 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);

    return nextMonday;
  };

  const handlePrevious = () => {
    const newDates = mondayDates.map((date) => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() - 7 * slidesPerView);
      return newDate;
    });
    setMondayDates(newDates);
  };

  const handleNext = () => {
    const newDates = mondayDates.map((date) => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + 7 * slidesPerView);
      return newDate;
    });
    setMondayDates(newDates);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setLoading(true);
    try {
      // Log the date object and formatted string
      console.log("Calendar date click:", {
        originalDate: date,
        dateToString: date.toString(),
        dateToISO: date.toISOString(),
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      });

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      console.log("Formatted date to send:", formattedDate);

      const response = await fetch(
        `http://localhost:8000/api/movie-monday/${formattedDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);
        setSelectedMonday(data);
        setMovieMondayMap(
          new Map(movieMondayMap.set(date.toISOString(), data))
        );
        // ... rest of the function

        if (data.eventDetails) {
          setEventDetails({
            meals: data.eventDetails.meals || "",
            cocktails: data.eventDetails.cocktails || [],
            notes: data.eventDetails.notes || "",
          });
        } else {
          setEventDetails({
            meals: "",
            cocktails: [],
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

  const handleSaveDetails = async () => {
    if (!selectedMonday || !token) return;

    setSavingDetails(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/movie-monday/${selectedMonday.id}/event-details`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meals: eventDetails.meals,
            cocktails: eventDetails.cocktails,
            notes: eventDetails.notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save event details");
      }

      // Show success toast
      addToast({
        title: "Success",
        description: "Event details saved successfully",
        variant: "solid",
        promise: new Promise((resolve) => setTimeout(resolve, 2000)),
      });

      // Refresh the movie monday data
      if (selectedDate) {
        await handleDateClick(selectedDate);
      }
    } catch (error) {
      console.error("Error saving event details:", error);
      // Show error toast
      addToast({
        title: "Error",
        description: "Failed to save event details. Please try again.",
        variant: "solid",
        promise: new Promise((resolve) => setTimeout(resolve, 2000)),
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSaveAll = async () => {
    if (!selectedMonday || !token) return;

    setSavingDetails(true);
    try {
      // Save event details
      await fetch(
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

  const getDateButtonStyle = (date: Date) => {
    const formattedDate = formatDateForAPI(date);
    const movieMonday = movieMondayMap.get(formattedDate);
    const isSelected =
      selectedDate && formatDateForAPI(selectedDate) === formattedDate;

    let variant = "light";
    let color = "default";

    if (isSelected) {
      variant = "solid";
    }

    if (movieMonday) {
      if (movieMonday.status === "completed") {
        color = "success";
      } else if (movieMonday.status === "in-progress") {
        color = "primary";
      } else if (movieMonday.status === "pending") {
        color = "warning";
      }
    }

    return { variant, color };
  };

  const handleCreateMovieMonday = async (date: Date) => {
    if (!token || !groupId) {
      console.error("Missing required data:", { token: !!token, groupId });
      return;
    }

    setLoading(true);

    try {
      // Create a new date object from the selected date
      const selectedDate = new Date(date);
      // Get just the date part in YYYY-MM-DD format
      const dateString = selectedDate.toISOString().split("T")[0];

      console.log("Creating MovieMonday for:", {
        originalDate: date,
        selectedDate: selectedDate,
        dateString: dateString,
      });

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
            date: dateString, // Send just the YYYY-MM-DD string
            groupId: groupId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to create MovieMonday:", errorData);
        return;
      }

      const data = await response.json();
      await handleDateClick(date); // Refresh the data for this date
    } catch (error) {
      console.error("Error creating MovieMonday:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPickerForDate = (date: Date): string => {
    const formattedDate = formatDateForAPI(date);
    const movieMonday = movieMondayMap.get(formattedDate);
    if (movieMonday && movieMonday.picker) {
      return movieMonday.picker.username;
    }
    return "";
  };

  const router = useRouter();

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

      if (response.ok) {
        // Refresh the movie monday data
        if (selectedDate) {
          handleDateClick(selectedDate);
        }
      }
    } catch (error) {
      console.error("Error removing movie:", error);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleMovieClick = (movieId: number) => {
    router.push(`/movie/${movieId}`);
  };

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
        triggerConfetti();

        // Refresh the movie monday data
        if (selectedDate) {
          handleDateClick(selectedDate);
        }
      }
    } catch (error) {
      console.error("Error setting winner:", error);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Calendar - Always visible */}
      <Card className="w-full p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={handlePrevious}
            className="min-w-unit-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 justify-between flex-wrap">
            {mondayDates.map((date) => {
              const buttonStyle = getDateButtonStyle(date);
              return (
                <Button
                  key={date.toISOString()}
                  variant={buttonStyle.variant}
                  color={buttonStyle.color}
                  onPress={() => handleDateClick(date)}
                  className="min-w-unit-20 flex flex-col justify-between gap-0"
                >
                  <span className="text-xs text-default-900">
                    {getPickerForDate(date)}
                  </span>
                  <span>{formatDate(date)}</span>
                </Button>
              );
            })}
          </div>

          <Button
            isIconOnly
            variant="light"
            onPress={handleNext}
            className="min-w-unit-10"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </Card>
      {selectedDate && (
        <Card className="w-full">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Movies for {selectedDate.toLocaleDateString()}
              </h3>
            </div>
          </div>

          {/* If loading, show spinner */}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : selectedMonday?.status === "not_created" ? (
            /* If no Movie Monday exists, show create button */
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="text-default-500">
                No Movie Monday scheduled for this date
              </p>
              {groupId ? (
                <Button
                  color="primary"
                  onPress={() =>
                    selectedDate && handleCreateMovieMonday(selectedDate)
                  }
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
            /* If Movie Monday exists, show movies and event details */
            <div className="flex gap-4 p-4">
              {/* Movie Cards Section */}
              <div className="w-3/5 grid grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => {
                  const movieSelections =
                    selectedMonday?.movieSelections?.sort(
                      (a, b) => a.id - b.id
                    ) || [];
                  const movie = movieSelections[index];
                  return (
                    <Card
                      key={index}
                      className={`w-full h-80 relative group ${
                        movie?.isWinner
                          ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/50"
                          : ""
                      }`}
                    >
                      {movie ? (
                        <div
                          className="relative h-full cursor-pointer"
                          onClick={() => handleMovieClick(movie.tmdbMovieId)}
                        >
                          <Image
                            src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                            alt={movie.title}
                            className="object-cover w-full h-full"
                          />
                          <div
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 z-10"
                            onClick={(e: React.MouseEvent) =>
                              e.stopPropagation()
                            }
                          >
                            <p className="text-white text-center font-medium mb-4">
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
                                  startContent={<Trophy className="h-8 w-8" />}
                                >
                                  <span className="sr-only">
                                    Remove Winner Status
                                  </span>
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    color="warning"
                                    variant="solid"
                                    onPress={() => handleSetWinner(movie.id)}
                                    className="bg-warning-500 hover:bg-warning-600"
                                    startContent={
                                      <CrownIcon className="h-4 w-4" />
                                    }
                                  >
                                    Winner
                                  </Button>
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
              {/* Event Details Section - 40% width */}
              <div className="w-2/5">
                <Card className="p-4">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Event Details</h3>
                      <div className="flex items-center gap-2">
                        {!isEditing ? (
                          <Button
                            isIconOnly
                            variant="light"
                            onPress={() => {
                              setIsEditing(true);
                              setEditableDetails({
                                meals:
                                  selectedMonday?.eventDetails?.meals || "",
                                cocktails:
                                  selectedMonday?.eventDetails?.cocktails || [],
                                notes:
                                  selectedMonday?.eventDetails?.notes || "",
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
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Picker:</span>
                        {isEditing ? (
                          <Dropdown>
                            <DropdownTrigger>
                              <Button variant="flat" className="capitalize">
                                {selectedMonday?.picker?.username ||
                                  "Select Picker"}
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label="Select picker"
                              selectionMode="single"
                              disallowEmptySelection
                              selectedKeys={
                                new Set([selectedMonday?.pickerUserId || ""])
                              }
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

                      <div className="space-y-4">
                        {isEditing ? (
                          <>
                            <Input
                              label="Meals"
                              placeholder="What did you eat?"
                              value={editableDetails.meals}
                              onChange={(e) =>
                                setEditableDetails((prev) => ({
                                  ...prev,
                                  meals: e.target.value,
                                }))
                              }
                            />

                            <Input
                              label="Cocktails"
                              placeholder="Enter cocktails (comma-separated)"
                              value={
                                Array.isArray(editableDetails.cocktails)
                                  ? editableDetails.cocktails.join(", ")
                                  : editableDetails.cocktails
                              }
                              onChange={(e) =>
                                setEditableDetails((prev) => ({
                                  ...prev,
                                  cocktails: e.target.value
                                    .split(",")
                                    .map((item) => item.trim())
                                    .filter(Boolean),
                                }))
                              }
                            />

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
                            />
                          </>
                        ) : (
                          <>
                            <div>
                              <h4 className="font-medium mb-1">Meals</h4>
                              <p className="text-default-600">
                                {selectedMonday?.eventDetails?.meals ||
                                  "No meals recorded"}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-medium mb-1">Cocktails</h4>
                              <p className="text-default-600">
                                {selectedMonday?.eventDetails?.cocktails?.length
                                  ? selectedMonday.eventDetails.cocktails.join(
                                      ", "
                                    )
                                  : "No cocktails recorded"}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-medium mb-1">Notes</h4>
                              <p className="text-default-600">
                                {selectedMonday?.eventDetails?.notes ||
                                  "No notes recorded"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
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
