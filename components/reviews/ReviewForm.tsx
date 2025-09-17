'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle, MessageSquare, Building } from 'lucide-react';
import { toast } from 'sonner';

interface SubaccountSettings {
  businessName: string;
  logoUrl: string | null;
  googleReviewLink: string | null;
  reviewThreshold: number;
  primaryColor: string;
  thankYouMessage: string | null;
}

export function ReviewForm({ subaccountId, isPreview = false }: { subaccountId: string; isPreview?: boolean }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [settings, setSettings] = useState<SubaccountSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Fetch subaccount settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/subaccounts/${subaccountId}/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        } else {
          console.error('Failed to fetch settings');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [subaccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!formData.name || !formData.comment) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/subaccounts/${subaccountId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          comment: formData.comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const result = await response.json();
      
      const threshold = settings?.reviewThreshold || 4;
      
      if (rating >= threshold) {
        // Positive review - immediately redirect to Google or external platform
        toast.success('Thank you for your positive feedback! Redirecting to leave a public review...');
        if (!isPreview && settings?.googleReviewLink) {
          // Immediate redirect for positive reviews
          window.location.assign(settings.googleReviewLink);
          return; // Exit early since we're redirecting
        } else if (!isPreview) {
          // Fallback if no Google URL is configured
          const businessName = settings?.businessName || 'this business';
          window.location.assign(`https://www.google.com/search?q=${encodeURIComponent(businessName)}+review`);
          return; // Exit early since we're redirecting
        }
      } else {
        // Negative review - captured privately
        toast.success(settings?.thankYouMessage || 'Thank you for your feedback! We value your input and will use it to improve.');
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className={isPreview ? "p-8" : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4"}>
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardContent className="text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">
              {rating >= (settings?.reviewThreshold || 4) 
                ? "We're thrilled you had a great experience! Your public review helps other customers discover us."
                : settings?.thankYouMessage || "We appreciate your honest feedback and will use it to improve our service."
              }
            </p>
            <div className="flex justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={isPreview ? "p-4" : "min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4"}>
      <div className="w-full max-w-2xl">
        {!isPreview && (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={settings.businessName || 'Business Logo'} 
                  className="h-12 w-12 object-contain rounded-lg"
                />
              ) : (
                <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-white" />
                </div>
              )}
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {settings?.businessName || 'Grow Easy'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Experience</h1>
            <p className="text-gray-600">
              Your feedback drives our success and helps us deliver exceptional service
            </p>
          </div>
        )}

        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl text-gray-900">How was your experience?</CardTitle>
            <CardDescription className="text-gray-600">
              Please rate your overall experience and share your thoughts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating Section */}
              <div className="text-center space-y-2">
                <Label className="text-sm font-medium">Overall Rating</Label>
                <div className="flex justify-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className="focus:outline-none"
                      onMouseEnter={() => setHoveredRating(i + 1)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(i + 1)}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          i < (hoveredRating || rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {rating > 0 && (
                    <span>
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent"}
                    </span>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com (optional)"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Review Title</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Brief title for your review (optional)"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">Your Feedback *</Label>
                <Textarea
                  id="comment"
                  placeholder="Please share details about your experience..."
                  value={formData.comment}
                  onChange={(e) => handleInputChange('comment', e.target.value)}
                  required
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* Smart Review Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium mb-1">Smart Review System</p>
                    <p className="text-blue-700">
                      Positive reviews ({settings?.reviewThreshold || 4}+ stars) will be shared publicly to help other customers.
                      Lower ratings will be kept private so we can address your concerns directly.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {!isPreview && (
          <div className="text-center mt-6 text-xs text-gray-500">
            <p>Powered by Grow Easy - All-in-One CRM, Sales & Marketing Platform</p>
          </div>
        )}
      </div>
    </div>
  );
}