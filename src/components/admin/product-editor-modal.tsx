"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SafeImage } from "@/components/safe-image";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

const GALLERY = [
  "/food/chicken-shawarma.jpg",
  "/food/beef-shawarma.jpg",
  "/food/mixed-shawarma.jpg",
  "/food/family-box.jpg",
  "/food/solo-combo.jpg",
  "/food/orange-soda.jpg",
  "/food/combo-meal.jpg",
  "/food/hero-shawarma.jpg",
  "/food/category-shawarma.jpg",
  "/food/category-packages.jpg",
  "/food/category-drinks.jpg",
];

interface ProductEditorModalProps {
  open: boolean;
  product: Product | null;
  mode: "edit" | "create";
  onClose: () => void;
  onSave: (product: Product, imageFile?: File) => void | Promise<void>;
}

const emptyProduct = (): Product => ({
  id: `custom-${Date.now()}`,
  name: "",
  description: "",
  ingredients: [],
  price: 0,
  prepTime: 10,
  image: "/food/chicken-shawarma.jpg",
  images: ["/food/chicken-shawarma.jpg"],
  category: "shawarma",
  rating: 4.5,
  tags: ["popular"],
  available: true,
});

export function ProductEditorModal({
  open,
  product,
  mode,
  onClose,
  onSave,
}: ProductEditorModalProps) {
  const [draft, setDraft] = useState<Product>(emptyProduct());
  const [ingredientsText, setIngredientsText] = useState("");
  const [pendingImageFile, setPendingImageFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const base = product ?? emptyProduct();
    setDraft({ ...base });
    setIngredientsText(base.ingredients.join(", "));
    setPendingImageFile(undefined);
    setPreviewUrl(null);
  }, [open, product]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const isDrink = draft.category === "drinks";

  const canSave = useMemo(() => {
    const hasBasics =
      draft.name.trim().length > 1 &&
      draft.description.trim().length > 1 &&
      draft.price > 0;
    if (isDrink) return hasBasics;
    return (
      hasBasics &&
      draft.prepTime > 0 &&
      !!draft.image
    );
  }, [draft, isDrink]);

  if (!open) return null;

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setPendingImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setDraft((prev) => ({
      ...prev,
      image: url,
      images: [url, ...(prev.images ?? []).filter((i) => i !== url)],
    }));
  }

  async function save() {
    if (!canSave) return;
    const ingredients = isDrink
      ? []
      : ingredientsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    await onSave(
      {
        ...draft,
        name: draft.name.trim(),
        description: draft.description.trim(),
        ingredients,
        prepTime: isDrink ? 5 : draft.prepTime,
        images: draft.images?.length ? draft.images : [draft.image],
      },
      pendingImageFile,
    );
    onClose();
  }

  const displayImage = previewUrl ?? draft.image;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-secondary/50 p-3 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-[24px] bg-white p-5 shadow-float animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg text-secondary">
            {mode === "create"
              ? isDrink
                ? "Add Drink"
                : "Add Product"
              : isDrink
                ? "Edit Drink"
                : "Edit Product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-bg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Image</Label>
            <div className="relative mt-1 aspect-[16/10] overflow-hidden rounded-2xl bg-bg">
              <SafeImage
                src={displayImage}
                alt={draft.name || "Product"}
                fill
                className="object-cover"
                sizes="480px"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                Upload from phone
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">Or pick from gallery</p>
            <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {GALLERY.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => {
                    setPendingImageFile(undefined);
                    setPreviewUrl(null);
                    setDraft((prev) => ({
                      ...prev,
                      image: src,
                      images: [src, ...(prev.images ?? []).filter((i) => i !== src)],
                    }));
                  }}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2",
                    draft.image === src && !pendingImageFile
                      ? "border-primary"
                      : "border-transparent",
                  )}
                >
                  <SafeImage src={src} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="pname">Name</Label>
            <Input
              id="pname"
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={isDrink ? "Orange Soda" : "Chicken Shawarma"}
            />
          </div>

          <div>
            <Label htmlFor="pdesc">Description</Label>
            <textarea
              id="pdesc"
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Short tasty description"
              className="font-body w-full resize-none rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className={cn("grid gap-3", isDrink ? "grid-cols-1" : "grid-cols-2")}>
            <div>
              <Label htmlFor="pprice">Price (GH₵)</Label>
              <Input
                id="pprice"
                type="number"
                min={1}
                step={0.5}
                value={draft.price || ""}
                onChange={(e) => update("price", Number(e.target.value))}
              />
            </div>
            {!isDrink && (
              <div>
                <Label htmlFor="ptime">Prep time (min)</Label>
                <Input
                  id="ptime"
                  type="number"
                  min={1}
                  value={draft.prepTime || ""}
                  onChange={(e) => update("prepTime", Number(e.target.value))}
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="pcat">Category</Label>
            <select
              id="pcat"
              value={draft.category}
              onChange={(e) => update("category", e.target.value as Category)}
              className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-primary"
            >
              <option value="shawarma">Shawarma</option>
              <option value="packages">Packages</option>
              <option value="drinks">Drinks</option>
            </select>
          </div>

          {!isDrink && (
            <div>
              <Label htmlFor="ping">Ingredients (comma separated)</Label>
              <Input
                id="ping"
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                placeholder="Chicken, garlic sauce, pita"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-bg px-4 py-3">
            <div>
              <p className="font-semibold text-secondary">Available</p>
              <p className="text-xs text-muted">Show on customer menu</p>
            </div>
            <button
              type="button"
              onClick={() => update("available", !draft.available)}
              className={cn(
                "relative h-7 w-12 rounded-full transition",
                draft.available ? "bg-primary" : "bg-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
                  draft.available ? "left-[22px]" : "left-0.5",
                )}
              />
            </button>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={!canSave} onClick={save}>
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
