"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "./page-header";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-context";
import { useCatalog } from "@/components/catalog-context";
import { SafeImage } from "@/components/safe-image";
import { extras } from "@/lib/data";
import { formatCedi } from "@/lib/utils";

export function CartView() {
  const { getProduct } = useCatalog();
  const {
    lines,
    subtotal,
    deliveryFee,
    total,
    amountToFreeDelivery,
    updateQuantity,
    removeItem,
    lineTotal,
  } = useCart();

  return (
    <div className="pb-[11.5rem] animate-fade-up">
      <PageHeader title="Your Cart" backHref="/app/home" />

      {lines.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-lg font-semibold text-secondary">Cart is empty</p>
          <p className="mt-2 text-sm text-muted">
            Add something delicious from the menu.
          </p>
          <Link href="/app/home" className="mt-6 inline-block">
            <Button>Browse Menu</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 px-4">
            {lines.map((line) => {
              const product = getProduct(line.productId);
              if (!product) return null;
              const extraNames = line.extras
                .map((id) => extras.find((e) => e.id === id)?.name)
                .filter(Boolean);
              return (
                <article
                  key={line.key}
                  className="relative flex gap-3 rounded-[20px] bg-white p-3 shadow-card"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
                    <SafeImage
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-secondary">
                          {product.name}
                        </h3>
                        <p className="mt-0.5 font-bold text-secondary">
                          {formatCedi(lineTotal(line) / line.quantity)}
                        </p>
                        {extraNames.length > 0 && (
                          <p className="mt-1 text-xs text-muted">
                            {extraNames.join(" · ")}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(line.key)}
                        className="rounded-full p-1.5 text-muted hover:bg-danger-light hover:text-danger"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <div className="flex items-center gap-1 rounded-full bg-bg p-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(line.key, line.quantity - 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full text-secondary"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(line.key, line.quantity + 1)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-white/50 bg-white/70 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(75,46,43,0.1)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/55">
            <div className="mb-3 space-y-1.5 rounded-[18px] bg-white/90 px-3.5 py-3 shadow-soft">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="font-semibold text-secondary">
                  {formatCedi(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted">Delivery Fee</span>
                <span className="font-semibold text-secondary">
                  {formatCedi(deliveryFee)}
                </span>
              </div>
              {amountToFreeDelivery > 0 && (
                <p className="text-xs text-muted">
                  Add {formatCedi(amountToFreeDelivery)} more for free delivery.
                </p>
              )}
              <div className="my-1.5 border-t border-border/80" />
              <div className="flex justify-between">
                <span className="font-bold text-secondary">Total</span>
                <span className="text-lg font-bold text-secondary">
                  {formatCedi(total)}
                </span>
              </div>
            </div>
            <Link href="/app/checkout">
              <Button size="xl" className="w-full justify-between px-5">
                <span>Proceed to Checkout</span>
                <span>{formatCedi(total)}</span>
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
