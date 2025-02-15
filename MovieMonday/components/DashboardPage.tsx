'use client'
import React from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { BarChart, Activity, Users } from 'lucide-react';
import DashboardCalendar from './DashboardCalendar';

const DashboardPage = () => {
  return (
    // Set width to 100% and remove any max-width constraints
    <div className="w-full">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="w-full flex flex-col gap-6">
        {/* Analytics Section */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
            <h4 className="text-lg font-medium">Schedule</h4>
            <BarChart className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="w-full">
              <p className="text-2xl font-bold">Calendar</p>
              <p className="text-sm text-gray-500">Past and Present Movie Mondays</p>
            </div>
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <DashboardCalendar />
            </div>
          </CardBody>
        </Card>

        {/* Performance Section */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
            <h4 className="text-lg font-medium"></h4>
            <Activity className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="w-full flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-sm text-gray-500">Uptime</p>
              </div>
              <div>
                <p className="text-2xl font-bold">45ms</p>
                <p className="text-sm text-gray-500">Latency</p>
              </div>
            </div>
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Placeholder for metrics</p>
            </div>
          </CardBody>
        </Card>

        {/* Users Section */}
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
            <h4 className="text-lg font-medium">Users</h4>
            <Users className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="w-full">
              <p className="text-2xl font-bold">5,678</p>
              <p className="text-sm text-gray-500">Active Users</p>
            </div>
            <div className="w-full space-y-2">
              {['John Doe', 'Jane Smith', 'Bob Johnson'].map((user, index) => (
                <div key={index} className="w-full flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                  <p className="text-sm">{user}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;