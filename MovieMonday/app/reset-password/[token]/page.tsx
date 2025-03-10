'use client';

import React, { useState } from 'react';
import { Card, CardBody, Button, Input, Spinner } from "@heroui/react";
import { useRouter } from 'next/navigation';
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { CheckCircle, XCircle } from 'lucide-react';

interface PageProps {
  params: {
    token: string;
  };
}

export default function ResetPasswordPage({ params }: PageProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });

  const validateForm = () => {
    const newErrors = { password: '', confirmPassword: '' };
    let isValid = true;

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const response = await fetch(`http://localhost:8000/auth/reset-password/${params.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      
      setCompleted(true);
      if (response.ok) {
        setSuccess(true);
        setMessage(data.message);
      } else {
        setSuccess(false);
        setMessage(data.message || 'Password reset failed');
      }
    } catch (error) {
      setCompleted(true);
      setSuccess(false);
      setMessage('An error occurred during password reset');
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                startContent={<LockClosedIcon className="h-5 w-5 text-default-400" />}
                isInvalid={!!errors.password}
                errorMessage={errors.password}
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                startContent={<LockClosedIcon className="h-5 w-5 text-default-400" />}
                isInvalid={!!errors.confirmPassword}
                errorMessage={errors.confirmPassword}
              />

              <Button 
                type="submit" 
                color="primary" 
                className="w-full"
                isLoading={loading}
              >
                Reset Password
              </Button>
            </form>
          ) : success ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-16 h-16 text-success" />
              <p className="text-center">{message}</p>
              <Button 
                color="primary" 
                className="w-full"
                onPress={() => router.push('/login')}
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="w-16 h-16 text-danger" />
              <p className="text-center">{message}</p>
              <Button 
                color="primary" 
                className="w-full"
                onPress={() => router.push('/forgot-password')}
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