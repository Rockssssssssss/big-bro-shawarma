"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AllIcon,
  DrinkIcon,
  GiftPackageIcon,
  ShawarmaIcon,
} from "@/components/icons/category-icons";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/components/catalog-context";
import { useAuth } from "@/components/auth-context";
import { cn, greetingForHour, firstNameOf } from "@/lib/utils";

const categories = [
  { id: "all", label: "All", Icon: AllIcon },
  { id: "shawarma", label: "Shawarma", Icon: ShawarmaIcon },
  { id: "packages", label: "Packages", Icon: GiftPackageIcon },
  { id: "drinks", label: "Drinks", Icon: DrinkIcon },
] as const;

export function HomeContent() {
  const [category, setCategory] = useState<string>("all");
  const { productsByCategory, productsByTag, getProduct } = useCatalog();
  const { profile } = useAuth();
  const firstName = firstNameOf(profile?.name);

  const list = useMemo(
    () => productsByCategory(category),
    [category, productsByCategory],
  );
  const bestsellers = useMemo(
    () => productsByTag("bestseller"),
    [productsByTag],
  );
  const soloCombo = getProduct("solo-combo");

  const sectionTitle =
    category === "all"
      ? "Popular Today"
      : categories.find((c) => c.id === category)?.label ?? "Menu";

  return (
    <div className="space-y-5 px-4 pb-6 animate-fade-up">
      <div>
        <p className="text-sm text-muted">
          {firstName
            ? `${greetingForHour()}, ${firstName} 👋`
            : `${greetingForHour()} 👋`}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-secondary">
          What are you craving?
        </h2>
      </div>

      <section className="relative overflow-hidden rounded-[24px] bg-secondary shadow-card">
        <div className="relative z-10 flex min-h-[148px]">
          <div className="flex flex-1 flex-col justify-center p-5 pr-2">
            <p className="text-[10px] font-bold tracking-[0.16em] text-primary">
              TODAY&apos;S SPECIAL
            </p>
            <h3 className="mt-1 text-lg font-bold leading-snug text-white">
              Solo Combo for GH₵{soloCombo?.price ?? 55}
            </h3>
            <p className="mt-1 text-xs text-white/70">
              Shawarma + fries + drink. Perfect lunch.
            </p>
            <Link href="/app/product/solo-combo" className="mt-3 w-fit">
              <Button size="sm" className="h-9 px-4 text-xs">
                Order now
              </Button>
            </Link>
          </div>
          <div className="relative w-[42%] min-w-[130px]">
            <Image
              src={soloCombo?.image ?? "/food/combo-meal.jpg"}
              alt="Solo Combo"
              fill
              className="object-cover"
              sizes="160px"
              priority
            />
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map(({ id, label, Icon }) => {
          const active = category === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-medium transition",
                active
                  ? "border-primary bg-primary text-white shadow-soft"
                  : "border-border bg-white text-secondary hover:border-primary/40",
              )}
            >
              <Icon active={active} className="h-[18px] w-[18px]" />
              {label}
            </button>
          );
        })}
      </div>

      <section>
        <h3 className="mb-3 text-lg font-bold text-secondary">{sectionTitle}</h3>
        <div className="space-y-3">
          {list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {list.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">
              No items in this category yet.
            </p>
          )}
        </div>
      </section>

      {category === "all" && bestsellers.length > 0 && (
        <section>
          <h3 className="mb-3 text-lg font-bold text-secondary">Best Sellers</h3>
          <div className="space-y-3">
            {bestsellers.map((product) => (
              <ProductCard key={`bs-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
