import { useLocalStorage } from "../hooks/useLocaleStorage";

export const MIN_IMAGE_UPLOAD_SIZE = 1024; // 1KB;
export const MAX_IMAGE_UPLOAD_SIZE = 5e6; // 5MB
export const PRESIGNED_UPLOAD_IMAGE_EXPIRATION_DURATION = 5 * 60; // 5min

export const formatPreviewItemImageUrl = (patchId: string, itemId: string) =>
  formatImageUrl(formatPreviewItemImageKey(patchId, itemId));

export const formatPreviewResponseImageUrl = (id: string) =>
  formatImageUrl(formatPreviewResponseImageKey(id));

export const formatPreviewItemImageKey = (
  patchId: string,
  itemId: string,
  format = "webp"
) => `${patchId}/${itemId}_preview.${format}`;

export const formatPreviewResponseImageKey = (id: string, format = "webp") =>
  `response/${id}_preview.${format}`;

export const formatImageUrl = (imageKey: string) => STORAGE_BASE_URL + imageKey;

export function getFileExtension(file: File) {
  const ext = file.type.split("/")[1];
  if (!ext || !["jpg", "jpeg", "png"].includes(ext)) {
    throw new Error("invalid file type: " + file.type);
  }

  return ext;
}

export const IMAGE_BUCKET_NAME =
  process.env.NEXT_PUBLIC_MINIO_IMAGE_BUCKET_NAME || "circuspes-images";
export const STORAGE_BASE_URL = `https://${
  process.env.NEXT_PUBLIC_MINIO_ENDPOINT || ""
}/${IMAGE_BUCKET_NAME}/`;

export function useOpts() {
  return useLocalStorage("opts", {
    likeFinley: true,
  });
}
