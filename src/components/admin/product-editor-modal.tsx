"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SafeImage } from "@/components/safe-image";
import { ADMIN_FOOD_GALLERY } from "@/lib/admin-gallery";
import {
  isLikelyImageFile,
  prepareImageForUpload,
} from "@/lib/image-file";
import type { Category, Product } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  image: "/food/C.PNG",
  images: ["/food/C.PNG"],
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
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([...ADMIN_FOOD_GALLERY]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = product ?? emptyProduct();
    setDraft({ ...base });
    setIngredientsText(base.ingredients.join(", "));
    setPendingImageFile(undefined);
    setPreviewUrl(null);
    setPicking(false);
    setSaving(false);
    setError(null);
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setGalleryLoading(true);
    fetch("/api/admin/gallery")
      .then(async (res) => {
        const data = (await res.json()) as { images?: string[] };
        if (cancelled) return;
        if (Array.isArray(data.images) && data.images.length > 0) {
          setGallery(data.images);
        }
      })
      .catch(() => {
        // Keep fallback list from ADMIN_FOOD_GALLERY
      })
      .finally(() => {
        if (!cancelled) setGalleryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

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

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!isLikelyImageFile(file)) {
      setError("Please choose a photo (JPG, PNG, or WebP)");
      return;
    }

    setPicking(true);
    try {
      const prepared = await prepareImageForUpload(file);
      setPendingImageFile(prepared);
      const url = URL.createObjectURL(prepared);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setDraft((prev) => ({
        ...prev,
        image: url,
        images: [url, ...(prev.images ?? []).filter((i) => i !== url)],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that photo");
    } finally {
      setPicking(false);
    }
  }

  async function save() {
    if (!canSave || saving) return;
    setError(null);
    setSaving(true);
    try {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed — try again");
    } finally {
      setSaving(false);
    }
  }

  const displayImage = previewUrl ?? draft.image;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-secondary/50 p-3 sm:items-center">
      <div className="absolute inset-0" onClick={saving ? undefined : onClose} aria-hidden />
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
            disabled={saving}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-bg disabled:opacity-50"
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
              {picking && (
                <div className="absolute inset-0 flex items-center justify-center bg-secondary/40">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {/*
                Native <label htmlFor> opens the picker more reliably on phones
                than a JS .click() on a display:none input. No capture= attribute
                so Android/iOS offer Gallery + Camera + Files.
              */}
              <label
                htmlFor="product-image-upload"
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-sm font-semibold text-secondary shadow-soft transition hover:bg-bg",
                  (picking || saving) && "pointer-events-none opacity-60",
                )}
              >
                {picking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {picking ? "Preparing…" : "Choose photo"}
              </label>
              <input
                id="product-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/*"
                className="sr-only"
                disabled={picking || saving}
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              Opens your gallery (or camera). Large photos are compressed before
              upload.
            </p>
            <p className="mt-2 text-xs text-muted">
              Or pick from site gallery
              {galleryLoading
                ? "…"
                : ` (${gallery.length} photos — all files in /food)`}
            </p>
            <div className="mt-2 max-h-64 overflow-y-auto rounded-2xl border border-border bg-bg p-2">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {gallery.map((src) => (
                  <button
                    key={src}
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setPendingImageFile(undefined);
                      setPreviewUrl(null);
                      setError(null);
                      setDraft((prev) => ({
                        ...prev,
                        image: src,
                        images: [src, ...(prev.images ?? []).filter((i) => i !== src)],
                      }));
                    }}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-xl border-2",
                      draft.image === src && !pendingImageFile
                        ? "border-primary"
                        : "border-transparent",
                    )}
                  >
                    <SafeImage src={src} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="pname">Name</Label>
            <Input
              id="pname"
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={isDrink ? "Orange Soda" : "Chicken Shawarma"}
              disabled={saving}
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
              disabled={saving}
              className="font-body w-full resize-none rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
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
                disabled={saving}
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
                  disabled={saving}
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
              disabled={saving}
              className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:border-primary disabled:opacity-60"
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
                disabled={saving}
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
              disabled={saving}
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

          {error && (
            <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={!canSave || saving || picking} onClick={save}>
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {pendingImageFile ? "Uploading…" : "Saving…"}
              </span>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
