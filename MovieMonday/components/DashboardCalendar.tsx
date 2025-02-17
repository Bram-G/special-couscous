import React, { useState, useEffect } from 'react';
import { Card, Button, Image } from "@nextui-org/react";
import { ChevronLeft, ChevronRight, Plus, Trophy } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

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
  pickerUsername: string;
  status: 'not_created' | 'pending' | 'in-progress' | 'completed';
  movieSelections: MovieSelection[];
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
    handleDateClick(dates[0]); // Select first date by default

    // Get current user ID from token
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
      nextDate.setDate(firstMonday.getDate() + (i * 7));
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
    const newDates = mondayDates.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() - (7 * slidesPerView));
      return newDate;
    });
    setMondayDates(newDates);
  };

  const handleNext = () => {
    const newDates = mondayDates.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + (7 * slidesPerView));
      return newDate;
    });
    setMondayDates(newDates);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/movie-monday/${date.toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedMonday(data);
      }
    } catch (error) {
      console.error('Error fetching movie monday details:', error);
    } finally {
      setLoading(false);
    }
  };

  const setWinningMovie = async (movieSelectionId: number) => {
    if (!selectedMonday || !token) return;

    try {
      await fetch(`http://localhost:8000/api/movie-monday/${selectedMonday.id}/set-winner`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieSelectionId
        })
      });

      // Refresh the movie data
      if (selectedDate) {
        handleDateClick(selectedDate);
      }
    } catch (error) {
      console.error('Error setting winner:', error);
    }
  };

  // Get picker for a specific date based on rotation
  const getPickerForDate = (date: Date): string => {
    if (!groupMembers.length) return '';
    
    const startDate = mondayDates[0];
    const weeksDiff = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const pickerIndex = weeksDiff % groupMembers.length;
    return groupMembers[pickerIndex]?.username || '';
  };

  const handleCreateMovieMonday = async (date: Date) => {
    if (!token || !groupId) return;
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
          groupId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error creating MovieMonday:', error);
        return;
      }

      // Refresh the data after creation
      handleDateClick(date);
    } catch (error) {
      console.error('Error creating MovieMonday:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMovieSlots = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      );
    }

    // Add this block for handling not_created status
    if (selectedMonday?.status === 'not_created') {
      return (
        <div className="flex flex-col items-center justify-center h-[400px] gap-4">
          <p className="text-default-500">No Movie Monday scheduled for this date</p>
          {groupId ? (
            <Button
              color="primary"
              onPress={() => selectedDate && handleCreateMovieMonday(selectedDate)}
              startContent={<Plus className="h-4 w-4" />}
            >
              Create Movie Monday
            </Button>
          ) : (
            <p className="text-sm text-default-400">Join or create a group to schedule Movie Mondays</p>
          )}
        </div>
      );
    }
  
    const movieSelections = selectedMonday?.movieSelections || [];
    const isPicker = selectedMonday?.pickerUserId === currentUserId;
    const now = new Date();
    const isDatePassed = selectedDate ? selectedDate < now : false;

  };

  return (
    <div className="space-y-4">
      <Card className="w-full p-4">
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
                variant={date === selectedDate ? "solid" : "light"}
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

      {selectedDate && (
        <Card className="w-full">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Movies for {selectedDate.toLocaleDateString()}
              </h3>
              {selectedMonday?.pickerUsername && (
                <p className="text-sm text-default-500">
                  Picker: {selectedMonday.pickerUsername}
                </p>
              )}
            </div>
          </div>
          {renderMovieSlots()}
        </Card>
      )}
    </div>
  );
};

export default DashboardCalendar;