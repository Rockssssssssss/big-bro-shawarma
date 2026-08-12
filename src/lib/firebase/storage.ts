import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage, isFirebaseConfigured } from "@/lib/firebase";

const UPLOAD_FAIL_MS = 60_000;

function withFailFast<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out. Check Firebase Storage is enabled and your network, then try again.`,
        ),
      );
    }, UPLOAD_FAIL_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Upload a product image to Firebase Storage.
 * Accepts a File or a data: URL string from the admin editor.
 * Do not pass blob: URLs — callers should pass the File instead.
 */
export async function uploadProductImage(
  productId: string,
  source: File | string,
): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured");
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim()) {
    throw new Error(
      "Firebase Storage bucket is missing (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET).",
    );
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
    if (source.startsWith("blob:")) {
      throw new Error(
        "Image preview expired before upload. Please choose the photo again.",
      );
    }
    // data: — upload bytes
    const res = await fetch(source);
    if (!res.ok) {
      throw new Error("Could not read the selected image for upload.");
    }
    blob = await res.blob();
    const match = source.match(/^data:image\/([\w+.-]+);/);
    if (match) {
      const raw = match[1].toLowerCase().replace("jpeg", "jpg");
      ext = raw.includes("png") ? "png" : raw.includes("webp") ? "webp" : "jpg";
    }
  } else {
    if (!source.size) {
      throw new Error("Selected image is empty. Please choose another photo.");
    }
    blob = source;
    const parts = source.name.split(".");
    const fromName =
      parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
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

  try {
    await withFailFast(
      uploadBytes(storageRef, blob, { contentType }),
      "Image upload",
    );
    return await withFailFast(getDownloadURL(storageRef), "Getting image URL");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timed out")) throw err instanceof Error ? err : new Error(msg);
    if (/unauthorized|permission|storage\/unauthorized/i.test(msg)) {
      throw new Error(
        "Upload blocked by Storage permissions. Check Firebase Storage rules.",
      );
    }
    if (/storage\/|firebase/i.test(msg)) {
      throw new Error(`Upload failed: ${msg}`);
    }
    throw err instanceof Error ? err : new Error(msg);
  }
}
