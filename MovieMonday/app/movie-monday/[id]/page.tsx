
'use client';

import React from 'react';
import { title } from "@/components/primitives";
import MovieMondayDetail from "@/components/MovieMonday/MovieMondayDetail";
import ProtectedRoute from "@/components/protectedRoute";

export default function MovieMondayPage() {
  return (
    <ProtectedRoute>
      <MovieMondayDetail />
    </ProtectedRoute>
  );
}