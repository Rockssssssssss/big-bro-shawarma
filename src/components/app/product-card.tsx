"use client";

import Link from "next/link";
import { Clock, Plus } from "lucide-react";
import { useCart } from "@/components/cart-context";
import { useCartToast } from "@/components/cart-toast-provider";
import { SafeImage } from "@/components/safe-image";
import type { Product } from "@/lib/types";
import { formatCedi } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { showCartToast } = useCartToast();

  function handleAdd() {
    addItem(product.id);
    showCartToast(product.category);
  }

  return (
    <article className="relative flex gap-3 rounded-[20px] bg-white p-3 shadow-card">
      <Link
        href={`/app/product/${product.id}`}
        className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-2xl bg-border/40"
      >
        <SafeImage
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="92px"
        />
      </Link>
      <div className="min-w-0 flex-1 pr-8">
        <Link href={`/app/product/${product.id}`}>
          <h3 className="font-heading truncate text-secondary">
            {product.name}
          </h3>
          <p className="font-body mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">
            {product.description}
          </p>
        </Link>
        <div className="mt-2 flex items-center gap-1 text-xs text-muted">
          <Clock className="h-3.5 w-3.5" />
          {product.prepTime} min
        </div>
        <p className="font-price mt-1.5 text-secondary">
          {formatCedi(product.price)}
        </p>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-soft transition hover:bg-primary-dark active:scale-95"
        aria-label={`Add ${product.name}`}
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </article>
  );
}
