// components/GroupVisibilityToggle.tsx
"use client";

import React, { useState } from "react";
import { Switch, Button, Chip } from "@heroui/react";
import { Globe, Lock, Copy, Check } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface GroupVisibilityToggleProps {
  groupId: string | number;
  isOwner: boolean;
  initialIsPublic?: boolean;
  slug?: string | null;
  /** Called with the updated group after a successful change */
  onChange?: (group: any) => void;
}

export default function GroupVisibilityToggle({
  groupId,
  isOwner,
  initialIsPublic = false,
  slug: initialSlug = null,
  onChange,
}: GroupVisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState<boolean>(initialIsPublic);
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const publicUrl =
    typeof window !== "undefined" && slug
      ? `${window.location.origin}/browse/${slug}`
      : "";

  const handleToggle = async (next: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE_URL}/api/groups/${groupId}/visibility`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ isPublic: next }),
        }
      );

      if (!res.ok) throw new Error("Failed to update visibility");

      const updated = await res.json();
      setIsPublic(updated.isPublic);
      if (updated.slug) setSlug(updated.slug);
      onChange?.(updated);
    } catch (err) {
      console.error("Error updating group visibility:", err);
      setError("Couldn't update visibility. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  // Non-owners just see the current status
  if (!isOwner) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-default-50 px-3 py-2">
        {isPublic ? (
          <Globe className="h-4 w-4 text-success" />
        ) : (
          <Lock className="h-4 w-4 text-default-400" />
        )}
        <span className="text-sm text-default-600">
          {isPublic ? "Public group" : "Private group"}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-default-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {isPublic ? (
            <Globe className="mt-0.5 h-4 w-4 text-success" />
          ) : (
            <Lock className="mt-0.5 h-4 w-4 text-default-400" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">Public group</p>
            <p className="text-xs text-default-500">
              {isPublic
                ? "Anyone can browse your Movie Mondays without an account."
                : "Only members can see your group."}
            </p>
          </div>
        </div>
        <Switch
          size="sm"
          isSelected={isPublic}
          isDisabled={saving}
          onValueChange={handleToggle}
          aria-label="Toggle group visibility"
        />
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {isPublic && publicUrl && (
        <div className="mt-3 flex items-center gap-2">
          <Chip
            size="sm"
            variant="flat"
            className="max-w-full truncate text-xs"
            title={publicUrl}
          >
            {publicUrl.replace(/^https?:\/\//, "")}
          </Chip>
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onPress={copyLink}
            aria-label="Copy public link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
