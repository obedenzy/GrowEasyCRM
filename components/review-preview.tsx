'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Copy } from 'lucide-react';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { toast } from 'sonner';

interface ReviewPreviewProps {
  subaccountId: string;
  disableSubmit?: boolean; // Add disableSubmit prop
}

export function ReviewPreview({ subaccountId, disableSubmit }: ReviewPreviewProps) {
  const [reviewUrl, setReviewUrl] = useState('');
  
  useEffect(() => {
    setReviewUrl(`${window.location.origin}/reviews/${subaccountId}`);
  }, [subaccountId]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(reviewUrl).then(() => {
      toast.success('URL copied to clipboard!');
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="w-full">
          <Label htmlFor="review-url" className="text-sm font-medium">
            Customer Review URL
          </Label>
          <div className="flex items-center space-x-2 mt-2">
            <Input
              id="review-url"
              value={reviewUrl}
              readOnly
              className="flex-1 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyUrl}
              disabled={!reviewUrl}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-2">
        <div className="text-center text-sm text-gray-600 mb-2">
          <Eye className="h-4 w-4 inline mr-1" />
          Live Preview
        </div>
        <div className="max-h-[600px] overflow-auto border rounded-lg bg-white">
          <ReviewForm subaccountId={subaccountId} isPreview={true} disableSubmit={disableSubmit} />
        </div>
      </div>
    </div>
  );
}