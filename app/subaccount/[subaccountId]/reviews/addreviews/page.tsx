import { ReviewForm } from '@/components/reviews/ReviewForm';

export default function AddReviewPage({
  params,
}: {
  params: { subaccountId: string };
}) {
  return <ReviewForm subaccountId={params.subaccountId} />;
}