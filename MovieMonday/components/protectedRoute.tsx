"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";

import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Only make a decision after authentication state is fully loaded
    if (!isLoading) {
      if (!isAuthenticated) {
        // Store the current URL for redirection after login
        localStorage.setItem("redirectAfterLogin", window.location.pathname);
        router.push("/login");
      } else {
        // If authenticated, show the content
        setShowContent(true);
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while authentication is being checked
  if (isLoading || !showContent) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Only render children once authentication is confirmed
  return <>{children}</>;
};

export default ProtectedRoute;
