const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif|bmp|avif)$/i;
const MAX_EDGE = 1600;
const MAX_BYTES_BEFORE_COMPRESS = 1.2 * 1024 * 1024;
const JPEG_QUALITY = 0.85;
const DECODE_FAIL_MS = 8_000;

/** True for common phone gallery / camera picks, even when MIME is blank. */
export function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (!file.type && IMAGE_EXT.test(file.name)) return true;
  return false;
}

function isHeicLike(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    /\.heic$/i.test(file.name) ||
    /\.heif$/i.test(file.name)
  );
}

function decodeBitmap(file: File): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Image decode timed out"));
    }, DECODE_FAIL_MS);
    createImageBitmap(file).then(
      (bitmap) => {
        clearTimeout(timer);
        resolve(bitmap);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Resize/compress large phone photos to JPEG so Firebase uploads stay reliable
 * on mobile networks. Falls back to the original file if canvas decode fails
 * for supported formats; HEIC that cannot decode is rejected with a clear error.
 */
export async function prepareImageForUpload(file: File): Promise<File> {
  if (!isLikelyImageFile(file)) {
    throw new Error("Please choose an image file (JPG, PNG, or WebP)");
  }

  const needsWork =
    file.size > MAX_BYTES_BEFORE_COMPRESS ||
    !file.type ||
    isHeicLike(file);

  if (
    !needsWork &&
    (file.type === "image/jpeg" ||
      file.type === "image/png" ||
      file.type === "image/webp")
  ) {
    return file;
  }

  try {
    const bitmap = await decodeBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "product";
    return new File([blob], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    if (isHeicLike(file)) {
      throw new Error(
        "This HEIC photo couldn't be processed. Please choose a JPG or PNG, or change your camera to Most Compatible.",
      );
    }
    // Keep original — upload may still succeed for JPEG/PNG from gallery
    return file;
  }
}
