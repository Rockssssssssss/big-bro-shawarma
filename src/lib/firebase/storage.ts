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
    if (!source.startsWith("data:")) {
      // Remote URL — keep as-is
      return source;
    }
    const res = await fetch(source);
    blob = await res.blob();
    const match = source.match(/^data:image\/(\w+);/);
    if (match) ext = match[1] === "jpeg" ? "jpg" : match[1];
  } else {
    blob = source;
    const parts = source.name.split(".");
    ext = parts[parts.length - 1] || "jpg";
  }

  const path = `products/${productId}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, {
    contentType: blob.type || `image/${ext}`,
  });
  return getDownloadURL(storageRef);
}
