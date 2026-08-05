"use client";

import Link from "next/link";
import { use } from "react";
import { ProductDetail } from "@/components/app/product-detail";
import { useCatalog } from "@/components/catalog-context";
import { Button } from "@/components/ui/button";

export default function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getProduct, ready } = useCatalog();
  const product = getProduct(id);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted">
        Loading...
      </div>
    );
  }

  if (!product || !product.available) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="text-lg font-semibold text-secondary">
          Product not available
        </p>
        <Link href="/app/home" className="mt-4 inline-block">
          <Button>Back to menu</Button>
        </Link>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}
