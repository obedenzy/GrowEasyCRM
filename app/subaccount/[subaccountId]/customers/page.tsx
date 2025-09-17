import { getCurrentUser, hasSubaccountAccess } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, Mail, Phone, Star, MessageSquare, Filter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function SubaccountCustomersPage({
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

  // Get real customer data from reviews
  const { data: reviewsData, error: reviewsError } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('subaccount_id', params.subaccountId)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    console.error('Error fetching reviews:', reviewsError);
  }

  // Group reviews by customer email to create customer profiles
  const customerMap = new Map();
  
  (reviewsData || []).forEach(review => {
    const customerKey = review.customer_email || review.customer_name;
    
    if (customerMap.has(customerKey)) {
      const existing = customerMap.get(customerKey);
      existing.totalReviews += 1;
      existing.ratings.push(review.rating);
      if (new Date(review.created_at) > new Date(existing.lastReview)) {
        existing.lastReview = review.created_at;
      }
    } else {
      customerMap.set(customerKey, {
        id: review.customer_email || review.customer_name,
        name: review.customer_name,
        email: review.customer_email,
        phone: review.customer_phone,
        totalReviews: 1,
        ratings: [review.rating],
        lastReview: review.created_at,
        firstReview: review.created_at
      });
    }
  });

  // Convert map to array and calculate additional stats
  const customers = Array.from(customerMap.values()).map(customer => {
    const averageRating = customer.ratings.reduce((sum, rating) => sum + rating, 0) / customer.ratings.length;
    
    // Determine status based on review count and ratings
    let status = 'New';
    let tags = [];
    
    if (customer.totalReviews >= 5 && averageRating >= 4.5) {
      status = 'VIP';
      tags.push('Loyal Customer');
    } else if (customer.totalReviews >= 2) {
      status = 'Regular';
      tags.push('Return Customer');
    } else {
      tags.push('New Customer');
    }
    
    if (averageRating >= 4.5) {
      tags.push('High Satisfaction');
    }

    return {
      id: customer.id,
      name: customer.name || 'Unknown',
      email: customer.email || null,
      phone: customer.phone || null,
      lastVisit: customer.lastReview ? new Date(customer.lastReview).toLocaleDateString() : null,
      totalVisits: customer.totalReviews, // Using reviews as proxy for visits
      totalReviews: customer.totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      status,
      tags,
      lastReview: customer.lastReview ? new Date(customer.lastReview).toLocaleDateString() : null,
      notes: '' // No notes in current schema
    };
  })
  .sort((a, b) => b.totalReviews - a.totalReviews); // Sort by most reviews first

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIP': return 'bg-purple-100 text-purple-800';
      case 'Regular': return 'bg-blue-100 text-blue-800';
      case 'New': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const stats = {
    total: customers.length,
    vip: customers.filter(c => c.status === 'VIP').length,
    regular: customers.filter(c => c.status === 'Regular').length,
    new: customers.filter(c => c.status === 'New').length,
    averageVisits: Math.round(customers.reduce((sum, c) => sum + c.totalVisits, 0) / customers.length),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and review history
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vip}</div>
            <p className="text-xs text-muted-foreground">
              High-value customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new}</div>
            <p className="text-xs text-muted-foreground">
              First-time customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Visits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageVisits}</div>
            <p className="text-xs text-muted-foreground">
              Per customer
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Customers</TabsTrigger>
          <TabsTrigger value="vip">VIP</TabsTrigger>
          <TabsTrigger value="regular">Regular</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Customers</CardTitle>
              <CardDescription>Complete customer database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`/avatars/customer-${customer.id}.jpg`} alt={customer.name} />
                        <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold">{customer.name}</h3>
                          <Badge className={getStatusColor(customer.status)}>
                            {customer.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {customer.phone}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {customer.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {customer.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {customer.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-right">
                      <div>
                        <p className="text-sm font-medium">{customer.totalVisits} visits</p>
                        <p className="text-xs text-muted-foreground">Last: {customer.lastVisit}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">
                            {customer.averageRating > 0 ? customer.averageRating.toFixed(1) : 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {customer.totalReviews} review{customer.totalReviews !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vip" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>VIP Customers</CardTitle>
              <CardDescription>High-value and loyal customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <p>{customers.filter(c => c.status === 'VIP').length} VIP customer(s)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regular Customers</CardTitle>
              <CardDescription>Returning customers with multiple visits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                <p>{customers.filter(c => c.status === 'Regular').length} regular customer(s)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New Customers</CardTitle>
              <CardDescription>First-time and recent customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>{customers.filter(c => c.status === 'New').length} new customer(s)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}