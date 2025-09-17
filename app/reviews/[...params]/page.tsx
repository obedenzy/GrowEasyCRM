'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';

interface SubaccountData {
  id: string;
  businessName: string;
  logoUrl?: string;
  googleReviewLink?: string;
  isActive: boolean;
  reviewThreshold: number;
  thankYouMessage: string;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [subaccountData, setSubaccountData] = useState<SubaccountData | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewData, setReviewData] = useState({
    subject: '',
    body: '',
    email: '',
    phone: '',
    name: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Extract subaccount ID from params
  const subaccountId = Array.isArray(params.params) ? params.params[0] : params.params;

  useEffect(() => {
    if (subaccountId) {
      fetchSubaccountData();
    }
  }, [subaccountId]);

  const fetchSubaccountData = async () => {
    try {
      const response = await fetch(`/api/reviews/${subaccountId}`);
      if (response.ok) {
        const data = await response.json();
        setSubaccountData(data);
      } else {
        console.error('Failed to fetch subaccount data');
        setSubaccountData(null);
      }
    } catch (error) {
      console.error('Error fetching subaccount data:', error);
      setSubaccountData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
    
    const threshold = subaccountData?.reviewThreshold || 4;
    
    if (selectedRating >= threshold) {
      // Redirect to Google Reviews for positive ratings
      if (subaccountData?.googleReviewLink) {
        // Use location.assign for immediate redirect in same tab
        window.location.assign(subaccountData.googleReviewLink);
      } else {
        // Fallback to Google search if no specific link configured
        const businessName = encodeURIComponent(subaccountData?.businessName || 'business');
        window.location.assign(`https://www.google.com/search?q=${businessName}+reviews`);
      }
    } else {
      // Show form for negative ratings
      setShowForm(true);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/reviews/${subaccountId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          subject: reviewData.subject,
          comment: reviewData.body,
          customerName: reviewData.name,
          customerEmail: reviewData.email,
          customerPhone: reviewData.phone,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast.success('Thank you for your feedback!');
      } else {
        toast.error(result.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setReviewData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!subaccountData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Business Not Found</h2>
            <p className="text-gray-600">The review link you're looking for doesn't exist or has been disabled.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!subaccountData.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Reviews Temporarily Unavailable</h2>
            <p className="text-gray-600">
              We're sorry, but {subaccountData.businessName} is not currently accepting reviews through this platform. 
              Please check back later or contact the business directly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">
              {subaccountData.thankYouMessage}
            </p>
            <p className="text-sm text-gray-500">
              We appreciate you taking the time to share your experience with {subaccountData.businessName}.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            {subaccountData.logoUrl && (
              <div className="mx-auto mb-4 w-16 h-16 relative">
                <Image
                  src={subaccountData.logoUrl}
                  alt={`${subaccountData.businessName} logo`}
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
            )}
            <CardTitle className="text-2xl font-bold text-gray-900">
              {subaccountData.businessName}
            </CardTitle>
            <CardDescription className="text-gray-600">
              How was your experience with us?
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showForm ? (
              <div className="text-center">
                <p className="text-gray-700 mb-6">Please rate your experience:</p>
                <div className="flex justify-center space-x-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-12 w-12 ${
                          star <= (hoveredRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Click on a star to rate your experience
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="flex justify-center space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 ${
                          star <= rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    We'd love to hear more about your experience
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={reviewData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Brief summary of your experience"
                    value={reviewData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Details *</Label>
                  <Textarea
                    id="body"
                    placeholder="Please tell us more about your experience..."
                    value={reviewData.body}
                    onChange={(e) => handleInputChange('body', e.target.value)}
                    required
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={reviewData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Your phone number"
                    value={reviewData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {rating >= (subaccountData?.reviewThreshold || 4) && !showForm && (
          <Card className="mt-4 border-0 shadow-lg bg-green-50/80 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-green-700 font-medium mb-2">
                  Thank you for the great rating!
                </p>
                <p className="text-sm text-green-600 mb-3">
                  Would you mind sharing your experience on Google?
                </p>
                {subaccountData?.googleReviewLink && (
                  <Button
                    onClick={() => window.location.assign(subaccountData.googleReviewLink!)}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Leave Google Review
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}