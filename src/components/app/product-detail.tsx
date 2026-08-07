"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-context";
import { useCartToast } from "@/components/cart-toast-provider";
import { SafeImage } from "@/components/safe-image";
import { extras } from "@/lib/data";
import type { Product } from "@/lib/types";
import { cn, formatCedi } from "@/lib/utils";

export function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { showCartToast } = useCartToast();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [imgIndex, setImgIndex] = useState(0);
  const [added, setAdded] = useState(false);

  const images = product.images?.length ? product.images : [product.image];

  const unitPrice = useMemo(() => {
    const extraSum = selected.reduce((sum, id) => {
      const e = extras.find((x) => x.id === id);
      return sum + (e?.price ?? 0);
    }, 0);
    return product.price + extraSum;
  }, [product.price, selected]);

  const total = unitPrice * qty;

  function toggleExtra(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleAdd() {
    addItem(product.id, qty, selected);
    showCartToast(product.category);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="pb-28 animate-fade-up">
      <PageHeader title="Product Details" backHref="/app/home" />
      <div className="relative mx-4 aspect-[4/3] overflow-hidden rounded-[24px] bg-white shadow-card">
        <SafeImage
          src={images[imgIndex]}
          alt={product.name}
          fill
          className="object-cover"
          sizes="400px"
          priority
        />
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setImgIndex(i)}
                className={cn(
                  "h-2 w-2 rounded-full transition",
                  i === imgIndex ? "bg-primary" : "bg-white/70",
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5 px-4 pt-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold text-secondary">{product.name}</h2>
            <p className="shrink-0 text-xl font-bold text-primary">
              {formatCedi(product.price)}
            </p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {product.description}
          </p>
          <p className="mt-2 text-xs text-muted">{product.prepTime} min prep</p>
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-secondary">Ingredients</h3>
          <div className="flex flex-wrap gap-2">
            {product.ingredients.map((item) => (
              <span
                key={item}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-secondary shadow-soft"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {product.category !== "drinks" && (
          <div>
            <h3 className="mb-2 font-semibold text-secondary">Customize</h3>
            <div className="space-y-2">
              {extras.map((extra) => {
                const on = selected.includes(extra.id);
                return (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border bg-white px-4 py-3.5 text-left transition",
                      on
                        ? "border-primary shadow-soft"
                        : "border-transparent shadow-card",
                    )}
                  >
                    <span className="font-medium text-secondary">
                      {extra.name}
                    </span>
                    <span className="flex items-center gap-2 text-sm text-muted">
                      +{formatCedi(extra.price)}
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border",
                          on
                            ? "border-primary bg-primary text-white"
                            : "border-border",
                        )}
                      >
                        {on && <Check className="h-3 w-3" />}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="font-semibold text-secondary">Quantity</p>
          <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-card">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full text-secondary hover:bg-bg"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-bold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-border/60 bg-bg/95 px-4 py-4 backdrop-blur">
        <Button
          size="xl"
          className="w-full justify-between px-5"
          onClick={handleAdd}
        >
          <span>{added ? "Added!" : "Add to Cart"}</span>
          <span>{formatCedi(total)}</span>
        </Button>
      </div>
    </div>
  );
}
