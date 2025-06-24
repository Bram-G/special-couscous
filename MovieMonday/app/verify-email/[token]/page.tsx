// In verify-email/[token]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardBody, CardHeader, Button, Spinner } from "@heroui/react";
import { CheckCircle, XCircle, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "already-verified" | "error" | "expired"
  >("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState("");

  // Use a ref to track if verification has already been attempted
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Only proceed if verification hasn't been attempted yet
    if (verificationAttempted.current) {
      console.log("Verification already attempted, skipping duplicate call");
      return;
    }

    if (!token) {
      setVerificationStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    // Verify the token
    const verifyEmail = async () => {
      // Mark verification as attempted to prevent duplicate calls
      verificationAttempted.current = true;

      try {
        console.log("Sending verification request with token:", token);

        const response = await fetch(
          `${API_BASE_URL}/auth/verify-email/${token}`,
        );

        console.log("Verification response status:", response.status);

        // Handle response
        try {
          const data = await response.json();

          console.log("Verification response data:", data);

          if (response.ok) {
            if (data.alreadyVerified) {
              setVerificationStatus("already-verified");
            } else {
              setVerificationStatus("success");
            }
            setMessage(data.message);
          } else {
            if (data.expired) {
              setVerificationStatus("expired");
            } else {
              setVerificationStatus("error");
            }
            setMessage(data.message || "Failed to verify email.");
          }
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          setVerificationStatus("error");
          setMessage("Error processing server response. Please try again.");
        }
      } catch (error) {
        console.error("Error during verification:", error);
        setVerificationStatus("error");
        setMessage("Error connecting to server. Please try again later.");
      }
    };

    verifyEmail();
  }, [token]);

  const handleResendVerification = async () => {
    if (!email || isResending) return;

    setIsResending(true);

    try {
      console.log("Resending verification email to:", email);

      const response = await fetch(
        `${API_BASE_URL}/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      console.log("Resend response status:", response.status);

      // Handle response
      try {
        const data = await response.json();

        console.log("Resend response data:", data);

        if (data.alreadyVerified) {
          setVerificationStatus("already-verified");
          setMessage("Your email is already verified. You can now log in.");
        } else {
          alert(data.message || "Verification email sent successfully.");
        }
      } catch (parseError) {
        console.error("Error parsing resend response:", parseError);
        alert(
          "Error processing server response. The email may have been sent.",
        );
      }
    } catch (error) {
      console.error("Error resending verification:", error);
      alert("Error connecting to server. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!email) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/check-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      if (response.ok) {
        const data = await response.json();

        if (data.exists && data.isVerified) {
          setVerificationStatus("already-verified");
          setMessage("Your email is already verified. You can now log in.");

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking verification status:", error);

      return false;
    }
  };

  // Add a button to check verification status directly
  const handleCheckStatus = async () => {
    if (!email) return;

    const isVerified = await checkVerificationStatus();

    if (!isVerified) {
      alert(
        "Your account is not verified yet. Please check your email or request a new verification link.",
      );
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "loading":
        return (
          <div className="flex flex-col items-center space-y-4">
            <Spinner size="lg" color="primary" />
            <h2 className="text-xl font-semibold">Verifying Your Email...</h2>
            <p className="text-default-500 text-center">
              Please wait while we verify your email address.
            </p>
          </div>
        );

      case "success":
        return (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="w-16 h-16 text-success" />
            <h2 className="text-xl font-semibold text-success">
              Email Verified Successfully!
            </h2>
            <p className="text-default-500 text-center">{message}</p>
            <Button
              color="primary"
              endContent={<ArrowRight className="w-4 h-4" />}
              onClick={() => router.push("/auth")}
            >
              Go to Login
            </Button>
          </div>
        );

      case "already-verified":
        return (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle className="w-16 h-16 text-success" />
            <h2 className="text-xl font-semibold text-success">
              Already Verified!
            </h2>
            <p className="text-default-500 text-center">{message}</p>
            <Button
              color="primary"
              endContent={<ArrowRight className="w-4 h-4" />}
              onClick={() => router.push("/auth")}
            >
              Go to Login
            </Button>
          </div>
        );

      case "expired":
        return (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="w-16 h-16 text-warning" />
            <h2 className="text-xl font-semibold text-warning">
              Verification Link Expired
            </h2>
            <p className="text-default-500 text-center">{message}</p>
            <div className="flex flex-col space-y-2 w-full">
              <Button
                color="primary"
                variant="bordered"
                endContent={<RefreshCw className="w-4 h-4" />}
                onClick={() => router.push("/resend-verification")}
              >
                Request New Verification Link
              </Button>
              <Button
                color="secondary"
                variant="light"
                onClick={() => router.push("/auth")}
              >
                Back to Login
              </Button>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="w-16 h-16 text-danger" />
            <h2 className="text-xl font-semibold text-danger">
              Verification Failed
            </h2>
            <p className="text-default-500 text-center">{message}</p>
            <div className="flex flex-col space-y-2 w-full">
              <Button
                color="primary"
                variant="bordered"
                endContent={<RefreshCw className="w-4 h-4" />}
                onClick={() => router.push("/resend-verification")}
              >
                Request New Verification Link
              </Button>
              <Button
                color="secondary"
                variant="light"
                onClick={() => router.push("/auth")}
              >
                Back to Login
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary-50 to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2">
          <h1 className="text-2xl font-bold text-center w-full">
            Email Verification
          </h1>
        </CardHeader>
        <CardBody className="pt-2">{renderContent()}</CardBody>
      </Card>
    </div>
  );
}