'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardBody, Button, Spinner } from "@heroui/react";
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';

interface PageProps {
  params: {
    token: string;
  };
}

export default function VerifyEmailPage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!params.token) return;
      
      try {
        console.log('Verifying token:', params.token);
        const response = await fetch(`http://localhost:8000/auth/verify-email/${params.token}`);
        
        // Log the raw response
        console.log('Verification response status:', response.status);
        
        const data = await response.json();
        console.log('Verification response data:', data);
        
        if (response.ok) {
          setSuccess(true);
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setSuccess(false);
          setMessage(data.message || 'Email verification failed');
        }
      } catch (error) {
        console.error('Error during verification:', error);
        setSuccess(false);
        setMessage('An error occurred during verification. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    verifyEmail();
  }, [params.token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center gap-6 p-8">
          <h1 className="text-2xl font-bold">Email Verification</h1>
          
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" />
              <p>Verifying your email...</p>
            </div>
          ) : success ? (
            <>
              <CheckCircle className="w-16 h-16 text-success" />
              <p className="text-center">{message}</p>
              <Button 
                color="primary" 
                className="w-full"
                onPress={() => router.push('/login')}
              >
                Go to Login
              </Button>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-danger" />
              <p className="text-center">{message}</p>
              <Button 
                color="primary" 
                className="w-full"
                onPress={() => router.push('/resend-verification')}
              >
                Resend Verification Email
              </Button>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}