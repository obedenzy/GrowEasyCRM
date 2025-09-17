'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { data: session } = useSession(); // Use useSession hook

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        toast.error('Invalid email or password');
      } else {
        toast.success('Login successful!');
        // After successful login, try to get subaccountId from the session
        // The session might not be immediately updated after signIn without a page refresh
        // For immediate access, we might need a separate API call or a full page reload

        // For now, let's try to redirect based on the current session if available,
        // or assume a default path that handles redirection if the subaccountId is not in the session yet.

        // A more robust solution involves a server-side redirect or fetching user details client-side.
        // Given the goal, we'll assume the session will eventually update or we can get user details.

        // Option 1: Full page reload to ensure session is updated
        // router.push('/'); // Redirect to home, which should then handle further redirection based on session
        // router.refresh();

        // Option 2: Fetch user details to get subaccountId (requires an API endpoint)
        // For simplicity and directness, we will modify this to use the session as it should be updated
        // after a successful signIn or after a refresh.

        // It's generally better to let NextAuth handle the redirect directly if possible,
        // or to have a landing page that then redirects based on session info.

        // Let's modify the redirection to go to a generic /dashboard which can then redirect
        // or directly to the expected subaccount path if we can access subaccountId here.
        if (session?.user?.subaccountId) {
          router.push(`/subaccount/${session.user.subaccountId}/dashboard`);
        } else {
          // Fallback if subaccountId is not immediately available in session
          // This scenario should ideally not happen for subaccount users after a successful login
          // given the backend changes.
          router.push('/dashboard'); // A generic dashboard route or a page that will handle redirection
        }
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Background with text overlay */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center space-x-3 mb-8">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Star className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold">Grow Easy</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Transform Your Business Reputation
          </h1>
          
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of businesses using our AI-powered platform to intelligently manage reviews, boost positive ratings, and protect their online reputation.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-blue-200 rounded-full"></div>
              <span className="text-blue-100">Smart review filtering and redirection</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-blue-200 rounded-full"></div>
              <span className="text-blue-100">Private feedback collection for improvement</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-2 w-2 bg-blue-200 rounded-full"></div>
              <span className="text-blue-100">Real-time analytics and insights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Back to home link */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 text-sm">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          <Card className="border-0 shadow-xl bg-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <Separator className="my-6" />

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demo Accounts */}
          <Card className="mt-4 border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">Demo Accounts</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-xs text-gray-600">
                <div>
                  <strong>Agency Admin:</strong> admin@groweasy.com / password123
                </div>
                <div>
                  <strong>Restaurant Owner:</strong> user@restaurant.com / password123
                </div>
                <div className="mt-2 pt-2 border-t text-gray-500">
                  Role-based access with agency and subaccount management
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}