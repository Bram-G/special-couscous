import React from "react";

interface RatingBarProps {
  rating: number;
  count?: number;
}

const RatingBar: React.FC<RatingBarProps> = ({ rating, count = 0 }) => {
  // Convert rating to percentage (for a 5-star scale)
  const percentage = (rating / 5) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center w-full">
        <div className="text-4xl font-bold mr-2">{rating.toFixed(1)}</div>
        <div className="flex-1">
          <div className="h-4 bg-default-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-xs text-default-500 mt-1">{count} ratings</div>
        </div>
      </div>
    </div>
  );
};

export default RatingBar;
