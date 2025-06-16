import React from "react";
import { Image, Tooltip } from "@heroui/react";

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface StreamingServicesProps {
  providers: Provider[] | null;
}

const StreamingServices: React.FC<StreamingServicesProps> = ({ providers }) => {
  if (!providers || providers.length === 0) {
    return (
      <div className="text-default-500 text-sm py-2">
        No streaming information available
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {providers.map((provider) => (
        <Tooltip key={provider.provider_id} content={provider.provider_name}>
          <div className="w-10 h-10 rounded-md overflow-hidden">
            <Image
              removeWrapper
              alt={provider.provider_name}
              className="w-full h-full object-cover"
              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
            />
          </div>
        </Tooltip>
      ))}
    </div>
  );
};

export default StreamingServices;
