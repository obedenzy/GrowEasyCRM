import { getCurrentUser, hasAgencyAccess } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Star, Plus, Settings, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';

export default async function AgencySubaccountsPage({
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

  // Get real subaccounts from database
  const { data: subaccountsData, error: subaccountsError } = await supabaseAdmin
    .from('subaccounts')
    .select(`
      id,
      name,
      status,
      created_at,
      updated_at,
      contact_email,
      website
    `)
    .eq('agency_id', params.agencyId)
    .order('created_at', { ascending: false });

  if (subaccountsError) {
    console.error('Error fetching subaccounts:', subaccountsError);
  }

  // Get review stats and user counts for each subaccount
  const subaccountsWithStats = await Promise.all((subaccountsData || []).map(async (subaccount) => {
    // Get review stats
    const { data: reviews } = await supabaseAdmin
      .from('reviews')
      .select('rating, created_at')
      .eq('subaccount_id', subaccount.id);

    // Get user count
    const { count: userCount } = await supabaseAdmin
      .from('subaccount_users')
      .select('*', { count: 'exact' })
      .eq('subaccount_id', subaccount.id);

    const reviewCount = reviews?.length || 0;
    const averageRating = reviewCount > 0 
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount)
      : 0;

    // Calculate "last active" from latest review or account update
    const lastReviewDate = reviews && reviews.length > 0 
      ? Math.max(...reviews.map(r => new Date(r.created_at).getTime()))
      : null;
    
    const accountUpdateDate = new Date(subaccount.updated_at).getTime();
    const latestActivityDate = lastReviewDate ? Math.max(lastReviewDate, accountUpdateDate) : accountUpdateDate;
    
    const now = Date.now();
    const daysSince = Math.floor((now - latestActivityDate) / (1000 * 60 * 60 * 24));
    const hoursSince = Math.floor((now - latestActivityDate) / (1000 * 60 * 60));
    
    let lastActiveText = '';
    if (daysSince === 0) {
      lastActiveText = hoursSince === 0 ? 'Just now' : `${hoursSince} hours ago`;
    } else {
      lastActiveText = `${daysSince} days ago`;
    }

    return {
      id: subaccount.id,
      name: subaccount.name,
      industry: 'Business', // You could add an industry field to the subaccounts table
      status: subaccount.status === 'active' ? 'Active' : 
               subaccount.status === 'setup' ? 'Setup' : 'Inactive',
      users: userCount || 0,
      reviews: reviewCount,
      rating: averageRating,
      lastActive: lastActiveText
    };
  }));

  const subaccounts = subaccountsWithStats;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Setup': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subaccounts</h1>
          <p className="text-muted-foreground">
            Manage all client businesses and their review management
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Subaccount
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subaccounts</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subaccounts.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subaccounts.reduce((sum, sub) => sum + sub.users, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all subaccounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subaccounts.reduce((sum, sub) => sum + sub.reviews, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              +89 this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subaccounts.length > 0 ? (subaccounts.reduce((sum, sub) => sum + sub.rating, 0) / subaccounts.length).toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all businesses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subaccounts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Subaccounts</CardTitle>
          <CardDescription>
            Manage and monitor all your client businesses. Click on any subaccount to access Reviews, Calendar, and Customer management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subaccounts.map((subaccount) => (
              <Link
                key={subaccount.id}
                href={`/subaccount/${subaccount.id}/dashboard`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-blue-600">{subaccount.name}</h3>
                    <p className="text-sm text-muted-foreground">{subaccount.industry}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm font-medium">{subaccount.users} users</p>
                    <p className="text-xs text-muted-foreground">Team size</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">{subaccount.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{subaccount.reviews} reviews</p>
                  </div>

                  <div className="text-right">
                    <Badge className={getStatusColor(subaccount.status)}>
                      {subaccount.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{subaccount.lastActive}</p>
                  </div>

                  <div className="text-sm text-muted-foreground">Click to manage →</div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}