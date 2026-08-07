"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { ProductEditorModal } from "@/components/admin/product-editor-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeImage } from "@/components/safe-image";
import { useCatalog } from "@/components/catalog-context";
import type { Product } from "@/lib/types";
import { cn, formatCedi } from "@/lib/utils";

export default function AdminProductsPage() {
  const {
    products,
    upsertProduct,
    addProduct,
    removeProduct,
    toggleProductAvailable,
    usingFirebase,
    firebaseError,
  } = useCatalog();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [mode, setMode] = useState<"edit" | "create">("edit");
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === "all" || p.category === category;
      const matchQ =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [products, category, query]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function openCreate() {
    setMode("create");
    setEditing(null);
    setOpen(true);
  }

  function openEdit(product: Product) {
    setMode("edit");
    setEditing(product);
    setOpen(true);
  }

  async function handleSave(product: Product, imageFile?: File) {
    setSaving(true);
    try {
      if (mode === "create") {
        await addProduct(product, imageFile);
        flash(
          usingFirebase
            ? "Product added to Firebase"
            : "Product added — live on the menu",
        );
      } else {
        await upsertProduct(product, imageFile);
        flash(
          usingFirebase
            ? "Saved to Firebase — customer app synced"
            : "Product updated — customer app synced",
        );
      }
    } catch (err) {
      flash(err instanceof Error ? err.message : "Save failed");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Products</h1>
          <p className="text-sm text-muted">
            Edit image, name, description, price & prep time — changes appear
            instantly in the customer app
            {usingFirebase ? " (Firebase live)" : " (local until Firebase is connected)"}
          </p>
          {firebaseError && (
            <p className="mt-1 text-xs text-danger">{firebaseError}</p>
          )}
        </div>
        <Button className="gap-1.5" onClick={openCreate} disabled={saving}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {toast && (
        <div className="rounded-2xl bg-accent-light px-4 py-3 text-sm font-semibold text-accent">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["all", "shawarma", "packages", "drinks"].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs font-semibold capitalize",
                category === c
                  ? "bg-primary text-white"
                  : "bg-white text-secondary shadow-soft",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-[20px] bg-white shadow-card"
          >
            <div className="relative aspect-[16/10]">
              <SafeImage
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="400px"
              />
              <span
                className={cn(
                  "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase",
                  product.available
                    ? "bg-accent text-white"
                    : "bg-danger text-white",
                )}
              >
                {product.available ? "Available" : "Unavailable"}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-secondary">{product.name}</h3>
                  <p className="mt-0.5 text-xs capitalize text-muted">
                    {product.category} · {product.prepTime} min
                  </p>
                </div>
                <p className="font-bold text-primary">
                  {formatCedi(product.price)}
                </p>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted">
                {product.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await toggleProductAvailable(product.id);
                    flash(
                      product.available
                        ? "Hidden from customer menu"
                        : "Visible on customer menu",
                    );
                  }}
                >
                  {product.available ? "Set Unavailable" : "Set Available"}
                </Button>
                <Button size="sm" variant="soft" onClick={() => openEdit(product)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    if (confirm(`Delete ${product.name}?`)) {
                      await removeProduct(product.id);
                      flash("Product deleted");
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ProductEditorModal
        open={open}
        product={editing}
        mode={mode}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
