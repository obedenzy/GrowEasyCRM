'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'SUBACCOUNT_ADMIN' | 'SUBACCOUNT_USER';
  created_at: string;
}

export default function SubaccountUsersPage({
  params,
}: {
  params: { subaccountId: string };
}) {
  const router = useRouter();
  const { data: session, status } = useSession(); // Get status from useSession
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subaccountId = params.subaccountId;

  useEffect(() => {
    const fetchUsers = async () => {
      // Only fetch if session is authenticated and IDs are available
      if (status === 'loading') {
        // Still loading session, do nothing yet
        return;
      }

      if (status === 'unauthenticated' || !session?.user?.id || !subaccountId) {
        setError('User not authenticated or subaccount ID missing.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/subaccounts/${subaccountId}/users`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to fetch users.');
          toast.error(data.error || 'Failed to fetch users.');
          return;
        }
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('An unexpected error occurred while fetching users.');
        toast.error('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [session, status, subaccountId]); // Add status to dependencies

  const handleViewDetails = (userId: string) => {
    router.push(`/subaccount/${subaccountId}/users/${userId}/profile`);
  };

  const handleAddUser = () => {
    // Implement add user logic or redirect to an add user page
    toast.info('Add user functionality not yet implemented.');
  };

  if (status === 'loading' || isLoading) { // Check both session and data loading states
    return <div className="p-6">Loading users...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Subaccount Users</h1>
        <Button onClick={handleAddUser}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users for {subaccountId}</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found for this subaccount.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.role === 'SUBACCOUNT_ADMIN' ? 'Admin' : 'Standard User'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                            View Details
                          </DropdownMenuItem>
                          {/* Add other actions like Edit/Delete if needed, with role-based checks */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}