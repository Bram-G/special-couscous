import React from "react";
import { Card, CardHeader, CardBody, Link } from "@heroui/react";
import { ExternalLink } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  linkTo?: string;
  className?: string;
  onClick?: () => void;
}

export const AnalyticsCard = ({
  title,
  subtitle,
  children,
  linkTo,
  className = "",
  onClick,
}: AnalyticsCardProps) => {
  return (
    <Card className={`w-full ${className}`} onClick={onClick}>
      <CardHeader className="flex flex-col items-start px-4 pt-4 pb-2">
        <div className="flex w-full justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          {linkTo && (
            <Link
              className="text-sm text-primary flex items-center gap-1"
              href={linkTo}
              onClick={(e) => onClick && e.preventDefault()}
            >
              View more <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
        {subtitle && <p className="text-sm text-default-500">{subtitle}</p>}
      </CardHeader>
      <CardBody className="px-4 py-2">{children}</CardBody>
    </Card>
  );
};
