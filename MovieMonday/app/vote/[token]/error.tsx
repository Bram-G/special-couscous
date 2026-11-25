// app/vote/[token]/error.tsx — catches crashes on the ballot page only, so
// guests get a useful screen (and we get the real error) instead of the
// app-wide "Something went wrong!".
"use client";

import { useEffect } from "react";
import { Button } from "@heroui/react";
import { Clapperboard, RotateCcw } from "lucide-react";

export default function VoteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Vote page crashed:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <Clapperboard className="h-10 w-10 text-default-400" />
      <h1 className="text-xl font-semibold">This page hit a snag</h1>
      <p className="text-default-500">
        If you already tapped Submit, your vote was most likely counted. Reload to
        see the results, or let the host know.
      </p>
      <Button
        color="primary"
        startContent={<RotateCcw className="h-4 w-4" />}
        onPress={() => window.location.reload()}
      >
        Reload
      </Button>
      <Button size="sm" variant="light" onPress={() => reset()}>
        Try again without reloading
      </Button>
      {/* Small print so a screenshot from a guest tells us what broke */}
      <p className="mt-4 break-all text-xs text-default-300">
        {error.message}
        {error.digest ? ` (${error.digest})` : ""}
      </p>
    </div>
  );
}