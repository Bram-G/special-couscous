"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { BarChart2, Table2 } from "lucide-react";

import { title } from "@/components/primitives";
import ProtectedRoute from "@/components/protectedRoute";
import AnalyticsOverview from "@/components/analytics/AnalyticsOverview";
import AnalyticsTables from "@/components/analytics/AnalyticsTables";

export default function AnalyticsPage() {
  const [view, setView] = useState("insights");

  return (
    <ProtectedRoute>
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-8 w-8 text-primary" />
          <h1 className={title()}>Analytics</h1>
        </div>

        <p className="max-w-3xl text-default-600">
          See the shape of your Movie Mondays at a glance, then dig into the raw
          data — sort and filter every movie, person, and menu item your group
          has logged.
        </p>

        <Tabs
          aria-label="Analytics views"
          classNames={{ tabList: "gap-4" }}
          selectedKey={view}
          onSelectionChange={(key) => setView(key as string)}
        >
          <Tab
            key="insights"
            title={
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                <span>Insights</span>
              </div>
            }
          >
            <div className="mt-4">
              <AnalyticsOverview />
            </div>
          </Tab>

          <Tab
            key="tables"
            title={
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                <span>Data Tables</span>
              </div>
            }
          >
            <div className="mt-4">
              <AnalyticsTables />
            </div>
          </Tab>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}