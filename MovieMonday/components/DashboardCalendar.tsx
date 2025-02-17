import React, { useState, useCallback } from 'react';
import { Card, Button } from "@nextui-org/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MondaySliderProps {
  slidesPerView?: number; // Number of Mondays to display at once
  onDateSelect?: (date: Date) => void; // Callback for date selection
}

const MondaySlider: React.FC<MondaySliderProps> = ({ 
  slidesPerView = 6, // Default to 4 if not specified
  onDateSelect 
}) => {
  // Helper function to get next Monday from a date
  const getNextMonday = (date: Date): Date => {
    const nextMonday = new Date(date);
    nextMonday.setDate(date.getDate() + ((7 - date.getDay() + 1) % 7 || 7));
    return nextMonday;
  };

  // Helper function to get previous Monday from a date
  const getPreviousMonday = (date: Date): Date => {
    const prevMonday = new Date(date);
    const diff = prevMonday.getDay() || 7;
    prevMonday.setDate(prevMonday.getDate() - diff + 1);
    return prevMonday;
  };

  // Initialize with current and next N Mondays
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

  const [mondayDates, setMondayDates] = useState<Date[]>(initializeMondays());
  const [selectedDate, setSelectedDate] = useState<Date>(mondayDates[0]);

  // Navigate to previous set of Mondays
  const handlePrevious = () => {
    const newDates = mondayDates.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() - (7 * slidesPerView)); // Go back N weeks
      return newDate;
    });
    setMondayDates(newDates);
  };

  // Navigate to next set of Mondays
  const handleNext = () => {
    const newDates = mondayDates.map(date => {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + (7 * slidesPerView)); // Go forward N weeks
      return newDate;
    });
    setMondayDates(newDates);
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
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
          {mondayDates.map((date, index) => (
            <Button
              key={date.toISOString()}
              variant={date.toDateString() === selectedDate.toDateString() ? "solid" : "light"}
              onPress={() => handleDateSelect(date)}
              className={`min-w-unit-20 ${slidesPerView > 6 ? 'text-sm' : ''}`}
            >
              {formatDate(date)}
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
  );
};

export default MondaySlider;