"use client";

import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import { useCatalog } from "@/components/catalog-context";
import { formatCedi } from "@/lib/utils";

export function PopularProducts() {
  const { productsByTag } = useCatalog();
  const popular = productsByTag("popular").slice(0, 4);

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-secondary md:text-3xl">
          Popular Products
        </h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((p) => (
            <Link
              key={p.id}
              href={`/app/product/${p.id}`}
              className="overflow-hidden rounded-[20px] border border-border/60 bg-bg shadow-soft transition hover:shadow-card"
            >
              <div className="relative aspect-[4/3]">
                <SafeImage
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="300px"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-secondary">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted">
                  {p.description}
                </p>
                <p className="mt-3 font-bold text-primary">
                  {formatCedi(p.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
