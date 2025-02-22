"use client";
import React, { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { BarChart, Activity, Users } from "lucide-react";
import DashboardCalendar from "./DashboardCalendar";
import GroupManagement from "./GroupManagement";
import WatchlistCarousel from "./WatchlistCarousel";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// Define interfaces for type safety
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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!token) return;

      try {
        const response = await fetch("http://localhost:8000/api/users/group", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setGroupData(data);
        }
      } catch (error) {
        console.error("Error fetching group data:", error);
      } finally {
        setFetchingGroup(false);
      }
    };

    if (isAuthenticated) {
      fetchGroupData();
    }
  }, [isAuthenticated, token]);

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
          <CardBody className="space-y-4">
            <p className="text-2xl font-bold">Mondays</p>
            <p className="text-sm text-gray-500">Got a case of the Mondays</p>
            <div className="w-full rounded-lg flex items-center justify-center">
              <DashboardCalendar
                groupMembers={groupData?.members || []}
                groupId={groupData?.id}
                onDateSelect={(date) => {
                  console.log("Selected date:", date);
                  // Handle date selection if needed
                }}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="w-full">
          <GroupManagement />
        </Card>

        <Card className="w-full">
          <WatchlistCarousel />
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
