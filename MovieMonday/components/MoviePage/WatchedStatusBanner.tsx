"use client";
import React, { useState, useEffect } from "react";
import { Card, Chip, Button, Spinner } from "@heroui/react";
import { Eye, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface WatchedStatusBannerProps {
  tmdbMovieId: number;
  movieTitle: string;
}

export default function WatchedStatusBanner({
  tmdbMovieId,
  movieTitle,
}: WatchedStatusBannerProps) {
  const { currentGroupId } = useAuth();
  const [watchedInfo, setWatchedInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentGroupId) {
      setLoading(false);
      return;
    }

    checkWatchedStatus();
  }, [currentGroupId, tmdbMovieId]);

  const checkWatchedStatus = async () => {
    try {
      setLoading(true);
      
      // Check if this movie has been watched
      const response = await fetch(
        `${API_BASE_URL}/api/movie-monday/discovery-status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            group_id: currentGroupId,
            tmdb_ids: [tmdbMovieId],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check watched status");
      }

      const data = await response.json();
      
      // Check if movie was watched
      const isWatched = data.watched?.includes(tmdbMovieId);
      
      // Check if movie was voted on but not picked
      const votedButNotPicked = data.votedButNotPicked?.find(
        (m: any) => m.tmdbMovieId === tmdbMovieId
      );

      if (isWatched) {
        setWatchedInfo({ status: "watched" });
      } else if (votedButNotPicked) {
        setWatchedInfo({
          status: "voted",
          lastVotedDate: votedButNotPicked.eventDate,
        });
      } else {
        setWatchedInfo(null);
      }
    } catch (error) {
      console.error("Error checking watched status:", error);
      setWatchedInfo(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    );
  }

  if (!watchedInfo) {
    return null;
  }

  return (
    <div className="mb-6">
      {watchedInfo.status === "watched" ? (
        <Card className="bg-success/10 border-2 border-success">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-success">
                    Already Watched!
                  </h3>
                  <Chip
                    className="bg-success text-white"
                    size="sm"
                    startContent={<Eye className="w-3 h-3" />}
                  >
                    Watched
                  </Chip>
                </div>
                <p className="text-default-600 mb-3">
                  Your group has already watched "{movieTitle}" during a Movie
                  Monday event.
                </p>
                <Button
                  as={Link}
                  color="success"
                  href="/dashboard"
                  size="sm"
                  variant="flat"
                >
                  View Movie Monday History
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-warning/10 border-2 border-warning">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-warning flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-warning">
                    Previously Considered
                  </h3>
                  <Chip
                    className="bg-warning text-white"
                    size="sm"
                    startContent={<Calendar className="w-3 h-3" />}
                  >
                    Voted On
                  </Chip>
                </div>
                <p className="text-default-600 mb-3">
                  Your group voted on "{movieTitle}" before, but it didn't win
                  the selection. Maybe it's time to give it another chance?
                </p>
                <div className="flex gap-2">
                  <Button
                    as={Link}
                    color="warning"
                    href="/discover/voted-but-not-picked"
                    size="sm"
                    variant="flat"
                  >
                    View All Voted Movies
                  </Button>
                  <Button
                    as={Link}
                    color="default"
                    href="/dashboard"
                    size="sm"
                    variant="light"
                  >
                    View Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}