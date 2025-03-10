'use client';

import React, { useState } from 'react';
import { Card, CardBody, Button, Input, Link } from "@heroui/react";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { CheckCircle } from 'lucide-react';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }
  
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
  
      const data = await response.json();
      console.log('Resend verification response:', data);
      
      if (response.ok) {
        setSubmitted(true);
        // If server indicates account is already verified, you could show a different message
        if (data.alreadyVerified) {
          // Optional: You could set a different message for already verified accounts
        }
      } else {
        setError(data.message || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col gap-6 p-8">
          <h1 className="text-2xl font-bold text-center">Resend Verification Email</h1>
          
          {!submitted ? (
            <>
              <p className="text-default-500 text-center">
                Enter your email address and we'll send you a new verification link.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  startContent={<EnvelopeIcon className="h-5 w-5 text-default-400" />}
                  isInvalid={!!error}
                  errorMessage={error}
                />

                <Button 
                  type="submit" 
                  color="primary" 
                  className="w-full"
                  isLoading={loading}
                >
                  Resend Verification
                </Button>
              </form>
              
              <div className="text-center">
                <Link href="/login" color="primary">
                  Back to Login
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-16 h-16 text-success" />
              <p className="text-center">
                If your email address exists in our database, you will receive a
                verification link at your email address.
              </p>
              <Link href="/login" color="primary">
                Back to Login
              </Link>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}