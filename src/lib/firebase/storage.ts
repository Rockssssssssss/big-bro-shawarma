import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage, isFirebaseConfigured } from "@/lib/firebase";

/**
 * Upload a product image to Firebase Storage.
 * Accepts a File or a data: URL string from the admin editor.
 */
export async function uploadProductImage(
  productId: string,
  source: File | string,
): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Storage unavailable");

  let blob: Blob;
  let ext = "jpg";

  if (typeof source === "string") {
    if (source.startsWith("/")) {
      // Already a public path — keep as-is (no upload)
      return source;
    }
    if (source.startsWith("http://") || source.startsWith("https://")) {
      // Remote URL — keep as-is
      return source;
    }
    // data: or blob: — upload bytes
    const res = await fetch(source);
    blob = await res.blob();
    if (source.startsWith("data:")) {
      const match = source.match(/^data:image\/([\w+.-]+);/);
      if (match) {
        const raw = match[1].toLowerCase().replace("jpeg", "jpg");
        ext = raw.includes("png") ? "png" : raw.includes("webp") ? "webp" : "jpg";
      }
    } else {
      ext = blob.type.includes("png")
        ? "png"
        : blob.type.includes("webp")
          ? "webp"
          : "jpg";
    }
  } else {
    blob = source;
    const parts = source.name.split(".");
    const fromName = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
    ext =
      fromName === "jpeg" || fromName === "jpg"
        ? "jpg"
        : fromName === "png" || fromName === "webp"
          ? fromName
          : blob.type.includes("png")
            ? "png"
            : blob.type.includes("webp")
              ? "webp"
              : "jpg";
  }

  const contentType =
    blob.type && blob.type.startsWith("image/")
      ? blob.type
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";

  const path = `products/${productId}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}
