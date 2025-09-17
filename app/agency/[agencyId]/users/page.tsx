import { getCurrentUser, hasAgencyAccess } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, Mail, Shield, Clock, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default async function AgencyUsersPage({
  params,
}: {
  params: { agencyId: string };
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Verify access to this agency
  const hasAccess = await hasAgencyAccess(params.agencyId);
  if (!hasAccess) {
    notFound();
  }

  // Get real users from database
  const [agencyMembersData, subaccountUsersData] = await Promise.all([
    // Get agency admin members
    supabaseAdmin
      .from('user_agency_memberships')
      .select(`
        role,
        created_at,
        users:user_id (
          id,
          name,
          email,
          created_at
        )
      `)
      .eq('agency_id', params.agencyId),
    
    // Get subaccount users for this agency
    supabaseAdmin
      .from('subaccount_users')
      .select(`
        role,
        created_at,
        users:user_id (
          id,
          name,
          email,
          created_at
        ),
        subaccounts:subaccount_id (
          id,
          name,
          agency_id
        )
      `)
      .eq('subaccounts.agency_id', params.agencyId)
  ]);

  // Combine and format user data
  const allUsers = [];

  // Add agency members
  if (agencyMembersData.data) {
    agencyMembersData.data.forEach(membership => {
      if (membership.users) {
        allUsers.push({
          id: membership.users.id,
          name: membership.users.name || membership.users.email,
          email: membership.users.email,
          role: membership.role || 'AGENCY_ADMIN',
          status: 'Active', // Assume active for now - you could add a status field to users table
          lastLogin: 'Recently', // You could add a last_login field to track this
          subaccounts: [], // Agency admins have access to all subaccounts
          joinedDate: new Date(membership.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
    });
  }

  // Add subaccount users
  if (subaccountUsersData.data) {
    subaccountUsersData.data.forEach(subaccountUser => {
      if (subaccountUser.users && subaccountUser.subaccounts) {
        // Check if user already exists (might be both agency admin and subaccount user)
        const existingUserIndex = allUsers.findIndex(u => u.id === subaccountUser.users.id);
        
        if (existingUserIndex >= 0) {
          // User already exists, add subaccount to their list
          allUsers[existingUserIndex].subaccounts.push(subaccountUser.subaccounts.name);
        } else {
          // New user, add them
          allUsers.push({
            id: subaccountUser.users.id,
            name: subaccountUser.users.name || subaccountUser.users.email,
            email: subaccountUser.users.email,
            role: subaccountUser.role || 'SUBACCOUNT_USER',
            status: 'Active',
            lastLogin: 'Recently',
            subaccounts: [subaccountUser.subaccounts.name],
            joinedDate: new Date(subaccountUser.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })
          });
        }
      }
    });
  }

  const users = allUsers;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'AGENCY_ADMIN': return 'bg-purple-100 text-purple-800';
      case 'SUBACCOUNT_USER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Invited': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage agency team members and subaccount users
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.status === 'Active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agency Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'AGENCY_ADMIN').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Full access users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.status === 'Invited').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Agency team members and subaccount users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`/avatars/${user.id}.jpg`} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role === 'AGENCY_ADMIN' ? 'Agency Admin' : 'Business User'}
                      </Badge>
                      <Badge className={getStatusColor(user.status)}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {user.subaccounts.length} subaccount{user.subaccounts.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.subaccounts.slice(0, 2).join(', ')}
                      {user.subaccounts.length > 2 && `, +${user.subaccounts.length - 2} more`}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.lastLogin}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Last login</p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        View Activity
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.status === 'Invited' ? (
                        <DropdownMenuItem>
                          Resend Invite
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="text-red-600">
                          Deactivate User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}