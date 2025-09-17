import { getCurrentUser, hasAgencyAccess } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Star, TrendingUp } from 'lucide-react';

export default async function AgencyDashboardPage({
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

  // Get real stats from database
  const [
    subaccountsData,
    usersData,
    reviewsData,
    recentSubaccounts
  ] = await Promise.all([
    // Total subaccounts for this agency
    supabaseAdmin
      .from('subaccounts')
      .select('id, status')
      .eq('agency_id', params.agencyId),
    
    // Get all users associated with this agency (both agency admins and subaccount users)
    supabaseAdmin
      .from('user_agency_memberships')
      .select(`
        users:user_id (id, name, email)
      `)
      .eq('agency_id', params.agencyId),
    
    // Get total reviews across all subaccounts in this agency
    supabaseAdmin
      .from('reviews')
      .select('rating, created_at')
      .in('subaccount_id', 
        await supabaseAdmin
          .from('subaccounts')
          .select('id')
          .eq('agency_id', params.agencyId)
          .then(result => result.data?.map(s => s.id) || [])
      ),
    
    // Get recent subaccounts with review counts
    supabaseAdmin
      .from('subaccounts')
      .select(`
        id,
        name,
        status,
        created_at,
        reviews:reviews(count)
      `)
      .eq('agency_id', params.agencyId)
      .order('created_at', { ascending: false })
      .limit(3)
  ]);

  // Calculate statistics
  const totalSubaccounts = subaccountsData.data?.length || 0;
  const activeSubaccounts = subaccountsData.data?.filter(s => s.status === 'ACTIVE' || s.status === 'active').length || 0;
  const totalUsers = usersData.data?.length || 0;
  const totalReviews = reviewsData.data?.length || 0;
  const averageRating = reviewsData.data?.length > 0 
    ? (reviewsData.data.reduce((sum, review) => sum + review.rating, 0) / reviewsData.data.length).toFixed(1)
    : '0.0';

  // Calculate recent trends (simplified - you could make this more sophisticated)
  const lastMonthReviews = reviewsData.data?.filter(
    review => new Date(review.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length || 0;

  const stats = [
    {
      title: 'Total Subaccounts',
      value: totalSubaccounts.toString(),
      change: `${activeSubaccounts} active`,
      icon: Building,
      color: 'text-blue-600'
    },
    {
      title: 'Active Users',
      value: totalUsers.toString(),
      change: 'All agency members',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Total Reviews',
      value: totalReviews.toLocaleString(),
      change: `${lastMonthReviews} this month`,
      icon: Star,
      color: 'text-yellow-600'
    },
    {
      title: 'Average Rating',
      value: `${averageRating}★`,
      change: `From ${totalReviews} reviews`,
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agency Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Here's your agency overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Badge variant="secondary" className="text-xs">
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Subaccounts</CardTitle>
            <CardDescription>Latest subaccount activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSubaccounts.data && recentSubaccounts.data.length > 0 ? (
                recentSubaccounts.data.map((subaccount) => (
                  <div key={subaccount.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{subaccount.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {subaccount.reviews[0]?.count || 0} reviews
                      </p>
                    </div>
                    <Badge variant={(subaccount.status === 'ACTIVE' || subaccount.status === 'active') ? 'default' : 'secondary'}>
                      {(subaccount.status === 'ACTIVE' || subaccount.status === 'active') ? 'Active' : 
                       subaccount.status === 'setup' ? 'Setup' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <p>No subaccounts found</p>
                  <p className="text-sm">Create your first subaccount to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common agency management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <p className="font-medium">Create New Subaccount</p>
                <p className="text-sm text-muted-foreground">Add a new business to your agency</p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <p className="font-medium">Invite Team Member</p>
                <p className="text-sm text-muted-foreground">Add a new user to your agency</p>
              </div>
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <p className="font-medium">View Analytics</p>
                <p className="text-sm text-muted-foreground">Review performance across all clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}