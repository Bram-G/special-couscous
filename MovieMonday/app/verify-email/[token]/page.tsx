"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardBody, Button } from "@heroui/react";
import { CheckCircle, XCircle, Mail } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error" | "already-verified"
  >("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerificationStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const verifyEmail = async () => {
      try {
        console.log("Verifying token:", token);

        const response = await fetch(
          `${API_BASE_URL}/auth/verify/${token}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        console.log("Verification response status:", response.status);

        // Handle response
        try {
          const data = await response.json();
          console.log("Verification response data:", data);

          if (response.ok && data.success) {
            setVerificationStatus("success");
            setMessage(
              data.message || "Email verified successfully! You can now log in.",
            );
          } else {
            setVerificationStatus("error");
            setMessage(
              data.message ||
                "Verification failed. The link may have expired or be invalid.",
            );

            // Set email for resend functionality if provided
            if (data.email) {
              setEmail(data.email);
            }
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
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <h2 className="text-xl font-semibold">Verifying Your Email...</h2>
            <p className="text-default-500">Please wait while we verify your email address.</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-success mx-auto" />
            <h2 className="text-xl font-semibold text-success">Email Verified!</h2>
            <p className="text-default-500">{message}</p>
            <Button
              color="primary"
              onClick={() => router.push("/auth")}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        );

      case "already-verified":
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-success mx-auto" />
            <h2 className="text-xl font-semibold text-success">Already Verified!</h2>
            <p className="text-default-500">{message}</p>
            <Button
              color="primary"
              onClick={() => router.push("/auth")}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-4">
            <XCircle className="w-16 h-16 text-danger mx-auto" />
            <h2 className="text-xl font-semibold text-danger">Verification Failed</h2>
            <p className="text-default-500">{message}</p>
            
            <div className="space-y-2">
              {email && (
                <Button
                  color="primary"
                  variant="bordered"
                  onClick={handleResendVerification}
                  isLoading={isResending}
                  isDisabled={isResending}
                  startContent={<Mail className="w-4 h-4" />}
                  className="w-full"
                >
                  {isResending ? "Sending..." : "Resend Verification Email"}
                </Button>
              )}
              
              <Button
                color="secondary"
                variant="bordered"
                onClick={() => router.push("/resend-verification")}
                className="w-full"
              >
                Resend to Different Email
              </Button>
              
              <Button
                color="primary"
                onClick={() => router.push("/auth")}
                className="w-full"
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col gap-6 p-8">
          <h1 className="text-2xl font-bold text-center">Email Verification</h1>
          {renderContent()}
        </CardBody>
      </Card>
    </div>
  );
}