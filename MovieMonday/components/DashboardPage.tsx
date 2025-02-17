'use client'
import React from 'react';
import { Card, CardBody, CardHeader } from '@nextui-org/react';
import { BarChart, Activity, Users } from 'lucide-react';
import DashboardCalendar from './DashboardCalendar';
import GroupManagement from './GroupManagement'; 
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const DashboardPage = () => {

  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div>Loading...</div>; // Or your loading component
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    // Set width to 100% and remove any max-width constraints
    <div className="w-full">
      
      <div className="w-full flex flex-col gap-6">
        <Card className="w-full">
          <CardBody className="space-y-4">
          <p className="text-2xl font-bold">Mondays</p>
          <p className="text-sm text-gray-500">Got a case of the Mondays</p>
            <div className="w-full rounded-lg flex items-center justify-center">
              <DashboardCalendar />
            </div>
          </CardBody>
        </Card>

        <Card className="w-full">
          <GroupManagement />
        </Card>

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