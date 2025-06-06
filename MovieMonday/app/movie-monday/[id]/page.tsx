
'use client';

import React from 'react';
import { title } from "@/components/primitives";
import MovieMondayDetail from "@/components/MovieMonday/MovieMondayDetail";
import ProtectedRoute from "@/components/protectedRoute";
import ComingSoonPage from '@/components/ui/ComingSoonPage';

export default function MovieMondayPage() {
  return (
    <ProtectedRoute>
      {/* FOR DEPLOYMENT */}
      <ComingSoonPage></ComingSoonPage> 
      {/* <MovieMondayDetail /> */}
    </ProtectedRoute>
  );
}