'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';

interface UserProfileData {
  id: string;
  email: string;
  name: string;
  subaccountRole: 'SUBACCOUNT_ADMIN' | 'SUBACCOUNT_USER';
  isCurrentUser: boolean;
  canEdit: boolean;
}

export default function UserProfilePage({
  params,
}: {
  params: { subaccountId: string; userId: string };
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' }); // Added password fields
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { subaccountId, userId } = params;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user?.id || !subaccountId || !userId) {
        setError('Authentication or parameters missing.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/subaccounts/${subaccountId}/users/${userId}/profile`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to fetch user profile.');
          toast.error(data.error || 'Failed to fetch user profile.');
          return;
        }

        setUserProfile(data);
        setFormData(prev => ({ ...prev, name: data.name, email: data.email })); // Only update name and email here
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('An unexpected error occurred while fetching user profile.');
        toast.error('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [session, subaccountId, userId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);

    if (!userProfile?.canEdit) {
      toast.error('You do not have permission to update this profile.');
      setIsUpdating(false);
      return;
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        toast.error('New password must be at least 6 characters.');
        setIsUpdating(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('New password and confirmation do not match.');
        setIsUpdating(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/subaccounts/${subaccountId}/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update profile.');
        toast.error(data.error || 'Failed to update profile.');
        return;
      }

      toast.success(data.message || 'Profile updated successfully!');
      // Refresh the page data to reflect changes (only for name/email)
      setUserProfile(prev => prev ? { ...prev, name: formData.name, email: formData.email } : null);
      // Clear password fields after successful update
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An unexpected error occurred while updating profile.');
      toast.error('An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading user profile...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  if (!userProfile) {
    return <div className="p-6 text-red-500">User profile not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="p-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={formData.name} 
              onChange={(e) => handleInputChange('name', e.target.value)} 
              readOnly={!userProfile.canEdit}
              className="h-10"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email} 
              onChange={(e) => handleInputChange('email', e.target.value)} 
              readOnly={!userProfile.canEdit}
              className="h-10"
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Badge className="w-fit">
              {userProfile.subaccountRole === 'SUBACCOUNT_ADMIN' ? 'Subaccount Admin' : 'Subaccount User'}
            </Badge>
          </div>

          {/* Password update fields */}
          {userProfile.canEdit && (
            <div className="space-y-4 border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="h-10 pr-10"
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="h-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {userProfile.canEdit && (
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}