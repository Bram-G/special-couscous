import React, { useState } from 'react';
import { Card, CardHeader, CardBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@nextui-org/react";
import { Calendar, CalendarDate, DateValue } from "@nextui-org/calendar";
import { BarChart } from "lucide-react";
import { today } from '@internationalized/date';

// Define the shape of our event data
interface EventData {
  title: string;
  description: string;
  time: string;
  location: string;
}

const DashboardCalendar: React.FC = () => {
  // State management
  // selectedDate: Keeps track of the currently selected date
  const [selectedDate, setSelectedDate] = useState<CalendarDate>(today('UTC'));
  // eventData: Stores the event information for the selected date
  const [eventData, setEventData] = useState<EventData | null>(null);
  // Modal control using NextUI's useDisclosure hook
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Check if a given date is a Monday
  // In JavaScript, 0 = Sunday, 1 = Monday, etc.
  const isMonday = (date: DateValue): boolean => {
    const jsDate = date.toDate('UTC');
    return jsDate.getUTCDay() === 1; // Using UTC to ensure consistent day calculation
  };

  // Fetch event data for a selected Monday
  const fetchEventData = async (date: CalendarDate): Promise<void> => {
    try {
      // Convert the CalendarDate to a format suitable for API calls
      const dateObj = date.toDate('UTC');
      // Make API call (replace with your actual API endpoint)
      const response = await fetch(`/api/events/${dateObj.toISOString()}`);
      const data = await response.json();
      setEventData(data);
    } catch (error) {
      console.error('Error fetching event data:', error);
      setEventData(null);
    }
  };

  // Handle date selection in the calendar
  const handleDateSelect = (value: CalendarDate) => {
    if (isMonday(value)) {
      setSelectedDate(value);
      fetchEventData(value);
      onOpen(); // Open the modal when a Monday is selected
    }
  };

  return (
    <Card className="w-full">
      {/* Header section */}
      <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
        <h4 className="text-lg font-medium">Schedule</h4>
        <BarChart className="h-5 w-5 text-gray-600" />
      </CardHeader>

      {/* Calendar section */}
      <CardBody className="space-y-4">
        <div className="w-full">
          <p className="text-2xl font-bold">Calendar</p>
          <p className="text-sm text-gray-500">Past and Present Movie Mondays</p>
        </div>
        <div className="w-full rounded-lg">
          <Calendar
            className="w-full"
            value={selectedDate}
            onChange={handleDateSelect}
            isDateUnavailable={(date) => !isMonday(date)}
          />
        </div>
      </CardBody>

      {/* Event details modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Movie Monday - {selectedDate.toDate('UTC').toLocaleDateString()}
              </ModalHeader>
              <ModalBody>
                {eventData ? (
                  <div className="space-y-4">
                    <p className="font-bold">{eventData.title}</p>
                    <p>{eventData.description}</p>
                    <div className="text-sm text-gray-500">
                      <p>Time: {eventData.time}</p>
                      <p>Location: {eventData.location}</p>
                    </div>
                  </div>
                ) : (
                  <p>Loading event data...</p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default DashboardCalendar;