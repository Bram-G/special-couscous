"use client";

import React from "react";

import ProtectedRoute from "@/components/protectedRoute";
import ComingSoonPage from "@/components/ui/ComingSoonPage";

export default function MovieMondayPage() {
  return (
    <ProtectedRoute>
      {/* FOR DEPLOYMENT */}
      <ComingSoonPage />
      {/* <MovieMondayDetail /> */}
    </ProtectedRoute>
  );
}
