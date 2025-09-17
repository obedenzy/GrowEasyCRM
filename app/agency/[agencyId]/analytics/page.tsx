import { getCurrentUser, hasAgencyAccess } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import { AgencyAnalyticsClient } from '@/components/analytics/AgencyAnalyticsClient';

export default async function AgencyAnalyticsPage({
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

  // Get real analytics data from database
  const [subaccountsData, reviewsData] = await Promise.all([
    // Get all subaccounts for this agency
    supabaseAdmin
      .from('subaccounts')
      .select('id, name, status, created_at')
      .eq('agency_id', params.agencyId),
    
    // Get all reviews for all subaccounts in this agency
    supabaseAdmin
      .from('reviews')
      .select(`
        rating,
        created_at,
        subaccount_id,
        subaccounts!inner(
          id,
          name,
          agency_id
        )
      `)
      .eq('subaccounts.agency_id', params.agencyId)
  ]);

  const subaccounts = subaccountsData.data || [];
  const allReviews = reviewsData.data || [];

  // Calculate monthly data for the last 6 months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyData = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    
    const monthReviews = allReviews.filter(review => {
      const reviewDate = new Date(review.created_at);
      return reviewDate >= monthDate && reviewDate < nextMonth;
    });

    const monthRating = monthReviews.length > 0 
      ? monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length 
      : 0;

    monthlyData.push({
      month: monthNames[monthDate.getMonth()],
      reviews: monthReviews.length,
      rating: parseFloat(monthRating.toFixed(1))
    });
  }

  // Calculate subaccount performance
  const subaccountPerformance = subaccounts.map(subaccount => {
    const subaccountReviews = allReviews.filter(r => (r as any).subaccounts.id === subaccount.id);
    const avgRating = subaccountReviews.length > 0 
      ? subaccountReviews.reduce((sum, r) => sum + r.rating, 0) / subaccountReviews.length 
      : 0;

    // Calculate growth (comparing last 2 months)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const lastMonthReviews = subaccountReviews.filter(r => {
      const reviewDate = new Date(r.created_at);
      return reviewDate >= lastMonth && reviewDate < thisMonth;
    }).length;
    
    const thisMonthReviews = subaccountReviews.filter(r => {
      const reviewDate = new Date(r.created_at);
      return reviewDate >= thisMonth && reviewDate < nextMonth;
    }).length;

    const growth = lastMonthReviews > 0 ? ((thisMonthReviews - lastMonthReviews) / lastMonthReviews) * 100 : 0;

    return {
      name: subaccount.name,
      reviews: subaccountReviews.length,
      rating: parseFloat(avgRating.toFixed(1)),
      growth: parseFloat(growth.toFixed(1)),
      status: subaccount.status
    };
  });

  // Calculate rating distribution
  const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
    rating: rating.toString(),
    count: allReviews.filter(r => r.rating === rating).length
  }));

  // Mock industry data (you can expand this with real categorization)
  const industryData = [
    { industry: 'Healthcare', reviews: Math.floor(allReviews.length * 0.3), rating: 4.2 },
    { industry: 'Technology', reviews: Math.floor(allReviews.length * 0.25), rating: 4.1 },
    { industry: 'Retail', reviews: Math.floor(allReviews.length * 0.2), rating: 3.9 },
    { industry: 'Services', reviews: Math.floor(allReviews.length * 0.15), rating: 4.3 },
    { industry: 'Other', reviews: Math.floor(allReviews.length * 0.1), rating: 4.0 }
  ];

  // Calculate KPIs
  const totalReviews = allReviews.length;
  const averageRating = totalReviews > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;
  const activeSubaccounts = subaccounts.filter(s => s.status === 'ACTIVE').length;
  
  // Calculate trends (comparing with previous period)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const lastMonthReviews = allReviews.filter(r => {
    const reviewDate = new Date(r.created_at);
    return reviewDate >= lastMonthStart && reviewDate < thisMonthStart;
  });
  
  const reviewsTrend = lastMonthReviews.length > 0 ? 
    ((totalReviews - lastMonthReviews.length) / lastMonthReviews.length) * 100 : 0;

  const kpis = {
    totalSubaccounts: subaccounts.length,
    activeSubaccounts,
    totalReviews,
    averageRating: parseFloat(averageRating.toFixed(1)),
    reviewsTrend: parseFloat(reviewsTrend.toFixed(1))
  };

  // Pass all computed data to the client component
  return (
    <AgencyAnalyticsClient
      agencyId={params.agencyId}
      monthlyData={monthlyData}
      subaccountPerformance={subaccountPerformance}
      ratingDistribution={ratingDistribution}
      industryData={industryData}
      kpis={kpis}
    />
  );
}