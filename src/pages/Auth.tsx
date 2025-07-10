import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare, Users, BarChart3 } from "lucide-react";

// Hardcoded credentials for single user system
const VALID_EMAIL = "abhik.voice@gmail.com";
const VALID_PASSWORD = "11111111";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/contacts");
      }
    };
    checkAuth();
  }, [navigate]);

  const validateCredentials = () => {
    const newErrors: Record<string, string> = {};

    // Hardcoded validation - only allow specific email and password
    if (!email) {
      newErrors.email = "Email is required";
    } else if (email !== VALID_EMAIL) {
      newErrors.email = "Invalid email address. Access restricted.";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password !== VALID_PASSWORD) {
      newErrors.password = "Invalid password. Access denied.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createUserIfNeeded = async () => {
    try {
      console.log("Creating user in Supabase Auth...");
      
      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          first_name: "Abhik",
          last_name: "Admin"
        }
      });

      console.log("Admin create user result:", { data, error });
      
      if (error && !error.message.includes("already been registered")) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Error creating user:", error);
      // Try regular signup as fallback
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
        options: {
          data: {
            first_name: "Abhik",
            last_name: "Admin"
          }
        }
      });
      
      console.log("Fallback signup result:", { data, error: signUpError });
      return !signUpError;
    }
  };

  const handleSignIn = async () => {
    // First validate hardcoded credentials
    console.log("Starting sign in with:", { email, password });
    console.log("Valid credentials:", { VALID_EMAIL, VALID_PASSWORD });
    
    if (!validateCredentials()) {
      console.log("Hardcoded validation failed");
      return;
    }

    console.log("Hardcoded validation passed");
    setLoading(true);
    
    try {
      // First attempt to sign in
      console.log("Attempting to sign in with Supabase...");
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      });

      if (signInError) {
        console.log("Sign in error:", signInError);
        
        if (signInError.message.includes("Invalid login credentials") || 
            signInError.message.includes("Email not confirmed")) {
          console.log("User doesn't exist or not confirmed, creating user...");
          
          // Create the user first
          await createUserIfNeeded();
          
          // Wait a moment for the user to be created
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try signing in again
          console.log("Attempting sign in after user creation...");
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email: VALID_EMAIL,
            password: VALID_PASSWORD,
          });

          if (retryError) {
            console.log("Retry sign in error:", retryError);
            throw new Error(`Authentication failed: ${retryError.message}`);
          }
          
          console.log("Retry sign in successful:", retryData);
        } else {
          throw signInError;
        }
      } else {
        console.log("Initial sign in successful:", signInData);
      }

      toast({
        title: "Welcome to TextFlow CRM",
        description: "You have been signed in successfully.",
      });
      navigate("/contacts");
      
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Sign In Failed",
        description: error.message || "Authentication failed. Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSignIn();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-center items-center p-12 text-primary-foreground">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center mb-8">
            <MessageSquare className="h-12 w-12 mr-3" />
            <h1 className="text-4xl font-bold">TextFlow CRM</h1>
          </div>
          
          <h2 className="text-2xl font-semibold mb-6">
            Streamline Your Customer Communications
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <Users className="h-6 w-6 mt-1 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-medium mb-1">Contact Management</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Organize and manage all your customer contacts in one place
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <MessageSquare className="h-6 w-6 mt-1 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-medium mb-1">SMS Campaigns</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Create and send targeted SMS campaigns to your audience
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <BarChart3 className="h-6 w-6 mt-1 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-medium mb-1">Analytics & Reporting</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Track performance and get insights from your campaigns
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <MessageSquare className="h-8 w-8 mr-2 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">TextFlow CRM</h1>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Welcome to TextFlow CRM</CardTitle>
              <CardDescription>
                Sign in to access your customer communication platform
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">System Access</h4>
                <p className="text-xs text-muted-foreground">
                  This is a restricted access system. Please use your authorized credentials to sign in.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-muted-foreground">
            <p>© 2025 TextFlow CRM - Secure Access Portal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;