import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, MessageSquare, Users, BarChart3 } from "lucide-react";

type AuthMode = "signin" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (mode !== "forgot") {
      if (!password) {
        newErrors.password = "Password is required";
      } else if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      if (mode === "signup") {
        if (!confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to confirm your account.",
      });
      setMode("signin");
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });

    if (error) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
      setMode("signin");
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    switch (mode) {
      case "signin":
        handleSignIn();
        break;
      case "signup":
        handleSignUp();
        break;
      case "forgot":
        handleForgotPassword();
        break;
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setErrors({});
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
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
              <CardTitle className="text-2xl">
                {mode === "signin" && "Welcome back"}
                {mode === "signup" && "Create your account"}
                {mode === "forgot" && "Reset your password"}
              </CardTitle>
              <CardDescription>
                {mode === "signin" && "Sign in to your TextFlow CRM account"}
                {mode === "signup" && "Start managing your customer communications"}
                {mode === "forgot" && "Enter your email to receive reset instructions"}
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

                {mode !== "forgot" && (
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
                )}

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={errors.confirmPassword ? "border-destructive" : ""}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "signin" && "Sign In"}
                  {mode === "signup" && "Create Account"}
                  {mode === "forgot" && "Send Reset Email"}
                </Button>
              </form>

              <div className="mt-6">
                {mode === "signin" && (
                  <>
                    <div className="text-center space-y-2">
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot your password?
                      </button>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">
                        Don't have an account?{" "}
                      </span>
                      <button
                        type="button"
                        onClick={() => switchMode("signup")}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        Sign up
                      </button>
                    </div>
                  </>
                )}

                {mode === "signup" && (
                  <div className="text-center mt-4">
                    <span className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                    </span>
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </div>
                )}

                {mode === "forgot" && (
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="text-sm text-primary hover:underline"
                    >
                      Back to sign in
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8 text-xs text-muted-foreground">
            <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;