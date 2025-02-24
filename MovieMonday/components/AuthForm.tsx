import React, { useState, FormEvent, ChangeEvent } from "react";
import {
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
} from "@heroui/react";
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface FormData {
  username: string;
  email: string;
  password: string;
}

const AuthForm: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
  
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(
          isLogin
            ? { username: formData.username, password: formData.password }
            : formData
        ),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        switch (response.status) {
          case 401:
            throw new Error("Invalid credentials");
          case 400:
            throw new Error(data.message || "Validation error");
          case 409:
            throw new Error("Username or email already exists");
          case 500:
            throw new Error("Server error - please try again later");
          default:
            throw new Error(data.message || "Authentication failed");
        }
      }
  
      if (data.token) {
        // Set the token in localStorage first
        localStorage.setItem('token', data.token);
        
        // Then update the auth context
        await login(data.token);
        
        // Wait a brief moment to ensure context is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check for redirect after login
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          localStorage.removeItem('redirectAfterLogin'); // Clean up
          router.push(redirectPath);
        } else {
          router.push("/dashboard"); // Default redirect
        }
      } else {
        throw new Error("No token received from server");
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trim(),
    }));
  };

  const isFormValid = () => {
    if (!formData.username || !formData.password) return false;
    if (!isLogin && !formData.email) return false;
    return true;
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col items-center">
          <h2 className="text-2xl font-bold text-center">
            {isLogin ? "Welcome Back" : "Create an Account"}
          </h2>
          <p className="text-sm text-default-500 mt-2">
            {isLogin
              ? "Sign in to continue to Movie Monday"
              : "Join our Movie Monday community"}
          </p>
        </CardHeader>

        <Divider />

        <CardBody>
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              key="username"
              type="text"
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              startContent={<UserIcon className="h-5 w-5 text-default-400" />}
              isInvalid={!!(error && !formData.username)}
            />

            {!isLogin && (
              <Input
                key="email"
                type="email"
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                startContent={
                  <EnvelopeIcon className="h-5 w-5 text-default-400" />
                }
                isInvalid={!!(!isLogin && error && !formData.email)}
              />
            )}

            <Input
              key="password"
              type="password"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              startContent={
                <LockClosedIcon className="h-5 w-5 text-default-400" />
              }
              isInvalid={!!(error && !formData.password)}
            />

            <Button 
              type="submit" 
              color="primary" 
              fullWidth 
              isLoading={loading}
              isDisabled={!isFormValid()}
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          <div className="text-center mt-4">
            <Button
              variant="light"
              color="primary"
              onPress={() => {
                setIsLogin(!isLogin);
                setError(""); // Clear any errors when switching modes
                setFormData({ username: "", email: "", password: "" }); // Reset form
              }}
            >
              {isLogin
                ? "Need an account? Sign Up"
                : "Already have an account? Sign In"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AuthForm;