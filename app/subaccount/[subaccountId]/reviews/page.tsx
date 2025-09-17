import { getCurrentUser, hasSubaccountAccess } from '@/lib/session-stub';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, ExternalLink, Filter, Calendar, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReviewPreview } from '@/components/review-preview';
import { ReviewSettings } from '@/components/review-settings';
import { supabaseAdmin } from '@/lib/supabase-server';
import { DashboardCharts } from '@/components/dashboard-charts';
import { ReviewPageActions } from '@/components/reviews/ReviewPageActions';

export default async function SubaccountReviewsPage({
  params,
}: {
  params: { subaccountId: string };
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Verify access to this subaccount
  const hasAccess = await hasSubaccountAccess(params.subaccountId);
  if (!hasAccess) {
    notFound();
  }

  // Fetch real reviews from database
  const { data: subaccount, error: subaccountError } = await supabaseAdmin
    .from('subaccounts')
    .select('id, name')
    .eq('id', params.subaccountId)
    .single();

  if (subaccountError || !subaccount) {
    notFound();
  }

  const { data: reviews, error: reviewsError } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('subaccount_id', params.subaccountId)
    .order('created_at', { ascending: false });

  const reviewList = reviews || [];

  const reviewsData = reviewList.map(review => ({
    id: review.id,
    customerName: review.customer_name,
    rating: review.rating,
    subject: review.subject,
    comment: review.comment,
    status: review.status,
    source: 'Customer Form',
    date: new Date(review.created_at).toISOString().split('T')[0], // Format as YYYY-MM-DD
    response: null, // TODO: Add response field to schema if needed
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Google': return 'bg-blue-100 text-blue-800';
      case 'Yelp': return 'bg-red-100 text-red-800';
      case 'Facebook': return 'bg-blue-100 text-blue-800';
      case 'Internal': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: reviewsData.length,
    approved: reviewsData.filter(r => r.status === 'APPROVED').length,
    pending: reviewsData.filter(r => r.status === 'PENDING').length,
    averageRating: reviewsData.length > 0 ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length : 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">
            Manage customer feedback and review settings
          </p>
        </div>
        <ReviewPageActions subaccountId={params.subaccountId} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Customer feedback received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.filter(r => r.rating >= 4).length}</div>
            <p className="text-xs text-muted-foreground">
              4+ star ratings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">
              Recent feedback
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Reviews</CardTitle>
              <CardDescription>Manage all customer feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-3">
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
                          <Badge className={getSourceColor(review.source)}>
                            {review.source}
                          </Badge>
                        </div>
                        
                        {review.subject && (
                          <h4 className="font-medium text-sm mb-1">{review.subject}</h4>
                        )}
                        
                        {review.comment && (
                          <p className="text-sm text-gray-600 mb-2">{review.comment}</p>
                        )}

                        {review.response && (
                          <div className="bg-muted/50 rounded-lg p-3 mt-3">
                            <p className="text-sm">
                              <strong>Your Response:</strong> {review.response}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {review.date}
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="analytics" className="space-y-4">
          {/* Dashboard Charts */}
          <DashboardCharts reviews={reviewsData} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rating Breakdown</CardTitle>
                <CardDescription>Distribution of customer ratings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>5 Stars</span>
                    <span>{reviews.filter(r => r.rating === 5).length} reviews</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${reviews.length > 0 ? (reviews.filter(r => r.rating === 5).length / reviews.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>4 Stars</span>
                    <span>{reviews.filter(r => r.rating === 4).length} reviews</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${reviews.length > 0 ? (reviews.filter(r => r.rating === 4).length / reviews.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>3 Stars</span>
                    <span>{reviews.filter(r => r.rating === 3).length} reviews</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${reviews.length > 0 ? (reviews.filter(r => r.rating === 3).length / reviews.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>2 Stars</span>
                    <span>{reviews.filter(r => r.rating === 2).length} reviews</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${reviews.length > 0 ? (reviews.filter(r => r.rating === 2).length / reviews.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>1 Star</span>
                    <span>{reviews.filter(r => r.rating === 1).length} reviews</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${reviews.length > 0 ? (reviews.filter(r => r.rating === 1).length / reviews.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Insights</CardTitle>
                <CardDescription>Key metrics from customer feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Response Rate</span>
                  <span className="font-medium">100%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Positive Sentiment</span>
                  <span className="font-medium">{reviews.length > 0 ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100) : 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  <span className="font-medium">2 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className="font-medium">{reviews.length} reviews</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview Review Form
              </CardTitle>
              <CardDescription>
                This is how customers will see your review collection page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewPreview subaccountId={params.subaccountId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <ReviewSettings subaccountId={params.subaccountId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}