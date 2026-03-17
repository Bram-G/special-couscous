"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { Database, User as UserIcon, Bell } from "lucide-react";

import ProtectedRoute from "@/components/protectedRoute";
import DataManagement from "@/components/Settings/DataManagement";

function ComingSoonSection({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-default-400">
      <p className="text-lg font-medium">Coming Soon</p>
      <p className="text-sm mt-1">{label} settings are on the way.</p>
    </div>
  );
}

export default function SettingsPage() {
  const [selected, setSelected] = useState("data");

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-default-500 mt-1">
            Manage your account preferences and data
          </p>
        </div>

        <Tabs
          selectedKey={selected}
          onSelectionChange={(key) => setSelected(key as string)}
          variant="underlined"
          classNames={{ tabList: "gap-6" }}
        >
          <Tab
            key="data"
            title={
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Data
              </div>
            }
          >
            <div className="mt-6">
              <DataManagement />
            </div>
          </Tab>

          <Tab
            key="account"
            title={
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Account
              </div>
            }
          >
            <ComingSoonSection label="Account" />
          </Tab>

          <Tab
            key="notifications"
            title={
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </div>
            }
          >
            <ComingSoonSection label="Notification" />
          </Tab>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}