import { getCurrentUserWithDetails, hasSubaccountAccess } from '@/lib/session-stub';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { DashboardCharts } from '@/components/dashboard-charts';
import { supabaseAdmin } from '@/lib/supabase-server';

export default async function SubaccountDashboardPage({
  params,
}: {
  params: { subaccountId: string };
}) {
  const user = await getCurrentUserWithDetails();
  
  if (!user) {
    return <div>Access denied</div>;
  }

  // Verify access to this subaccount
  const hasAccess = await hasSubaccountAccess(params.subaccountId);
  if (!hasAccess) {
    notFound();
  }

  // Get subaccount details with reviews
  const { data: subaccount, error: subaccountError } = await supabaseAdmin
    .from('subaccounts')
    .select('id, name')
    .eq('id', params.subaccountId)
    .single();

  if (subaccountError || !subaccount) {
    notFound();
  }

  // Get settings
  const { data: settings } = await supabaseAdmin
    .from('subaccount_settings')
    .select('*')
    .eq('subaccount_id', params.subaccountId)
    .single();

  // Get recent reviews
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('subaccount_id', params.subaccountId)
    .order('created_at', { ascending: false })
    .limit(10);

  const reviewList = reviews || [];

  // Calculate review stats
  const totalReviews = reviewList.length;
  const averageRating = totalReviews > 0 
    ? reviewList.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;
  const positiveReviews = reviewList.filter(r => r.rating >= 4).length;
  const recentReviews = reviewList.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{subaccount.name}</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your business performance overview.
          </p>
        </div>
        <Badge variant="default" className="bg-green-600">
          Business Account
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              All time reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Reviews</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positiveReviews}</div>
            <p className="text-xs text-muted-foreground">
              4+ star ratings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <DashboardCharts reviews={subaccount.reviews} />

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Customer Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reviews yet. Share your review link to get started!
            </div>
          ) : (
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{review.customerName}</span>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.subject && (
                        <h4 className="font-medium text-sm mb-1">{review.subject}</h4>
                      )}
                      {review.comment && (
                        <p className="text-sm text-gray-600">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}