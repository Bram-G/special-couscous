'use client'
import React, { useEffect, useState } from 'react';
import { Card, Spinner } from '@heroui/react';
import DashboardCalendar from './DashboardCalendar';
import GroupManagement from './GroupManagement'; 
import DashboardWatchlistSection from './DashboardWatchlistSection';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardAnalyticsWidget from './DashboardAnalyticsWidget';

interface GroupMember {
  id: string;
  username: string;
  email: string;
}

interface Group {
  id: string;
  name: string;
  createdById: string;
  members: GroupMember[];
}

const DashboardPage = () => {
  const { isAuthenticated, isLoading, token } = useAuth();
  const router = useRouter();
  const [groupData, setGroupData] = useState<Group | null>(null);
  const [fetchingGroup, setFetchingGroup] = useState(true);

  const fetchGroupData = async () => {
    if (!token) return;

    try {
      const response = await fetch('http://localhost:8000/api/users/group', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setGroupData(data);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setFetchingGroup(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Store the current URL before redirecting
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        router.push('/login');
      } else {
        fetchGroupData();
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Add handler for group updates
  const handleGroupUpdate = () => {
    fetchGroupData();
  };

  if (isLoading || fetchingGroup) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="w-full flex flex-col gap-6">
        {/* Calendar Section */}
        <Card className="w-full">
          <DashboardCalendar 
            groupMembers={groupData?.members || []}
            groupId={groupData?.id}
            key={groupData?.id} // Add key to force re-render when group changes
          />
        </Card>

        {/* Group Management and Analytics Section - Updated Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Group Management takes 1/3 width (4 of 12 columns) */}
          <div className="lg:col-span-4">
            <GroupManagement onGroupUpdate={handleGroupUpdate} />
          </div>
          
          {/* Analytics takes 2/3 width (8 of 12 columns) */}
          <div className="lg:col-span-8">
            <DashboardAnalyticsWidget />
          </div>
        </div>

        <DashboardWatchlistSection />
      </div>
    </div>
  );
}

export default DashboardPage;