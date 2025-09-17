'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Review {
  id: string;
  rating: number;
  createdAt: Date;
  customerName: string;
  subject?: string;
  comment?: string;
  status: string;
}

interface DashboardChartsProps {
  reviews: Review[];
}

export function DashboardCharts({ reviews }: DashboardChartsProps) {
  // Rating distribution data for pie chart
  const ratingDistribution = [
    { name: '5 Stars', value: reviews.filter(r => r.rating === 5).length, color: '#10b981' },
    { name: '4 Stars', value: reviews.filter(r => r.rating === 4).length, color: '#3b82f6' },
    { name: '3 Stars', value: reviews.filter(r => r.rating === 3).length, color: '#f59e0b' },
    { name: '2 Stars', value: reviews.filter(r => r.rating === 2).length, color: '#ef4444' },
    { name: '1 Star', value: reviews.filter(r => r.rating === 1).length, color: '#dc2626' },
  ].filter(item => item.value > 0);

  // Monthly review trends for bar chart using real data
  const monthlyData = (() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Get last 6 months of data
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentDate.getMonth() - i, 1);
      last6Months.push({
        month: months[date.getMonth()],
        monthIndex: date.getMonth(),
        year: date.getFullYear()
      });
    }
    
    const data: { month: string; reviews: number; averageRating: number }[] = [];
    
    last6Months.forEach(({ month, monthIndex, year }) => {
      // Filter reviews for this month and year
      const monthReviews = reviews.filter(review => {
        const reviewDate = new Date(review.createdAt);
        return reviewDate.getMonth() === monthIndex && reviewDate.getFullYear() === year;
      });
      
      const reviewCount = monthReviews.length;
      const avgRating = reviewCount > 0 
        ? monthReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;
      
      data.push({
        month,
        reviews: reviewCount,
        averageRating: parseFloat(avgRating.toFixed(1)),
      });
    });
    
    return data;
  })();

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#dc2626'];

  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Rating Distribution Pie Chart */}
      <div className="bg-white rounded-lg border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Rating Distribution</h3>
          <p className="text-sm text-gray-600">Breakdown of customer ratings</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ratingDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {ratingDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [value, name]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {ratingDistribution.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-gray-600">
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Review Trends Bar Chart */}
      <div className="bg-white rounded-lg border p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Review Trends</h3>
          <p className="text-sm text-gray-600">Monthly review volume and ratings</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: '#374151', fontWeight: 600 }}
              />
              <Bar 
                dataKey="reviews" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
                name="Review Count"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"/>
            <span className="text-xs text-gray-600">Monthly Reviews</span>
          </div>
        </div>
      </div>
    </div>
  );
}