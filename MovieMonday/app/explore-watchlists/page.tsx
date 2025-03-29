// MovieMonday/app/explore-watchlists/page.tsx
'use client';

import React from 'react';
import ExploreWatchlists from '@/components/Watchlist/ExploreWatchlists';

export default function ExploreWatchlistsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ExploreWatchlists />
    </div>
  );
}