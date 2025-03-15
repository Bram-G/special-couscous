// components/Discovery/RecommendationReason.tsx
import React from "react";
import { Tag, Compass } from "lucide-react";

interface ReasonProps {
  reason: {
    type: string;
    text: string;
    detail?: string;
  } | null;
}

const RecommendationReason: React.FC<ReasonProps> = ({ reason }) => {
  if (!reason) return null;
  
  const icon = reason.type === 'genre' ? (
    <Tag className="h-3 w-3" />
  ) : (
    <Compass className="h-3 w-3" />
  );
  
  return (
    <div className="mt-2 bg-black/30 px-2 py-1 rounded text-xs">
      <div className="flex items-center gap-1 text-white">
        {icon}
        <span>{reason.text}</span>
      </div>
      {reason.detail && (
        <div className="text-white/70 text-xs mt-0.5">
          {reason.detail}
        </div>
      )}
    </div>
  );
};

export default RecommendationReason;