'use client'
import React, { useEffect, useState } from 'react';
import { Card } from '@heroui/react';
import DashboardCalendar from './DashboardCalendar';
import GroupManagement from './GroupManagement'; 
import WatchlistCarousel from './WatchlistCarousel';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="w-full flex flex-col gap-6">
        <Card className="w-full">
          <Card className="w-full">
            <DashboardCalendar 
              groupMembers={groupData?.members || []}
              groupId={groupData?.id}
              key={groupData?.id} // Add key to force re-render when group changes
            />
          </Card>
        </Card>

        <Card className="w-full">
          <GroupManagement onGroupUpdate={handleGroupUpdate} />
        </Card>

        <Card className="w-full">
          <WatchlistCarousel />
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;