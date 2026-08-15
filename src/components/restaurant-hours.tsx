"use client";

import { useCatalog } from "@/components/catalog-context";

/** Live opening hours from settings/business (admin-editable). */
export function RestaurantHours({ className }: { className?: string }) {
  const { businessSettings } = useCatalog();
  return <span className={className}>{businessSettings.hours}</span>;
}
