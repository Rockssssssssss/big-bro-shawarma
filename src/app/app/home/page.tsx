import { Suspense } from "react";
import { HomeContent } from "@/components/app/home-content";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center px-4">
          <p className="text-sm text-muted">Loading menu...</p>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
