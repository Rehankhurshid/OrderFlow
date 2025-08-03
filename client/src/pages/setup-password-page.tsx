import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, Lock } from "lucide-react";

const passwordSetupSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordSetupFormData = z.infer<typeof passwordSetupSchema>;

interface TokenValidationResponse {
  valid: boolean;
  username?: string;
  email?: string;
}

export default function SetupPasswordPage() {
  const [location] = useLocation();
  const navigate = (path: string) => window.location.href = path;
  const { toast } = useToast();
  const [tokenValidation, setTokenValidation] = useState<TokenValidationResponse | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract token from URL
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const token = searchParams.get('token');

  const form = useForm<PasswordSetupFormData>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setTokenValidation({ valid: false });
      setIsValidating(false);
      return;
    }

    // Validate token
    fetch(`/api/setup-password/${token}`)
      .then(res => res.json())
      .then(data => {
        setTokenValidation(data);
        setIsValidating(false);
      })
      .catch(() => {
        setTokenValidation({ valid: false });
        setIsValidating(false);
      });
  }, [token]);

  const onSubmit = async (data: PasswordSetupFormData) => {
    if (!token) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Password Set Successfully",
          description: "You can now log in with your new password.",
        });
        navigate("/auth");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to set password",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Validating invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValidation?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid or Expired Link</CardTitle>
            <CardDescription>
              This password setup link is invalid or has expired. Please contact your administrator for a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Lock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle>Set Up Your Password</CardTitle>
          <CardDescription>
            Welcome, {tokenValidation.username}! Please create a password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Setting up..." : "Set Password"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Account:</strong> {tokenValidation.email}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}