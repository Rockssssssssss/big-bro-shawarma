"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  DrinkIcon,
  GiftPackageIcon,
  ShawarmaIcon,
} from "@/components/icons/category-icons";
import { ProductCard } from "./product-card";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/safe-image";
import { useCatalog } from "@/components/catalog-context";
import { useAuth } from "@/components/auth-context";
import { cn, greetingForHour, firstNameOf } from "@/lib/utils";

const categories = [
  { id: "shawarma", label: "Shawarma", Icon: ShawarmaIcon },
  { id: "packages", label: "Packages", Icon: GiftPackageIcon },
  { id: "drinks", label: "Drinks", Icon: DrinkIcon },
] as const;

type CategoryId = (typeof categories)[number]["id"];

function isCategoryId(value: string | null): value is CategoryId {
  return categories.some((c) => c.id === value);
}

function CategoryButtonGrid({
  category,
  onSelect,
}: {
  category: CategoryId | null;
  onSelect: (id: CategoryId) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 px-4 pb-3">
      {categories.map(({ id, label, Icon }) => {
        const active = category === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 rounded-full border px-2 py-2.5 text-xs font-medium transition sm:text-sm",
              active
                ? "border-primary bg-primary text-white shadow-soft"
                : "border-border bg-white text-secondary hover:border-primary/40",
            )}
          >
            <Icon active={active} className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function CategoryButtons({
  category,
  onSelect,
}: {
  category: CategoryId | null;
  onSelect: (id: CategoryId) => void;
}) {
  return <CategoryButtonGrid category={category} onSelect={onSelect} />;
}

export function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get("category");
  const category = isCategoryId(rawCategory) ? rawCategory : null;
  const isDefaultHome = category === null;

  const { productsByCategory, productsByIds, getProduct, homeSettings } =
    useCatalog();
  const { profile } = useAuth();
  const firstName = firstNameOf(profile?.name);

  const todaysSpecial = getProduct(homeSettings.todaysSpecialId);
  const popularToday = useMemo(
    () => productsByIds(homeSettings.popularTodayIds),
    [homeSettings.popularTodayIds, productsByIds],
  );
  const bestSellers = useMemo(
    () => productsByIds(homeSettings.bestSellerIds),
    [homeSettings.bestSellerIds, productsByIds],
  );

  const categoryList = useMemo(
    () => (category ? productsByCategory(category) : []),
    [category, productsByCategory],
  );

  function selectCategory(id: CategoryId) {
    router.push(`/app/home?category=${id}`);
  }

  if (!isDefaultHome && category) {
    return (
      <>
        <header className="sticky top-0 z-20 w-full shrink-0 border-b border-border/50 bg-bg backdrop-blur-xl supports-[backdrop-filter]:bg-bg/97">
          <div className="px-4 pb-2 pt-2">
            <p className="font-body text-sm text-muted">
              {firstName
                ? `${greetingForHour()}, ${firstName} 👋`
                : `${greetingForHour()} 👋`}
            </p>
          </div>
          <CategoryButtonGrid
            category={category}
            onSelect={selectCategory}
          />
        </header>

        <section className="space-y-3 px-4 pb-6 pt-4">
          {categoryList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {categoryList.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">
              No items in this category yet.
            </p>
          )}
        </section>
      </>
    );
  }

  return (
    <div className="space-y-5 px-4 pb-6 animate-fade-up">
      <div>
        <p className="font-body text-sm text-muted">
          {firstName
            ? `${greetingForHour()}, ${firstName} 👋`
            : `${greetingForHour()} 👋`}
        </p>
        <h2 className="font-heading mt-1 text-2xl tracking-tight text-secondary">
          What are you craving?
        </h2>
      </div>

      {todaysSpecial && (
        <section className="relative overflow-hidden rounded-[24px] bg-secondary shadow-card">
          <div className="relative z-10 flex min-h-[148px]">
            <div className="flex flex-1 flex-col justify-center p-5 pr-2">
              <p className="text-[10px] font-bold tracking-[0.16em] text-primary">
                TODAY&apos;S SPECIAL
              </p>
              <h3 className="font-heading mt-1 text-lg leading-snug text-white">
                {todaysSpecial.name} for GH₵{todaysSpecial.price}
              </h3>
              <p className="font-body mt-1 text-xs text-white/70">
                {todaysSpecial.description}
              </p>
              <Link href={`/app/product/${todaysSpecial.id}`} className="mt-3 w-fit">
                <Button size="sm" className="h-9 px-4 text-xs">
                  Order now
                </Button>
              </Link>
            </div>
            <div className="relative w-[42%] min-w-[130px] bg-secondary">
              <SafeImage
                src={todaysSpecial.image}
                alt={todaysSpecial.name}
                fill
                className="object-cover"
                sizes="160px"
                priority
              />
            </div>
          </div>
        </section>
      )}

      <div>
        <h3 className="font-heading mb-3 text-lg text-secondary">Browse menu</h3>
        <CategoryButtons category={category} onSelect={selectCategory} />
      </div>

      {popularToday.length > 0 && (
        <section>
          <h3 className="font-heading mb-3 text-lg text-secondary">
            Popular Today
          </h3>
          <div className="space-y-3">
            {popularToday.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {bestSellers.length > 0 && (
        <section>
          <h3 className="font-heading mb-3 text-lg text-secondary">
            Best Sellers
          </h3>
          <div className="space-y-3">
            {bestSellers.map((product) => (
              <ProductCard key={`bs-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
