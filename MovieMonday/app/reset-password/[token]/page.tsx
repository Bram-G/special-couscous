"use client";

import React, { useState } from "react";
import { Card, CardBody, Button, Input } from "@heroui/react";
import { useRouter } from "next/navigation";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { CheckCircle, XCircle } from "lucide-react";

interface PageProps {
  params: {
    token: string;
  };
}

export default function ResetPasswordPage({ params }: PageProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({ password: "", confirmPassword: "" });

  const validateForm = () => {
    const newErrors = { password: "", confirmPassword: "" };
    let isValid = true;

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/auth/reset-password/${params.token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        },
      );

      const data = await response.json();

      setCompleted(true);
      if (response.ok) {
        setSuccess(true);
        setMessage(data.message);
      } else {
        setSuccess(false);
        setMessage(data.message || "Password reset failed");
      }
    } catch (error) {
      setCompleted(true);
      setSuccess(false);
      setMessage("An error occurred during password reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col gap-6 p-8">
          <h1 className="text-2xl font-bold text-center">Reset Password</h1>

          {!completed ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                errorMessage={errors.password}
                isInvalid={!!errors.password}
                label="New Password"
                placeholder="Enter new password"
                startContent={
                  <LockClosedIcon className="h-5 w-5 text-default-400" />
                }
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                errorMessage={errors.confirmPassword}
                isInvalid={!!errors.confirmPassword}
                label="Confirm Password"
                placeholder="Confirm new password"
                startContent={
                  <LockClosedIcon className="h-5 w-5 text-default-400" />
                }
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <Button
                className="w-full"
                color="primary"
                isLoading={loading}
                type="submit"
              >
                Reset Password
              </Button>
            </form>
          ) : success ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-16 h-16 text-success" />
              <p className="text-center">{message}</p>
              <Button
                className="w-full"
                color="primary"
                onPress={() => router.push("/login")}
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="w-16 h-16 text-danger" />
              <p className="text-center">{message}</p>
              <Button
                className="w-full"
                color="primary"
                onPress={() => router.push("/forgot-password")}
              >
                Try Again
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
