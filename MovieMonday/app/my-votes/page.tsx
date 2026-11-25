"use client";

import React from "react";

import ProtectedRoute from "@/components/protectedRoute";
import MyVoteHistory from "@/components/Voting/MyVoteHistory";

export default function MyVotesPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <MyVoteHistory />
      </div>
    </ProtectedRoute>
  );
}