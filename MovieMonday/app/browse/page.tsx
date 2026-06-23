// app/browse/page.tsx
"use client";

import React from "react";

import PublicGroupsShowcase from "@/components/HomePage/PublicGroupsShowcase";

export default function BrowsePage() {
  return (
    <div className="w-full">
      <div className="border-b border-default-100 bg-content1">
        <div className="container mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Browse Movie Monday groups
          </h1>
          <p className="mt-2 max-w-2xl text-default-600">
            Public groups sharing their weekly film nights. Click any group to
            scroll through their calendar of Mondays.
          </p>
        </div>
      </div>
      <PublicGroupsShowcase />
    </div>
  );
}