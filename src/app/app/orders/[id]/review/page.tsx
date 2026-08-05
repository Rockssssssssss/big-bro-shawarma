import { ReviewView } from "@/components/app/review-view";

export default async function OrderReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReviewView orderId={id} />;
}
