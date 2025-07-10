
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, MessageSquare, Users, BarChart3 } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn } = useCustomAuth();

  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate("/contacts");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          title: "Sign In Failed",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome to TextFlow CRM",
          description: "You have been signed in successfully.",
        });
        navigate("/contacts");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred. Please try again.",
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
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your CRM dashboard
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

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-sm mb-2">Demo Credentials</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Email: abhik.voice@gmail.com
                </p>
                <p className="text-xs text-muted-foreground">
                  Password: 11111111
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-muted-foreground">
            <p>© 2025 TextFlow CRM - Professional Customer Management</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
