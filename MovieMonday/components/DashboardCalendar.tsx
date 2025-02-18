import React, { useState, useEffect } from "react";
import { Card, Button, Image } from "@nextui-org/react";
import { ChevronLeft, ChevronRight, Plus, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardCalendarProps {
  slidesPerView?: number;
  onDateSelect?: (date: Date) => void;
  groupMembers?: { id: string; username: string; email: string }[];
  groupId?: string;
}

interface MovieSelection {
  id: number;
  tmdbMovieId: number;
  title: string;
  posterPath: string;
  isWinner: boolean;
}

interface MovieMonday {
  id: number;
  date: string;
  pickerUserId: string;
  status: "not_created" | "pending" | "in-progress" | "completed";
  movieSelections: MovieSelection[];
  picker: {
    id: string;
    username: string;
  } | null;
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  slidesPerView = 6,
  onDateSelect,
  groupMembers = [],
  groupId
}) => {
  const { token } = useAuth();
  const [mondayDates, setMondayDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonday, setSelectedMonday] = useState<MovieMonday | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dates = initializeMondays();
    setMondayDates(dates);
    const today = new Date();
    const firstMonday = getNextMonday(today);
    handleDateClick(firstMonday);

    if (token) {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(decodedToken.id);
    }
  }, [token]);

  const initializeMondays = (): Date[] => {
    const today = new Date();
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
    const nextMonday = new Date(date);
    nextMonday.setDate(date.getDate() + ((7 - date.getDay() + 1) % 7 || 7));
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

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setLoading(true);
    try {
      // Format date as YYYY-MM-DD to ignore time
      const formattedDate = date.toISOString().split('T')[0];
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
        setSelectedMonday(data);
      }
    } catch (error) {
      console.error("Error fetching movie monday details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMovieMonday = async (date: Date) => {
    if (!token || !groupId) {
      console.error('Missing required data:', { token: !!token, groupId });
      return;
    }
    
    setLoading(true);
  
    try {
      const response = await fetch('http://localhost:8000/api/movie-monday/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          date: date.toISOString(),
          groupId: groupId
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create MovieMonday:', errorData);
        return;
      }
  
      const data = await response.json();
      handleDateClick(date);
    } catch (error) {
      console.error('Error creating MovieMonday:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPickerForDate = (date: Date): string => {
    if (!groupMembers.length) return "";

    const startDate = mondayDates[0];
    const weeksDiff = Math.floor(
      (date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    const pickerIndex = weeksDiff % groupMembers.length;
    return groupMembers[pickerIndex]?.username || "";
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      );
    }

    if (selectedMonday?.status === "not_created") {
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-default-500">No Movie Monday scheduled for this date</p>
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
      );
    }

    // Render movie cards when there is data
    return (
      <div className="grid grid-cols-3 gap-4 p-4">
        {[0, 1, 2].map((index) => {
          const movie = selectedMonday?.movieSelections[index];
          return (
            <Card key={index} className="w-full h-64">
              {movie ? (
                <div className="relative h-full">
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                    alt={movie.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                    <p className="text-white text-center font-medium mb-2">
                      {movie.title}
                    </p>
                    {movie.isWinner && (
                      <Trophy className="text-yellow-400 h-8 w-8" />
                    )}
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
    );
  };

  return (
    <div className="space-y-4">
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

          <div className="flex flex-1 justify-between flex-wrap gap-2">
            {mondayDates.map((date) => (
              <Button
                key={date.toISOString()}
                variant={selectedDate && date.getTime() === selectedDate.getTime() ? "solid" : "light"}
                onPress={() => handleDateClick(date)}
                className="min-w-unit-20 flex flex-col items-center"
              >
                <span className="text-xs text-default-500">{getPickerForDate(date)}</span>
                <span>{formatDate(date)}</span>
              </Button>
            ))}
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

      {/* Content Area */}
      {selectedDate && (
        <Card className="w-full">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Movies for {selectedDate.toLocaleDateString()}
              </h3>
              {selectedMonday?.picker?.username && (
                <p className="text-sm text-default-500">
                  Picker: {selectedMonday.picker.username}
                </p>
              )}
            </div>
          </div>
          {renderContent()}
        </Card>
      )}
    </div>
  );
};

export default DashboardCalendar;