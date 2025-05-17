// components/ui/ComingSoonPage.tsx
import React from 'react';
import { Button, Card } from "@heroui/react";
import { ArrowLeft, Clock } from "lucide-react";
import { useRouter } from 'next/navigation';

interface ComingSoonPageProps {
  title?: string;
  message?: string;
  showBackButton?: boolean;
}

const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title = "Coming Soon",
  message = "This feature is currently under development and will be available soon!",
  showBackButton = true
}) => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="rounded-full bg-primary-100 p-4 dark:bg-primary-900/30">
            <Clock className="h-12 w-12 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-default-500">{message}</p>
          </div>
          
          {showBackButton && (
            <Button 
              variant="flat" 
              color="primary" 
              onPress={() => router.back()}
              startContent={<ArrowLeft size={16} />}
            >
              Go Back
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ComingSoonPage;