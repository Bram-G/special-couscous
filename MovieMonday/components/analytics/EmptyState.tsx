import React from "react";
import { PieChart } from "lucide-react";

interface EmptyStateProps {
  message?: string;
}

export const EmptyState = ({
  message = "Not enough data to show analytics",
}: EmptyStateProps) => {
  return (
    <div className="w-full h-40 flex flex-col items-center justify-center text-center p-4">
      <PieChart className="h-10 w-10 text-default-300 mb-2" />
      <p className="text-default-500 text-sm">{message}</p>
    </div>
  );
};
