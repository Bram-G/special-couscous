"use client";

import React, { useState } from "react";
import { Switch, Chip } from "@heroui/react";
import { Globe, Lock } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface WatchlistVisibilityToggleProps {
  watchlistId: number | string;
  token: string;
  isOwner: boolean;
  initialIsPublic: boolean;
  onChange?: (isPublic: boolean) => void;
}

export default function WatchlistVisibilityToggle({
  watchlistId,
  token,
  isOwner,
  initialIsPublic,
  onChange,
}: WatchlistVisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);

  if (!isOwner) {
    return (
      <Chip
        color={isPublic ? "success" : "default"}
        size="sm"
        startContent={isPublic ? <Globe size={12} /> : <Lock size={12} />}
        variant="flat"
      >
        {isPublic ? "Public" : "Private"}
      </Chip>
    );
  }

  const handleToggle = async (next: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/watchlists/categories/${watchlistId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isPublic: next }),
        },
      );

      if (res.ok) {
        setIsPublic(next);
        onChange?.(next);
      }
    } catch (error) {
      console.error("Error updating watchlist visibility:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        isDisabled={saving}
        isSelected={isPublic}
        size="sm"
        onValueChange={handleToggle}
      />
      <span className="text-sm text-default-500 flex items-center gap-1">
        {isPublic ? <Globe size={12} /> : <Lock size={12} />}
        {isPublic ? "Public" : "Private"}
      </span>
    </div>
  );
}