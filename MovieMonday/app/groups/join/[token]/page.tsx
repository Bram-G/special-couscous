'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, Button } from "@heroui/react";
import { useAuth } from '@/contexts/AuthContext';

interface PageProps {
  params: {
    token: string;
  };
}

export default function JoinGroupPage({ params }: PageProps) {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>("");

  useEffect(() => {
    if (!params.token) return;
    if (authLoading) return; // Wait for auth to initialize

    let mounted = true;

    const verifyInvite = async () => {
      try {
        if (!isAuthenticated || !token) {
          const currentPath = `/groups/join/${params.token}`;
          localStorage.setItem('redirectAfterLogin', currentPath);
          router.push('/login');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/join/${params.token}`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!mounted) return;

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to verify invite');
        }

        const data = await response.json();
        setGroupName(data.name);
        setLoading(false);
      } catch (error: any) {
        if (mounted) {
          setError(error.message);
          setLoading(false);
        }
      }
    };

    verifyInvite();

    return () => {
      mounted = false;
    };
  }, [params.token, router, token, isAuthenticated]);

  const handleJoinGroup = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/join/${params.token}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to join group');
      }

      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardBody className="space-y-4">
          <div className="w-full flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardBody className="space-y-4">
          <h1 className="text-xl font-bold text-center text-red-600">Error</h1>
          <p className="text-center">{error}</p>
          <Button color="primary" onPress={() => router.push('/groups')}>
            Go to Groups
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardBody className="space-y-4">
        <h1 className="text-xl font-bold text-center">Join Group</h1>
        <p className="text-center">
          You have been invited to join <strong>{groupName}</strong>
        </p>
        <div className="flex justify-center">
          <Button color="primary" onPress={handleJoinGroup}>
            Join Group
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}