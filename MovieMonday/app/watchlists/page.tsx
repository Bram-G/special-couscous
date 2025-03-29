'use client';

import React from 'react';
import { title } from "@/components/primitives";
import ProtectedRoute from "@/components/protectedRoute";
import WatchlistDashboard from "@/components/Watchlist/WatchlistDashboard";

export default function WatchlistsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <WatchlistDashboard />
      </div>
    </ProtectedRoute>
  );
}




