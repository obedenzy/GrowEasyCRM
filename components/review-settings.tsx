'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface ReviewSettingsProps {
  subaccountId: string;
}

export function ReviewSettings({ subaccountId }: ReviewSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for review settings
  const [reviewData, setReviewData] = useState({
    googleReviewLink: '',
    reviewThreshold: 4,
    autoApprovePositive: true,
    redirectToGoogle: true,
    collectNegativePrivately: true,
    requireCustomerName: false,
    thankYouMessage: '',
  });

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/subaccounts/${subaccountId}/settings`);
        if (response.ok) {
          const data = await response.json();
          setReviewData(prev => ({
            ...prev,
            googleReviewLink: data.settings.googleReviewLink || '',
            reviewThreshold: data.settings.reviewThreshold || 4,
            thankYouMessage: data.settings.thankYouMessage || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [subaccountId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/subaccounts/${subaccountId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleReviewLink: reviewData.googleReviewLink,
          reviewThreshold: reviewData.reviewThreshold,
          thankYouMessage: reviewData.thankYouMessage,
          enableReviews: true,
        }),
      });

      if (response.ok) {
        toast.success('Review settings saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save review settings');
      }
    } catch (error) {
      console.error('Error saving review settings:', error);
      toast.error('Error saving review settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Review Configuration</CardTitle>
          <CardDescription>
            Configure how reviews are collected and managed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReviewSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-approve positive reviews</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve reviews with {reviewData.reviewThreshold}+ stars
                  </p>
                </div>
                <Switch 
                  checked={reviewData.autoApprovePositive}
                  onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, autoApprovePositive: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Redirect positive reviews to Google</Label>
                  <p className="text-sm text-muted-foreground">
                    Send {reviewData.reviewThreshold}+ star reviewers to Google Reviews
                  </p>
                </div>
                <Switch 
                  checked={reviewData.redirectToGoogle}
                  onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, redirectToGoogle: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Collect negative feedback privately</Label>
                  <p className="text-sm text-muted-foreground">
                    Capture low ratings as private feedback
                  </p>
                </div>
                <Switch 
                  checked={reviewData.collectNegativePrivately}
                  onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, collectNegativePrivately: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require customer name</Label>
                  <p className="text-sm text-muted-foreground">
                    Make customer name mandatory for reviews
                  </p>
                </div>
                <Switch 
                  checked={reviewData.requireCustomerName}
                  onCheckedChange={(checked) => setReviewData(prev => ({ ...prev, requireCustomerName: checked }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="google-url">Google Reviews URL</Label>
                <Input
                  id="google-url"
                  placeholder="https://maps.google.com/..."
                  value={reviewData.googleReviewLink}
                  onChange={(e) => setReviewData(prev => ({ ...prev, googleReviewLink: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  URL where positive reviews will be redirected
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating-threshold">Positive Review Threshold</Label>
                <Input
                  id="rating-threshold"
                  type="number"
                  min="1"
                  max="5"
                  value={reviewData.reviewThreshold}
                  onChange={(e) => setReviewData(prev => ({ ...prev, reviewThreshold: parseInt(e.target.value) }))}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum rating to redirect to Google (1-5 stars)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thank-you-message">Custom Thank You Message</Label>
                <Textarea
                  id="thank-you-message"
                  placeholder="Thank you for your feedback! We appreciate your input..."
                  value={reviewData.thankYouMessage}
                  onChange={(e) => setReviewData(prev => ({ ...prev, thankYouMessage: e.target.value }))}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Message shown to customers who leave negative reviews
                </p>
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Review Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}