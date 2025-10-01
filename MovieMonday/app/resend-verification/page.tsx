"use client";

import React, { useState } from "react";
import { Card, CardBody, Button, Input, Link } from "@heroui/react";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { CheckCircle } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
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

      const data = await response.json();

      console.log("Resend verification response:", data);

      if (response.ok) {
        setSubmitted(true);
        // If server indicates account is already verified, you could show a different message
        if (data.alreadyVerified) {
          // Optional: You could set a different message for already verified accounts
        }
      } else {
        setError(data.message || "Failed to resend verification email");
      }
    } catch (error) {
      console.error("Error resending verification:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col gap-6 p-8">
          <h1 className="text-2xl font-bold text-center">
            Resend Verification Email
          </h1>

          {!submitted ? (
            <>
              <p className="text-default-500 text-center">
                Enter your email address and we'll send you a new verification
                link.
              </p>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  errorMessage={error}
                  isInvalid={!!error}
                  type="email"
                  label="Email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  startContent={<EnvelopeIcon className="w-4 h-4" />}
                />

                <Button
                  color="primary"
                  type="submit"
                  fullWidth
                  isLoading={loading}
                  isDisabled={loading}
                >
                  {loading ? "Sending..." : "Resend Verification Email"}
                </Button>
              </form>

              <div className="text-center">
                <Link href="/auth" color="primary">
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-success mx-auto" />
              <h2 className="text-xl font-semibold text-success">
                Verification Email Sent!
              </h2>
              <p className="text-default-500">
                We've sent a new verification link to your email address. Please
                check your inbox and click the link to verify your account.
              </p>
              <div className="space-y-2">
                <Button
                  color="primary"
                  variant="bordered"
                  fullWidth
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                  }}
                >
                  Send to Different Email
                </Button>
                <Link href="/login" color="primary" className="block">
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}