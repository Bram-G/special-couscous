"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Button, Divider } from "@heroui/react";
import { Users } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface PageProps {
  params: {
    token: string;
  };
}

export default function JoinGroupPage({ params }: PageProps) {
  const router = useRouter();
  const { token: authToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>("");

  // Decode group name from the JWT payload without verifying (public info)
  const getGroupNameFromToken = (inviteToken: string): string => {
    try {
      const payload = JSON.parse(atob(inviteToken.split(".")[1]));
      return payload.groupName || "this group";
    } catch {
      return "this group";
    }
  };

  useEffect(() => {
    if (!params.token) return;
    if (authLoading) return;

    // Read group name from token payload immediately (no network needed)
    const nameFromToken = getGroupNameFromToken(params.token);
    setGroupName(nameFromToken);

    // If not authenticated, just show the prompt — no redirect
    if (!isAuthenticated || !authToken) {
      setLoading(false);
      return;
    }

    // Authenticated: verify the invite is still valid
    let mounted = true;
    const verifyInvite = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/groups/join/${params.token}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          },
        );

        if (!mounted) return;

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to verify invite");
        }

        const data = await response.json();
        setGroupName(data.name);
        setLoading(false);
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    verifyInvite();
    return () => { mounted = false; };
  }, [params.token, authToken, isAuthenticated, authLoading]);

  const handleJoinGroup = async () => {
    try {
      setJoining(true);
      const response = await fetch(
        `${API_BASE_URL}/api/groups/join/${params.token}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join group");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleSignUp = () => {
    localStorage.setItem("redirectAfterLogin", `/groups/join/${params.token}`);
    router.push("/login?signup=true");
  };

  const handleLogIn = () => {
    localStorage.setItem("redirectAfterLogin", `/groups/join/${params.token}`);
    router.push("/login");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="flex flex-col items-center gap-4 py-8">
            <h1 className="text-xl font-bold text-danger">Invalid Invite</h1>
            <p className="text-center text-default-500">{error}</p>
            <Button color="primary" onPress={() => router.push("/")}>
              Go to Home
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Unauthenticated: prompt to sign up or log in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardBody className="flex flex-col items-center gap-6 py-8 px-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">You're invited!</h1>
              <p className="text-default-500">
                You've been invited to join{" "}
                <span className="font-semibold text-foreground">{groupName}</span>{" "}
                on Movie Monday.
              </p>
            </div>

            <div className="w-full space-y-3">
              <Button
                className="w-full"
                color="primary"
                size="lg"
                onPress={handleSignUp}
              >
                Create an Account & Join
              </Button>
              <Button
                className="w-full"
                variant="flat"
                size="lg"
                onPress={handleLogIn}
              >
                Log In & Join
              </Button>
            </div>

            <p className="text-xs text-default-400 text-center">
              After signing in, you'll be brought back here to complete joining
              the group.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Authenticated: show join button
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center gap-6 py-8 px-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Join Group</h1>
            <p className="text-default-500">
              You've been invited to join{" "}
              <span className="font-semibold text-foreground">{groupName}</span>.
            </p>
          </div>
          <Button
            className="w-full"
            color="primary"
            size="lg"
            isLoading={joining}
            onPress={handleJoinGroup}
          >
            Join {groupName}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}