// In verify-email/[token]/page.tsx
"use client";

import { useState, useEffect, useRef  } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner } from "@heroui/react";
import { CheckCircle, XCircle, RefreshCw, ArrowRight } from "lucide-react";
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'already-verified' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  
  // Use a ref to track if verification has already been attempted
  const verificationAttempted = useRef(false);
  
  useEffect(() => {
    // Only proceed if verification hasn't been attempted yet
    if (verificationAttempted.current) {
      console.log('Verification already attempted, skipping duplicate call');
      return;
    }
    
    if (!token) {
      setVerificationStatus('error');
      setMessage('Verification token is missing.');
      return;
    }
    
    // Verify the token
    const verifyEmail = async () => {
      // Mark verification as attempted to prevent duplicate calls
      verificationAttempted.current = true;
      
      try {
        console.log('Sending verification request with token:', token);
        
        const response = await fetch(`http://localhost:8000/auth/verify-email/${token}`);
        console.log('Verification response status:', response.status);
        
        // Handle response
        try {
          const data = await response.json();
          console.log('Verification response data:', data);
          
          if (response.ok) {
            if (data.alreadyVerified) {
              setVerificationStatus('already-verified');
            } else {
              setVerificationStatus('success');
            }
            setMessage(data.message);
          } else {
            if (data.expired) {
              setVerificationStatus('expired');
            } else {
              setVerificationStatus('error');
            }
            setMessage(data.message || 'Failed to verify email.');
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          setVerificationStatus('error');
          setMessage('Error processing server response. Please try again.');
        }
      } catch (error) {
        console.error('Error during verification:', error);
        setVerificationStatus('error');
        setMessage('Error connecting to server. Please try again later.');
      }
    };
    
    verifyEmail();
  }, [token]);
  
  const handleResendVerification = async () => {
    if (!email || isResending) return;
    
    setIsResending(true);
    
    try {
      console.log('Resending verification email to:', email);
      
      const response = await fetch('http://localhost:8000/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      console.log('Resend response status:', response.status);
      
      // Handle response
      try {
        const data = await response.json();
        console.log('Resend response data:', data);
        
        if (data.alreadyVerified) {
          setVerificationStatus('already-verified');
          setMessage('Your email is already verified. You can now log in.');
        } else {
          alert(data.message || 'Verification email sent successfully.');
        }
      } catch (parseError) {
        console.error('Error parsing resend response:', parseError);
        alert('Error processing server response. The email may have been sent.');
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      alert('Error connecting to server. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };
  
  const checkVerificationStatus = async () => {
    if (!email) return;
    
    try {
      const response = await fetch('http://localhost:8000/auth/check-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.exists && data.isVerified) {
          setVerificationStatus('already-verified');
          setMessage('Your email is already verified. You can now log in.');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return false;
    }
  };
  
  // Add a button to check verification status directly
  const handleCheckStatus = async () => {
    if (!email) return;
    
    const isVerified = await checkVerificationStatus();
    
    if (!isVerified) {
      alert('Your account is not verified yet. Please check your email or request a new verification link.');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card>
        <CardHeader className="flex justify-center pb-0">
          <h1 className="text-2xl font-bold">Email Verification</h1>
        </CardHeader>
        <CardBody className="flex flex-col items-center gap-4 pt-6">
          {verificationStatus === 'loading' && (
            <Spinner size="lg" color="primary" />
          )}
          
          {verificationStatus === 'success' && (
            <CheckCircle className="h-16 w-16 text-success" />
          )}
          
          {verificationStatus === 'already-verified' && (
            <CheckCircle className="h-16 w-16 text-success" />
          )}
          
          {(verificationStatus === 'error' || verificationStatus === 'expired') && (
            <XCircle className="h-16 w-16 text-danger" />
          )}
          
          <p className="text-center text-default-700">{message}</p>
          
          {verificationStatus === 'success' || verificationStatus === 'already-verified' ? (
            <Button 
              as={Link}
              href="/login"
              color="primary"
              endContent={<ArrowRight className="h-4 w-4" />}
            >
              Continue to Login
            </Button>
          ) : (verificationStatus === 'error' || verificationStatus === 'expired') ? (
            <div className="flex flex-col w-full gap-4">
              <p className="text-sm text-default-500 text-center">
                Enter your email address to receive a new verification link or check your status
              </p>
              
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded"
              />
              
              <div className="flex gap-2">
                <Button 
                  color="primary"
                  isLoading={isResending}
                  disabled={!email}
                  onPress={handleResendVerification}
                  startContent={<RefreshCw className="h-4 w-4" />}
                  className="flex-1"
                >
                  Resend Email
                </Button>
                
                <Button
                  variant="flat"
                  disabled={!email}
                  onPress={handleCheckStatus}
                  className="flex-1"
                >
                  Check Status
                </Button>
              </div>
              
              <Button 
                as={Link}
                href="/login"
                variant="light"
              >
                Back to Login
              </Button>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}