
// MovieMonday/app/watchlist/[slug]/page.tsx
'use client';

import React from 'react';
import WatchlistDetail from '@/components/Watchlist/WatchlistDetail';

export default function WatchlistDetailPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WatchlistDetail />
    </div>
  );
}
